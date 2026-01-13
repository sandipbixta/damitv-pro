// IPTV Channel Matcher Utility
// Fuzzy matching to find IPTV channels for sports matches

/**
 * Normalize text for matching
 */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special chars
    .replace(/\s+/g, ' ')         // Normalize whitespace
    .trim();
}

/**
 * Extract team names from match title
 */
export function extractTeams(matchTitle: string): string[] {
  const normalized = normalize(matchTitle);
  
  // Common separators
  const separators = [' vs ', ' v ', ' versus ', ' - ', ' at '];
  
  for (const sep of separators) {
    if (normalized.includes(sep)) {
      const parts = normalized.split(sep);
      if (parts.length >= 2) {
        return [parts[0].trim(), parts[1].trim()];
      }
    }
  }
  
  return [];
}

/**
 * Calculate similarity score between two strings (0-1)
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const s1 = normalize(str1);
  const s2 = normalize(str2);
  
  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;
  
  // Check for substring match
  if (s1.includes(s2) || s2.includes(s1)) {
    return 0.8;
  }
  
  // Word overlap
  const words1 = new Set(s1.split(' '));
  const words2 = new Set(s2.split(' '));
  
  let overlap = 0;
  words1.forEach(word => {
    if (words2.has(word) && word.length > 2) {
      overlap++;
    }
  });
  
  const maxWords = Math.max(words1.size, words2.size);
  return maxWords > 0 ? overlap / maxWords : 0;
}

/**
 * Sport-specific channel keywords
 */
export const SPORT_CHANNEL_KEYWORDS: Record<string, string[]> = {
  'football': [
    'sky sports', 'bt sport', 'premier league', 'espn', 'bein sports',
    'dazn', 'supersport', 'fox soccer', 'nbc sports', 'optus sport',
    'laliga', 'bundesliga', 'serie a', 'ligue 1', 'champions league'
  ],
  'soccer': [
    'sky sports', 'bt sport', 'premier league', 'espn', 'bein sports',
    'dazn', 'supersport', 'fox soccer', 'nbc sports'
  ],
  'american-football': [
    'espn', 'nfl network', 'fox sports', 'nbc sports', 'cbs sports',
    'abc', 'sunday ticket', 'redzone', 'sec network'
  ],
  'basketball': [
    'espn', 'tnt', 'nba tv', 'nbc sports', 'abc', 'league pass'
  ],
  'tennis': [
    'tennis channel', 'espn', 'sky sports', 'eurosport', 'bein sports'
  ],
  'mma': [
    'espn', 'ufc', 'fight network', 'bt sport', 'fox sports'
  ],
  'boxing': [
    'dazn', 'showtime', 'hbo', 'espn', 'sky sports', 'bt sport'
  ],
  'hockey': [
    'espn', 'nhl network', 'nbc sports', 'sportsnet', 'tsn'
  ],
  'baseball': [
    'espn', 'mlb network', 'fox sports', 'tbs', 'bally sports'
  ],
  'motorsport': [
    'sky sports f1', 'espn', 'fox sports', 'nbc sports', 'sky sports'
  ],
  'cricket': [
    'sky sports cricket', 'star sports', 'willow tv', 'bt sport'
  ],
  'rugby': [
    'sky sports', 'bt sport', 'stan sport', 'supersport'
  ],
};

/**
 * Get relevant channel keywords for a sport
 */
export function getChannelKeywords(sport: string): string[] {
  const normalized = normalize(sport);
  
  // Direct match
  if (SPORT_CHANNEL_KEYWORDS[normalized]) {
    return SPORT_CHANNEL_KEYWORDS[normalized];
  }
  
  // Partial match
  for (const [key, keywords] of Object.entries(SPORT_CHANNEL_KEYWORDS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return keywords;
    }
  }
  
  // Default sports channels
  return ['espn', 'fox sports', 'sky sports', 'bt sport', 'bein sports'];
}

/**
 * Score a channel name against a match
 */
export function scoreChannelForMatch(
  channelName: string,
  matchTitle: string,
  sport?: string,
  league?: string
): number {
  let score = 0;
  const normalizedChannel = normalize(channelName);
  const teams = extractTeams(matchTitle);
  
  // Team name match (highest priority)
  teams.forEach(team => {
    const teamWords = team.split(' ');
    teamWords.forEach(word => {
      if (word.length > 3 && normalizedChannel.includes(word)) {
        score += 50;
      }
    });
  });
  
  // League match
  if (league) {
    const leagueWords = normalize(league).split(' ');
    leagueWords.forEach(word => {
      if (word.length > 2 && normalizedChannel.includes(word)) {
        score += 30;
      }
    });
  }
  
  // Sport-specific channel keywords
  if (sport) {
    const keywords = getChannelKeywords(sport);
    keywords.forEach(keyword => {
      if (normalizedChannel.includes(normalize(keyword))) {
        score += 20;
      }
    });
  }
  
  // General sports network bonus
  const generalNetworks = ['espn', 'fox sports', 'sky sports', 'bt sport'];
  generalNetworks.forEach(network => {
    if (normalizedChannel.includes(network)) {
      score += 10;
    }
  });
  
  return score;
}

/**
 * Check if a channel is a generic sports channel (fallback option)
 */
export function isGenericSportsChannel(channelName: string): boolean {
  const normalized = normalize(channelName);
  const genericKeywords = [
    'sports', 'espn', 'fox sports', 'sky sports', 'bt sport',
    'bein', 'supersport', 'dazn', 'eurosport'
  ];
  
  return genericKeywords.some(kw => normalized.includes(kw));
}
