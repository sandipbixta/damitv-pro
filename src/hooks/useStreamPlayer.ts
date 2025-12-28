import { useState, useCallback } from 'react';
import { Match, Stream, Source } from '../types/sports';
import { fetchAllMatchStreams } from '../api/sportsApi';
import { trackMatchSelect, trackSourceChange } from '@/utils/videoAnalytics';

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
      
      // Auto-select first stream immediately
      if (result.streams.length > 0) {
        const firstStream = result.streams[0];
        setCurrentStream({
          ...firstStream,
          timestamp: Date.now()
        });
        setActiveSource(`${firstStream.source}/${firstStream.id}/${firstStream.streamNo || 1}`);
        console.log(`✅ Instant stream ready: ${firstStream.source}`);
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
    
    // Build ad-free embed URL with autoplay (muted for browser compatibility)
    const DAMITV_EMBED_BASE = 'https://embed.damitv.pro';
    const embedUrl = `${DAMITV_EMBED_BASE}/?id=${source.id}&source=${source.source}&autoplay=1&muted=1`;
    
    const stream: Stream = {
      id: source.id,
      streamNo: streamNo || 1,
      language: 'EN',
      hd: true,
      embedUrl: embedUrl,
      source: source.source,
      timestamp: Date.now()
    };
    
    setCurrentStream(stream);
    setActiveSource(`${source.source}/${source.id}/${streamNo || 1}`);
    console.log(`✅ Stream ready: ${embedUrl}`);
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