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
 * Get real viewer count for a match
 */
export const getRealViewerCount = async (matchId: string): Promise<number> => {
  // Check cache first
  const cached = viewerCountCache.get(matchId);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.count;
  }

  try {
    const response = await fetch(`${API_BASE}/count?match=${encodeURIComponent(matchId)}`);
    const data = await response.json();
    const count = data.count || 0;

    // Cache the result
    viewerCountCache.set(matchId, { count, timestamp: Date.now() });

    return count;
  } catch (error) {
    return 0;
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

    for (const [matchId, count] of Object.entries(data)) {
      counts.set(matchId, count as number);
      viewerCountCache.set(matchId, { count: count as number, timestamp: Date.now() });
    }
  } catch (error) {
    // Silent fail
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
