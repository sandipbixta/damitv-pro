import { useState, useCallback, useRef } from 'react';
import { Match, Stream, Source } from '../types/sports';
import { fetchAllMatchStreams } from '../api/sportsApi';
import { trackMatchSelect, trackSourceChange } from '@/utils/videoAnalytics';
import { getEmbedDomainSync, buildEmbedUrl } from '@/utils/embedDomains';

// Helper to check if streams are the same (avoid unnecessary updates)
const isSameStream = (a: Stream | null, b: Stream | null): boolean => {
  if (!a || !b) return a === b;
  return a.id === b.id && a.source === b.source && a.streamNo === b.streamNo && a.embedUrl === b.embedUrl;
};

export const useStreamPlayer = () => {
  const [featuredMatch, setFeaturedMatch] = useState<Match | null>(null);
  const [currentStream, setCurrentStream] = useState<Stream | null>(null);
  const [streamLoading, setStreamLoading] = useState(false);
  const [streamSwitching, setStreamSwitching] = useState(false); // New state for switching
  const [activeSource, setActiveSource] = useState<string | null>(null);
  const [allStreams, setAllStreams] = useState<Record<string, Stream[]>>({});
  const [streamDiscovery, setStreamDiscovery] = useState<{
    sourcesChecked: number;
    sourcesWithStreams: number;
    sourceNames: string[];
  }>({ sourcesChecked: 0, sourcesWithStreams: 0, sourceNames: [] });

  // Simple function to build ALL streams from ALL sources (instant, no API calls)
  const fetchAllStreamsForMatch = useCallback(async (match: Match) => {
    // Don't show loading state - streams are built instantly
    
    try {
      console.log(`🎯 Building ad-free streams for: ${match.title}`);
      
      // Build ad-free streams instantly (no API calls needed)
      const result = await fetchAllMatchStreams(match);
      
      // Store discovery metadata
      setStreamDiscovery({
        sourcesChecked: result.sourcesChecked,
        sourcesWithStreams: result.sourcesWithStreams,
        sourceNames: result.sourceNames
      });
      
      // Convert to Record format for compatibility
      const streamsData: Record<string, Stream[]> = {};
      result.streams.forEach(stream => {
        const sourceKey = `${stream.source}/${stream.id}`;
        if (!streamsData[sourceKey]) {
          streamsData[sourceKey] = [];
        }
        streamsData[sourceKey].push(stream);
      });
      
      setAllStreams(streamsData);
      
      // Auto-select first stream immediately (only if different from current)
      if (result.streams.length > 0) {
        const firstStream = result.streams[0];
        setCurrentStream(prev => {
          // Only update if stream is actually different
          if (isSameStream(prev, firstStream)) {
            console.log(`⏭️ Same stream, skipping update to prevent reload`);
            return prev;
          }
          console.log(`✅ Instant stream ready: ${firstStream.source}`);
          return firstStream;
        });
        setActiveSource(`${firstStream.source}/${firstStream.id}/${firstStream.streamNo || 1}`);
      }
      
      console.log(`🎬 ${result.streams.length} streams ready instantly`);
      
    } catch (error) {
      console.error('❌ Error building streams:', error);
      setAllStreams({});
      setCurrentStream(null);
    }
  }, []);

  // Instant stream selection (no API calls needed)
  const fetchStreamData = useCallback(async (source: Source, streamNo?: number) => {
    console.log(`🎯 Selecting stream: ${source.source}/${source.id}${streamNo ? `/${streamNo}` : ''}`);

    // Build ad-free embed URL using domain manager
    const domain = getEmbedDomainSync();
    const embedUrl = buildEmbedUrl(domain, source.source, source.id, streamNo || 1);

    const newStream: Stream = {
      id: source.id,
      streamNo: streamNo || 1,
      language: 'EN',
      hd: true,
      embedUrl: embedUrl,
      source: source.source
    };

    // Only update if the stream is actually different
    setCurrentStream(prev => {
      if (isSameStream(prev, newStream)) {
        console.log(`⏭️ Same stream requested, no reload needed`);
        return prev;
      }
      console.log(`✅ Stream ready: ${embedUrl}`);
      return newStream;
    });
    setActiveSource(`${source.source}/${source.id}/${streamNo || 1}`);
  }, []);

  // Match selection - instant, no loading delay
  const handleMatchSelect = useCallback(async (match: Match) => {
    console.log(`🎯 Selected match: ${match.title}`);
    setFeaturedMatch(match);
    
    // Track match selection
    trackMatchSelect(match.title, match.id, match.category || 'unknown');
    
    // Build streams instantly (no API calls)
    await fetchAllStreamsForMatch(match);
  }, [fetchAllStreamsForMatch]);

  const handleSourceChange = async (source: string, id: string, streamNo?: number) => {
    console.log(`🔄 Switching to: ${source}/${id}/${streamNo || 'default'}`);
    
    // Track source change
    trackSourceChange(source, id);
    
    // Instant switch - no loading state needed
    await fetchStreamData({ source, id }, streamNo);
  };

  const handleStreamRetry = async () => {
    console.log('🔄 Retrying stream...');
    
    if (featuredMatch?.sources && featuredMatch.sources.length > 0) {
      await fetchStreamData(featuredMatch.sources[0]);
    }
  };

  // Export hook values and functions
  return {
    featuredMatch,
    currentStream,
    streamLoading,
    streamSwitching, // Export new state
    activeSource,
    allStreams,
    streamDiscovery,
    handleMatchSelect,
    handleSourceChange,
    handleStreamRetry,
    handleRefreshStreams: fetchAllStreamsForMatch,
    setFeaturedMatch,
    fetchStreamData,
    fetchAllMatchStreams: fetchAllStreamsForMatch
  };
};