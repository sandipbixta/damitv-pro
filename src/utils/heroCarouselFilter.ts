import { Match } from '@/types/sports';
import { isMatchLive } from './matchUtils';
import { enrichMatchesWithViewers } from '@/services/viewerCountService';

// Minimum viewer count to qualify as "hot" (500+)
const HOT_VIEWER_THRESHOLD = 500;

// Top-tier leagues and competitions (highest priority)
const ELITE_COMPETITIONS = [
  // Top 5 European leagues
  'premier league', 'epl', 'english premier',
  'la liga', 'laliga', 'spanish la liga',
  'serie a', 'italian serie',
  'bundesliga', 'german bundesliga',
  'ligue 1', 'ligue1', 'french ligue',
  
  // UEFA competitions
  'champions league', 'ucl', 'uefa champions',
  'europa league', 'uel', 'uefa europa',
  
  // Major international
  'world cup', 'euro', 'copa america', 'nations league',
  
  // Fighting
  'ufc', 'mma', 'bellator', 'fight night', 'ppv',
  
  // Wrestling
  'wwe', 'wrestlemania', 'summerslam', 'royal rumble', 'crown jewel',
  'aew', 'all elite wrestling',
];

// Elite clubs that always feature in carousel
const ELITE_CLUBS = [
  // La Liga
  'real madrid', 'barcelona', 'atletico madrid',
  
  // Premier League
  'manchester united', 'liverpool', 'manchester city', 'chelsea', 'arsenal', 'tottenham',
  
  // Serie A
  'juventus', 'inter milan', 'ac milan', 'napoli',
  
  // Bundesliga
  'bayern munich', 'borussia dortmund',
  
  // Ligue 1
  'psg', 'paris saint-germain',
  
  // Special high-profile clubs
  'inter miami', 'al nassr', 'al-nassr',
];

// Elite national teams
const ELITE_COUNTRIES = [
  'argentina', 'france', 'spain', 'england', 'brazil', 
  'germany', 'italy', 'portugal', 'netherlands', 'belgium',
];

// High-profile derbies and rivalries
const ELITE_DERBIES = [
  'el clasico', 'el clásico', 'real madrid.*barcelona', 'barcelona.*real madrid',
  'manchester.*derby', 'north london.*derby', 'merseyside.*derby',
  'milan.*derby', 'madrid.*derby',
];

/**
 * Check if match is elite tier (highest priority for carousel)
 */
const isEliteMatch = (match: Match): boolean => {
  const title = match.title.toLowerCase();
  const category = (match.category || '').toLowerCase();
  
  // Check elite competitions
  if (ELITE_COMPETITIONS.some(comp => title.includes(comp) || category.includes(comp))) {
    return true;
  }
  
  // Check elite clubs
  if (ELITE_CLUBS.some(club => title.includes(club))) {
    return true;
  }
  
  // Check elite countries
  if (ELITE_COUNTRIES.some(country => title.includes(country))) {
    return true;
  }
  
  // Check elite derbies
  if (ELITE_DERBIES.some(derby => new RegExp(derby).test(title))) {
    return true;
  }
  
  // All UFC/MMA/WWE events are elite
  if (category.includes('ufc') || category.includes('mma') || 
      category.includes('wwe') || category.includes('fight') || 
      category.includes('wrestling') || category.includes('boxing')) {
    return true;
  }
  
  return false;
};

/**
 * Calculate match priority score for carousel sorting
 */
const calculateCarouselPriority = (match: Match): number => {
  let score = 0;
  const title = match.title.toLowerCase();
  
  // 1. Viewer count boost (highest priority)
  if (match.viewerCount && match.viewerCount >= HOT_VIEWER_THRESHOLD) {
    score += 100 + (match.viewerCount / 100); // Massive boost for high viewers
  }
  
  // 2. Live status
  if (isMatchLive(match)) {
    score += 50;
  }
  
  // 3. Elite match boost
  if (isEliteMatch(match)) {
    score += 40;
  }
  
  // 4. Special event bonuses
  if (title.includes('final')) score += 30;
  if (title.includes('semi')) score += 20;
  if (title.includes('clasico') || title.includes('derby')) score += 25;
  
  // 5. Recency bonus (upcoming matches within 24 hours)
  const hoursUntilMatch = (match.date - Date.now()) / (1000 * 60 * 60);
  if (hoursUntilMatch > 0 && hoursUntilMatch <= 24) {
    score += 15;
  }
  
  return score;
};

/**
 * Get matches for hero carousel with strict filtering
 * Only shows elite matches with high viewer counts or major significance
 */
export const getCarouselMatches = async (
  allMatches: Match[], 
  limit: number = 8
): Promise<Match[]> => {
  // 1. Filter for matches with posters (visual requirement)
  const matchesWithPosters = allMatches.filter(
    match => match.poster && match.poster.trim() !== ''
  );
  
  // 2. Filter for elite matches only
  const eliteMatches = matchesWithPosters.filter(isEliteMatch);
  
  // 3. Filter for live or upcoming within 14 days
  const now = Date.now();
  const fourteenDaysFromNow = now + (14 * 24 * 60 * 60 * 1000);
  const relevantMatches = eliteMatches.filter(match => {
    const matchTime = new Date(match.date).getTime();
    return matchTime <= fourteenDaysFromNow;
  });
  
  // 4. Enrich with viewer counts
  const enrichedMatches = await enrichMatchesWithViewers(relevantMatches);
  
  // 5. Filter for high-profile matches (elite OR high viewers)
  const carouselCandidates = enrichedMatches.filter(match => {
    const hasHighViewers = match.viewerCount && match.viewerCount >= HOT_VIEWER_THRESHOLD;
    const isTopTier = isEliteMatch(match);
    return hasHighViewers || isTopTier;
  });
  
  // 6. Sort by priority score
  const sortedMatches = carouselCandidates.sort((a, b) => {
    return calculateCarouselPriority(b) - calculateCarouselPriority(a);
  });
  
  // 7. Return top matches
  return sortedMatches.slice(0, limit);
};

/**
 * Check if match should show "HOT" badge
 */
export const isHotMatch = (match: Match): boolean => {
  return (match.viewerCount && match.viewerCount >= HOT_VIEWER_THRESHOLD) || false;
};

/**
 * Format viewer count for display (with K/M suffixes)
 */
export const formatViewerCount = (count: number): string => {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toLocaleString();
};
