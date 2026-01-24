// Sports API Service - Using WatchFooty API
// Re-export all functions from watchFootyApi for backward compatibility

export {
  clearStreamCache,
  fetchSports,
  fetchAllMatches,
  fetchMatches,
  fetchLiveMatches,
  fetchMatch,
  fetchPopularMatches,
  fetchSimpleStream,
  fetchAllMatchStreams,
  fetchAllStreams,
  getBohoImageUrl,
  getTeamBadgeUrl,
  getLeagueLogoUrl,
  BOHO_API_BASE,
  WATCHFOOTY_API_BASE
} from '../services/watchFootyApi';

// Legacy function for backward compatibility
export const fetchStream = async (source: string, id: string, streamNo?: number) => {
  const { fetchSimpleStream } = await import('../services/watchFootyApi');
  const streams = await fetchSimpleStream(source, id);

  if (streamNo !== undefined) {
    const specificStream = streams.find(s => s.streamNo === streamNo);
    return specificStream || streams[0] || null;
  }

  return streams;
};

// Legacy compatibility - validate stream URL
export const isValidStreamUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsedUrl = new URL(url.startsWith('//') ? 'https:' + url : url);
    return ['http:', 'https:'].includes(parsedUrl.protocol);
  } catch {
    return false;
  }
};
