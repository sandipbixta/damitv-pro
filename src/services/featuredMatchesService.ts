const SPORTSDB_API_V1 = 'https://www.thesportsdb.com/api/v1/json/751945';
const WESTREAM_API = 'https://westream.su';

// ============================================
// POPULAR LEAGUES (High Priority)
// ============================================

const POPULAR_LEAGUES: Record<string, number> = {
  // Football - Top Tier
  'english premier league': 200,
  'premier league': 200,
  'uefa champions league': 200,
  'champions league': 200,
  'la liga': 180,
  'serie a': 170,
  'bundesliga': 170,
  'ligue 1': 150,
  'uefa europa league': 150,
  'europa league': 150,
  'uefa conference league': 130,
  'conference league': 130,
  'world cup': 250,
  'euro': 220,
  'copa america': 200,
  'fa cup': 130,
  'carabao cup': 100,
  'copa del rey': 120,
  'mls': 80,
  
  // Basketball
  'nba': 200,
  'nba finals': 250,
  'nba playoffs': 220,
  'euroleague': 120,
  'ncaa': 150,
  
  // American Football
  'nfl': 200,
  'super bowl': 300,
  
  // Baseball
  'mlb': 150,
  
  // Combat Sports
  'ufc': 200,
  'bellator': 120,
  'boxing': 180,
  'wwe': 150,
  
  // Motorsport
  'formula 1': 200,
  'f1': 200,
  'motogp': 150,
  
  // Cricket
  'ipl': 180,
  'big bash': 120,
};

// ============================================
// POPULAR TEAMS (Bonus Points)
// ============================================

const POPULAR_TEAMS: string[] = [
  // Football
  'manchester united', 'manchester city', 'liverpool', 'arsenal', 'chelsea',
  'tottenham', 'real madrid', 'barcelona', 'atletico madrid', 'bayern munich',
  'borussia dortmund', 'psg', 'paris saint-germain', 'juventus', 'ac milan',
  'inter milan', 'napoli', 'ajax', 'benfica', 'porto', 'rangers', 'celtic',
  'slovan bratislava', 'sparta praha', 'ferencvaros', 'az alkmaar',
  
  // NBA
  'lakers', 'los angeles lakers', 'celtics', 'boston celtics', 'warriors',
  'golden state warriors', 'bulls', 'chicago bulls', 'heat', 'miami heat',
  'knicks', 'new york knicks', 'nets', 'brooklyn nets', 'bucks', 'suns',
  'mavericks', 'nuggets', 'clippers', '76ers', 'sixers', 'spurs', 'san antonio',
  
  // NFL
  'chiefs', 'kansas city chiefs', 'eagles', 'philadelphia eagles',
  'cowboys', 'dallas cowboys', '49ers', 'san francisco 49ers',
  'bills', 'buffalo bills', 'ravens', 'patriots', 'packers', 'bears',
  
  // NHL
  'maple leafs', 'toronto maple leafs', 'canadiens', 'montreal canadiens',
  'bruins', 'boston bruins', 'rangers', 'new york rangers', 'penguins',
  'blackhawks', 'red wings', 'oilers', 'avalanche', 'lightning', 'kings',
  'los angeles kings', 'kraken', 'flames', 'panthers', 'florida panthers',
  
  // MLB
  'yankees', 'new york yankees', 'red sox', 'boston red sox',
  'dodgers', 'los angeles dodgers', 'cubs', 'chicago cubs',
];

// ============================================
// CALCULATE MATCH POPULARITY SCORE
// ============================================

const calculatePopularityScore = (match: any): number => {
  let score = 0;
  
  const title = (match.title || '').toLowerCase();
  const category = (match.category || '').toLowerCase();
  const homeTeam = (match.teams?.home?.name || '').toLowerCase();
  const awayTeam = (match.teams?.away?.name || '').toLowerCase();
  
  // League/title score
  for (const [leagueName, points] of Object.entries(POPULAR_LEAGUES)) {
    if (title.includes(leagueName)) {
      score += points;
      break;
    }
  }
  
  // Category bonus
  if (category === 'basketball') score += 50;
  if (category === 'hockey') score += 50;
  if (category === 'football') score += 30;
  
  // Team bonus (30 points per popular team)
  POPULAR_TEAMS.forEach(team => {
    if (homeTeam.includes(team) || team.includes(homeTeam)) score += 30;
    if (awayTeam.includes(team) || team.includes(awayTeam)) score += 30;
  });
  
  // Popular flag bonus
  if (match.popular) score += 20;
  
  // Starting soon bonus
  if (match.date) {
    const now = Date.now();
    const hoursUntil = (match.date - now) / (1000 * 60 * 60);
    
    if (hoursUntil >= 0 && hoursUntil <= 6) {
      score += 40; // Starting within 6 hours
    } else if (hoursUntil > 0 && hoursUntil <= 24) {
      score += 20; // Today
    }
  }
  
  return score;
};

// ============================================
// FETCH EVENT IMAGES FROM THESPORTSDB
// Try: thumb -> banner -> poster -> fanart
// ============================================

