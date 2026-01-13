// Source Tracking Utility
// Tracks which stream sources provide HLS vs iframe to optimize future requests

interface SourceStats {
  source: string;
  hlsCount: number;
  iframeCount: number;
  failCount: number;
  lastSuccess: number;
  lastAttempt: number;
}

const STORAGE_KEY = 'stream_source_stats';
const STATS_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Get stored source statistics
 */
function getStoredStats(): Record<string, SourceStats> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return {};
    
    const data = JSON.parse(stored);
    const now = Date.now();
    
    // Filter out old entries
    const filtered: Record<string, SourceStats> = {};
    Object.entries(data).forEach(([key, stats]: [string, any]) => {
      if (now - stats.lastAttempt < STATS_TTL) {
        filtered[key] = stats;
      }
    });
    
    return filtered;
  } catch {
    return {};
  }
}

/**
 * Save source statistics
 */
function saveStats(stats: Record<string, SourceStats>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch (error) {
    console.warn('Failed to save source stats:', error);
  }
}

/**
 * Record a stream result for a source
 */
export function recordStreamResult(
  source: string, 
  result: 'hls' | 'iframe' | 'fail'
): void {
  const stats = getStoredStats();
  const now = Date.now();
  
  if (!stats[source]) {
    stats[source] = {
      source,
      hlsCount: 0,
      iframeCount: 0,
      failCount: 0,
      lastSuccess: 0,
      lastAttempt: now,
    };
  }
  
  stats[source].lastAttempt = now;
  
  switch (result) {
    case 'hls':
      stats[source].hlsCount++;
      stats[source].lastSuccess = now;
      break;
    case 'iframe':
      stats[source].iframeCount++;
      stats[source].lastSuccess = now;
      break;
    case 'fail':
      stats[source].failCount++;
      break;
  }
  
  saveStats(stats);
  console.log(`📊 Recorded ${result} for source: ${source}`);
}

/**
 * Get HLS success rate for a source (0-1)
 */
export function getHlsSuccessRate(source: string): number {
  const stats = getStoredStats();
  const sourceStats = stats[source];
  
  if (!sourceStats) return 0.5; // Unknown source, neutral priority
  
  const total = sourceStats.hlsCount + sourceStats.iframeCount;
  if (total === 0) return 0.5;
  
  return sourceStats.hlsCount / total;
}

/**
 * Get sources sorted by HLS success rate (highest first)
 */
export function getSourcePriority(): string[] {
  const stats = getStoredStats();
  
  const scored = Object.values(stats).map(s => ({
    source: s.source,
    score: getHlsSuccessRate(s.source) * 100 - (s.failCount * 10),
    recent: s.lastSuccess,
  }));
  
  // Sort by score, then by recency
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.recent - a.recent;
  });
  
  return scored.map(s => s.source);
}

/**
 * Get all source statistics for debugging
 */
export function getAllSourceStats(): SourceStats[] {
  const stats = getStoredStats();
  return Object.values(stats).sort((a, b) => {
    const rateA = getHlsSuccessRate(a.source);
    const rateB = getHlsSuccessRate(b.source);
    return rateB - rateA;
  });
}

/**
 * Clear all source statistics
 */
export function clearSourceStats(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log('📊 Source stats cleared');
  } catch (error) {
    console.warn('Failed to clear source stats:', error);
  }
}

/**
 * Check if a source is likely to provide HLS
 */
export function isLikelyHlsSource(source: string): boolean {
  const rate = getHlsSuccessRate(source);
  return rate >= 0.6; // 60% or higher HLS success rate
}

/**
 * Get recommended sources for a match based on history
 */
export function getRecommendedSources(availableSources: string[]): string[] {
  const priority = getSourcePriority();
  
  // Sort available sources by our priority
  const sorted = [...availableSources].sort((a, b) => {
    const indexA = priority.indexOf(a);
    const indexB = priority.indexOf(b);
    
    // Unknown sources go to the end
    const scoreA = indexA === -1 ? priority.length : indexA;
    const scoreB = indexB === -1 ? priority.length : indexB;
    
    return scoreA - scoreB;
  });
  
  return sorted;
}
