import { useState, useCallback } from 'react';
import { Match, Stream, Source } from '../types/sports';
import { fetchAllMatchStreams, fetchSimpleStream } from '../api/sportsApi';
import { trackMatchSelect, trackSourceChange } from '@/utils/videoAnalytics';

export const useStreamPlayer = () => {
  const [featuredMatch, setFeaturedMatch] = useState<Match | null>(null);
  const [currentStream, setCurrentStream] = useState<Stream | null>(null);
  const [streamLoading, setStreamLoading] = useState(false);
  const [streamSwitching, setStreamSwitching] = useState(false);
  const [activeSource, setActiveSource] = useState<string | null>(null);
  const [allStreams, setAllStreams] = useState<Record<string, Stream[]>>({});
  const [streamDiscovery, setStreamDiscovery] = useState<{
    sourcesChecked: number;
    sourcesWithStreams: number;
    sourceNames: string[];
  }>({ sourcesChecked: 0, sourcesWithStreams: 0, sourceNames: [] });

  // Fetch ALL streams from ALL sources using StreamedPK API
  const fetchAllStreamsForMatch = useCallback(async (match: Match) => {
    try {
      console.log(`🎯 Fetching streams for: ${match.title}`);
      
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
        console.log(`✅ Stream ready: ${firstStream.embedUrl}`);
      }
      
      console.log(`🎬 ${result.streams.length} streams ready`);
      
    } catch (error) {
      console.error('❌ Error fetching streams:', error);
      setAllStreams({});
      setCurrentStream(null);
    }
  }, []);

  // Fetch stream for a specific source using StreamedPK API
  const fetchStreamData = useCallback(async (source: Source, streamNo?: number) => {
    console.log(`🎯 Fetching stream: ${source.source}/${source.id}${streamNo ? `/${streamNo}` : ''}`);
    
    try {
      const streams = await fetchSimpleStream(source.source, source.id);
      
      if (streams && streams.length > 0) {
        // Find specific stream by streamNo or use first
        const stream = streamNo 
          ? streams.find(s => s.streamNo === streamNo) || streams[0]
          : streams[0];
        
        setCurrentStream({
          ...stream,
          timestamp: Date.now()
        });
        setActiveSource(`${source.source}/${source.id}/${stream.streamNo || 1}`);
        console.log(`✅ Stream ready: ${stream.embedUrl}`);
      }
    } catch (error) {
      console.error('❌ Error fetching stream:', error);
    }
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