const fetchEventImages = async (homeTeam: string, awayTeam: string): Promise<{
  image: string | null;
  homeBadge: string | null;
  awayBadge: string | null;
}> => {
  try {
    const eventName = `${homeTeam}_vs_${awayTeam}`.replace(/ /g, '_');
    const response = await fetch(
      `${SPORTSDB_API_V1}/searchevents.php?e=${encodeURIComponent(eventName)}`,
      { signal: AbortSignal.timeout(5000) }
    );
    
    if (response.ok) {
      const data = await response.json();
      if (data.event && data.event.length > 0) {
        const event = data.event[0];
        // Priority: thumb -> banner -> poster -> square -> fanart
        const image = event.strThumb || event.strBanner || event.strPoster || 
                      event.strSquare || event.strFanart || null;
        return {
          image,
          homeBadge: event.strHomeTeamBadge || null,
          awayBadge: event.strAwayTeamBadge || null,
        };
      }
    }
  } catch (e) {
    // Ignore timeout/errors
  }
  
  return { image: null, homeBadge: null, awayBadge: null };
};

// ============================================
// FETCH TEAM INFO - Try multiple image types
// ============================================

const fetchTeamInfo = async (teamName: string): Promise<{ 
  badge: string | null; 
  image: string | null;
}> => {
  if (!teamName || teamName === 'TBA') return { badge: null, image: null };
  
  try {
    const response = await fetch(
      `${SPORTSDB_API_V1}/searchteams.php?t=${encodeURIComponent(teamName)}`,
      { signal: AbortSignal.timeout(5000) }
    );
    
    if (response.ok) {
      const data = await response.json();
      if (data.teams && data.teams.length > 0) {
        const team = data.teams[0];
        // Priority for background: banner -> fanart1 -> fanart2 -> fanart3 -> fanart4
        const image = team.strBanner || team.strFanart1 || team.strTeamFanart1 || 
                      team.strFanart2 || team.strTeamFanart2 || team.strFanart3 || 
                      team.strFanart4 || team.strStadiumThumb || null;
        return {
          badge: team.strBadge || team.strLogo || null,
          image,
        };
      }
    }
  } catch (e) {
    // Ignore
  }
  
  return { badge: null, image: null };
};

// ============================================
// GET MATCHES FROM WESTREAM
// ============================================

const getWeStreamMatches = async (): Promise<any[]> => {
  try {
    const response = await fetch(`${WESTREAM_API}/matches`, {
      signal: AbortSignal.timeout(8000)
    });
    
    if (response.ok) {
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    }
  } catch (e) {
    console.warn('Failed to get WeStream matches');
  }
  
  return [];
};

// ============================================
// MAIN: GET FEATURED MATCHES FOR CAROUSEL
// ============================================

export const getFeaturedMatches = async (limit: number = 8): Promise<any[]> => {
  try {
    // 1. Get matches from WeStream
    const allMatches = await getWeStreamMatches();
    
    if (allMatches.length === 0) {
      console.warn('No matches from WeStream');
      return [];
    }
    
    // 2. Filter matches with teams
    const matchesWithTeams = allMatches.filter(m => 
      m.teams?.home?.name && 
      m.teams?.away?.name && 
      m.teams.home.name !== 'TBA' &&
      m.teams.away.name !== 'TBA'
    );
    
    // 3. Calculate popularity scores
    const scoredMatches = matchesWithTeams.map(match => ({
      ...match,
      _score: calculatePopularityScore(match)
    }));
    
    // 4. Sort by score (highest first)
    scoredMatches.sort((a, b) => b._score - a._score);
    
    // 5. Take top matches (get more than needed for banner filtering)
    const topMatches = scoredMatches.slice(0, limit * 3);
    
    console.log(`📊 Top matches by score:`, topMatches.slice(0, 5).map(m => ({
      title: m.title,
      score: m._score
    })));
    
    // 6. Fetch images for top matches
    const enrichedMatches: any[] = [];
    
    for (const match of topMatches) {
      if (enrichedMatches.length >= limit) break;
      
      const homeTeam = match.teams?.home?.name || '';
      const awayTeam = match.teams?.away?.name || '';
      
      // Fetch event and team info in parallel
      const [eventImages, homeInfo, awayInfo] = await Promise.all([
        fetchEventImages(homeTeam, awayTeam),
        fetchTeamInfo(homeTeam),
        fetchTeamInfo(awayTeam),
      ]);
      
      // Priority: event image -> home team image -> away team image
      const banner = eventImages.image || homeInfo.image || awayInfo.image;
      const homeBadge = eventImages.homeBadge || homeInfo.badge;
      const awayBadge = eventImages.awayBadge || awayInfo.badge;
      
      // Include match if it has banner OR both team badges
      if (banner || (homeBadge && awayBadge)) {
        enrichedMatches.push({
          ...match,
          banner,
          homeBadge,
          awayBadge,
          homeTeam,
          awayTeam,
        });
      }
    }
    
    console.log(`🎬 Featured: ${enrichedMatches.length} matches with images`);
    return enrichedMatches;
  } catch (error) {
    console.error('Failed to get featured matches:', error);
    return [];
  }
};

// ============================================
// GET UPCOMING EVENTS FROM THESPORTSDB
// ============================================

export const getUpcomingEvents = async (leagueId: number): Promise<any[]> => {
  try {
    const response = await fetch(
      `${SPORTSDB_API_V1}/eventsnextleague.php?id=${leagueId}`,
      { signal: AbortSignal.timeout(5000) }
    );
    
    if (response.ok) {
      const data = await response.json();
      return data.events || [];
    }
  } catch (e) {
    console.warn('Failed to get upcoming events');
  }
  
  return [];
};
