// Multi-Source Stream API
// Aggregates streams from multiple sources, prioritizing direct HLS

import { Match, Stream, Source } from '../types/sports';
import { findMatchingIptvChannel, type IptvChannel } from './iptvService';
import { recordStreamResult, getRecommendedSources } from '../utils/sourceTracking';
import { getEmbedDomainSync, buildEmbedUrl } from '../utils/embedDomains';

// All known API stream sources
const ALL_STREAM_SOURCES = [
  'alpha', 'bravo', 'charlie', 'delta', 'echo', 
  'foxtrot', 'golf', 'hotel', 'intel'
];

// Source name mapping for display
const SOURCE_DISPLAY_NAMES: Record<string, string> = {
  'alpha': 'Alpha',
  'bravo': 'Bravo',
  'charlie': 'Charlie',
  'delta': 'Delta',
  'echo': 'Echo',
  'foxtrot': 'Foxtrot',
  'golf': 'Golf',
  'hotel': 'Hotel',
  'intel': 'Intel',
  'iptv': 'IPTV',
};

interface MultiSourceResult {
  streams: Stream[];
  sourcesChecked: number;
  sourcesWithStreams: number;
  sourceNames: string[];
  hasHls: boolean;
  hasIptv: boolean;
}

/**
 * Create a stream object from IPTV channel
 */
function createIptvStream(channel: IptvChannel, matchId: string): Stream {
  return {
    id: matchId,
    streamNo: 1,
    language: channel.language || 'EN',
    hd: true,
    embedUrl: channel.url,
    source: 'iptv',
    isHls: true, // IPTV streams are always HLS
    name: channel.name,
    timestamp: Date.now(),
  };
}

/**
 * Create streams from match sources using embed URL builder
 */
function createSourceStreams(
  match: Match, 
  sourceKey: string, 
  streamNumbers: number[] = [1, 2, 3]
): Stream[] {
  const domain = getEmbedDomainSync();
  const streams: Stream[] = [];
  
  streamNumbers.forEach(streamNo => {
    const embedUrl = buildEmbedUrl(domain, sourceKey, match.id, streamNo);
    
    streams.push({
      id: match.id,
      streamNo,
      language: 'EN',
      hd: true,
      embedUrl,
      source: sourceKey,
      isHls: false, // Embed URLs are not direct HLS
      name: `${SOURCE_DISPLAY_NAMES[sourceKey] || sourceKey} ${streamNo}`,
      timestamp: Date.now(),
    });
  });
  
  return streams;
}

/**
 * Fetch streams from all available sources for a match
 */
export async function fetchMultiSourceStreams(match: Match): Promise<MultiSourceResult> {
  console.log(`🎯 Multi-source fetch for: ${match.title}`);
  
  const result: MultiSourceResult = {
    streams: [],
    sourcesChecked: 0,
    sourcesWithStreams: 0,
    sourceNames: [],
    hasHls: false,
    hasIptv: false,
  };
  
  // Step 1: Check IPTV-Org for matching channel (highest priority - direct HLS)
  try {
    const iptvChannel = await findMatchingIptvChannel(
      match.title,
      match.category,
      match.poster // Often contains league info
    );
    
    if (iptvChannel) {
      const iptvStream = createIptvStream(iptvChannel, match.id);
      result.streams.push(iptvStream);
      result.hasHls = true;
      result.hasIptv = true;
      result.sourceNames.push('IPTV');
      console.log(`✅ Found IPTV channel: ${iptvChannel.name}`);
      recordStreamResult('iptv', 'hls');
    }
  } catch (error) {
    console.warn('IPTV lookup failed:', error);
  }
  
  // Step 2: Get sources from the match object
  const matchSources = match.sources || [];
  const matchSourceKeys = matchSources.map(s => s.source);
  
  // Step 3: Create streams from match sources (prioritized by tracking)
  const prioritizedSources = getRecommendedSources(matchSourceKeys);
  
  prioritizedSources.forEach(sourceKey => {
    const matchSource = matchSources.find(s => s.source === sourceKey);
    if (matchSource) {
      // Use actual source ID from match
      const streams = createSourceStreams(
        { ...match, id: matchSource.id },
        sourceKey,
        [1, 2] // Create 2 stream variants per source
      );
      
      result.streams.push(...streams);
      result.sourcesWithStreams++;
      result.sourceNames.push(SOURCE_DISPLAY_NAMES[sourceKey] || sourceKey);
      
      // Record as iframe (since we're building embed URLs)
      recordStreamResult(sourceKey, 'iframe');
    }
  });
  
  result.sourcesChecked = matchSources.length;
  
  // Step 4: If we have very few streams, add fallback sources
  if (result.streams.length < 3 && match.sources?.length > 0) {
    // Add additional stream numbers for existing sources
    const primarySource = match.sources[0];
    for (let i = 3; i <= 5; i++) {
      const domain = getEmbedDomainSync();
      const embedUrl = buildEmbedUrl(domain, primarySource.source, primarySource.id, i);
      
      result.streams.push({
        id: primarySource.id,
        streamNo: i,
        language: 'EN',
        hd: true,
        embedUrl,
        source: primarySource.source,
        isHls: false,
        name: `Stream ${i}`,
        timestamp: Date.now(),
      });
    }
  }
  
  console.log(`🎬 Multi-source result: ${result.streams.length} streams (${result.hasHls ? 'HLS available' : 'embed only'})`);
  
  return result;
}

/**
 * Get display name for a source
 */
export function getSourceDisplayName(source: string): string {
  return SOURCE_DISPLAY_NAMES[source.toLowerCase()] || source;
}

/**
 * Check if a stream is from IPTV
 */
export function isIptvStream(stream: Stream): boolean {
  return stream.source === 'iptv';
}

/**
 * Sort streams with HLS/IPTV first
 */
export function sortStreamsByQuality(streams: Stream[]): Stream[] {
  return [...streams].sort((a, b) => {
    // IPTV/HLS streams first
    if (a.isHls && !b.isHls) return -1;
    if (!a.isHls && b.isHls) return 1;
    
    // Then by source name for consistency
    if (a.source !== b.source) {
      return a.source.localeCompare(b.source);
    }
    
    // Then by stream number
    return (a.streamNo || 1) - (b.streamNo || 1);
  });
}

export { ALL_STREAM_SOURCES, SOURCE_DISPLAY_NAMES };
