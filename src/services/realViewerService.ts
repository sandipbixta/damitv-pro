const API_BASE = '/api/viewers';

// Generate a unique session ID for this browser tab
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('viewer_session_id');
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('viewer_session_id', sessionId);
  }
  return sessionId;
};

// Cache for viewer counts
const viewerCountCache = new Map<string, { count: number; timestamp: number }>();
const CACHE_DURATION = 10000; // 10 seconds

// Cache for estimated counts (longer duration for consistency)
const estimatedCountCache = new Map<string, { count: number; timestamp: number }>();
const ESTIMATED_CACHE_DURATION = 60000; // 1 minute

// Popular teams/leagues get higher base viewers
const POPULAR_KEYWORDS = [
  'manchester', 'liverpool', 'arsenal', 'chelsea', 'real madrid', 'barcelona',
  'bayern', 'juventus', 'psg', 'milan', 'inter', 'dortmund', 'atletico',
  'premier league', 'champions league', 'la liga', 'serie a', 'bundesliga',
  'nba', 'nfl', 'ufc', 'f1', 'formula'
];

/**
 * Generate a consistent hash from string for seeding random
 */
const hashCode = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
};

/**
 * Generate estimated viewer count for a match
 */
const getEstimatedViewerCount = (matchId: string): number => {
  // Check cache first
  const cached = estimatedCountCache.get(matchId);
  if (cached && Date.now() - cached.timestamp < ESTIMATED_CACHE_DURATION) {
    return cached.count;
  }

  const matchIdLower = matchId.toLowerCase();

  // Base count between 500-2000
  const seed = hashCode(matchId);
  const baseCount = 500 + (seed % 1500);

  // Multiplier for popular teams/leagues
  let multiplier = 1;
  for (const keyword of POPULAR_KEYWORDS) {
    if (matchIdLower.includes(keyword)) {
      multiplier += 0.5 + Math.random() * 0.5;
    }
  }

  // Time-based variation (more viewers during peak hours)
  const hour = new Date().getHours();
  const isPeakHour = (hour >= 18 && hour <= 23) || (hour >= 12 && hour <= 15);
  if (isPeakHour) {
    multiplier *= 1.3;
  }

  // Add some randomness for realism (±15%)
  const randomFactor = 0.85 + Math.random() * 0.3;

  // Calculate final count
  let count = Math.round(baseCount * multiplier * randomFactor);

  // Cap at reasonable numbers
  count = Math.min(count, 25000);
  count = Math.max(count, 200);

  // Cache the result
  estimatedCountCache.set(matchId, { count, timestamp: Date.now() });

  return count;
};

/**
 * Send heartbeat to register/keep viewer alive
 */
export const sendHeartbeat = async (matchId: string): Promise<void> => {
  const sessionId = getSessionId();

  try {
    await fetch(`${API_BASE}/heartbeat?match=${encodeURIComponent(matchId)}&session=${encodeURIComponent(sessionId)}`, {
      method: 'POST'
    });
  } catch (error) {
    // Silent fail
  }
};

/**
 * Unregister viewer when leaving match page
 */
export const unregisterViewer = async (matchId: string): Promise<void> => {
  const sessionId = getSessionId();

  try {
    await fetch(`${API_BASE}/leave?match=${encodeURIComponent(matchId)}&session=${encodeURIComponent(sessionId)}`, {
      method: 'POST'
    });
  } catch (error) {
    // Silent fail
  }
};

/**
 * Get viewer count for a match (real + estimated)
 */
export const getRealViewerCount = async (matchId: string): Promise<number> => {
  // Check cache first
  const cached = viewerCountCache.get(matchId);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.count > 0 ? cached.count : getEstimatedViewerCount(matchId);
  }

  try {
    const response = await fetch(`${API_BASE}/count?match=${encodeURIComponent(matchId)}`);
    const data = await response.json();
    const realCount = data.count || 0;

    // Cache the real count
    viewerCountCache.set(matchId, { count: realCount, timestamp: Date.now() });

    // Return real count if available, otherwise estimated
    if (realCount > 0) {
      return realCount;
    }

    return getEstimatedViewerCount(matchId);
  } catch (error) {
    // On error, return estimated count
    return getEstimatedViewerCount(matchId);
  }
};

/**
 * Get viewer counts for multiple matches
 */
export const getBatchViewerCounts = async (matchIds: string[]): Promise<Map<string, number>> => {
  const counts = new Map<string, number>();

  if (matchIds.length === 0) {
    return counts;
  }

  try {
    const response = await fetch(`${API_BASE}/counts?matches=${matchIds.map(encodeURIComponent).join(',')}`);
    const data = await response.json();

    for (const matchId of matchIds) {
      const realCount = (data[matchId] as number) || 0;
      const finalCount = realCount > 0 ? realCount : getEstimatedViewerCount(matchId);
      counts.set(matchId, finalCount);
      viewerCountCache.set(matchId, { count: realCount, timestamp: Date.now() });
    }
  } catch (error) {
    // On error, use estimated counts for all
    for (const matchId of matchIds) {
      counts.set(matchId, getEstimatedViewerCount(matchId));
    }
  }

  return counts;
};

/**
 * Get total stats
 */
export const getViewerStats = async (): Promise<{ totalViewers: number; matches: Record<string, number> }> => {
  try {
    const response = await fetch(`${API_BASE}/stats`);
    return await response.json();
  } catch (error) {
    return { totalViewers: 0, matches: {} };
  }
};
