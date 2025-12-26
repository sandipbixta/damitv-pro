import { useState, useCallback } from 'react';
import { useToast } from './use-toast';
import { Match, Stream, Source } from '../types/sports';
import { fetchAllMatchStreams } from '../api/sportsApi';
import { trackMatchSelect, trackSourceChange } from '@/utils/videoAnalytics';

// Helper function to build DAMITV embed URL (outside hook to avoid hook count issues)
const buildDamitvStream = (matchSlug: string, source: string, streamNo: number = 1): Stream => {
  const embedUrl = `https://embed.damitv.pro/?id=${matchSlug}&source=${source}`;
  return {
    id: matchSlug,
    streamNo: streamNo,
    language: 'EN',
    hd: true,
    embedUrl: embedUrl,
    source: source,
    timestamp: Date.now()
  };
};

export const useStreamPlayer = () => {
  const { toast } = useToast();
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

  // Fetch ALL streams from ALL sources
  const fetchAllStreamsForMatch = useCallback(async (match: Match) => {
    setStreamLoading(true);
    
    try {
      console.log(`🎯 Fetching ALL streams for match: ${match.title}`);
      
      // Clear cache before fetching to ensure fresh data
      const { clearStreamCache } = await import('@/api/sportsApi');
      clearStreamCache(match.id);
      
      // Use the simple stream fetching approach
      const result = await fetchAllMatchStreams(match);
      
      // Store discovery metadata
      setStreamDiscovery({
        sourcesChecked: result.sourcesChecked,
        sourcesWithStreams: result.sourcesWithStreams,
        sourceNames: result.sourceNames
      });
      
      // Convert simple array back to Record format for compatibility
      const streamsData: Record<string, Stream[]> = {};
      
      // Group streams by source
      result.streams.forEach(stream => {
        const sourceKey = `${stream.source}/${stream.id}`;
        if (!streamsData[sourceKey]) {
          streamsData[sourceKey] = [];
        }
        streamsData[sourceKey].push(stream);
      });
      
      setAllStreams(streamsData);
      
      // Auto-select first available stream
      const sourceKeys = Object.keys(streamsData);
      if (sourceKeys.length > 0 && streamsData[sourceKeys[0]].length > 0) {
        const firstStream = streamsData[sourceKeys[0]][0];
        setCurrentStream({
          ...firstStream,
          timestamp: Date.now()
        });
        setActiveSource(`${firstStream.source}/${firstStream.id}/${firstStream.streamNo || 1}`);
        console.log(`✅ Auto-selected first stream: ${firstStream.source} Stream ${firstStream.streamNo}`);
      }
      
      console.log(`🎬 Total streams loaded: ${result.streams.length} from ${result.sourcesWithStreams} sources`);
      
    } catch (error) {
      console.error('❌ Error fetching all streams:', error);
      setAllStreams({});
      setCurrentStream(null);
      setStreamDiscovery({ sourcesChecked: 0, sourcesWithStreams: 0, sourceNames: [] });
    } finally {
      setStreamLoading(false);
    }
  }, []);

  // Simplified stream fetching - builds DAMITV embed URL directly
  const fetchStreamData = useCallback(async (source: Source, streamNo?: number) => {
    setStreamLoading(true);
    const sourceKey = `${source.source}/${source.id}`;
    setActiveSource(sourceKey);
    
    try {
      console.log(`🎯 Building DAMITV stream: ${source.source}/${source.id}${streamNo ? `/${streamNo}` : ''}`);
      
      // Build DAMITV embed URL directly - no API call needed
      const stream = buildDamitvStream(source.id, source.source, streamNo || 1);
      
      // Update active source to include streamNo for proper matching
      setActiveSource(`${source.source}/${source.id}/${streamNo || 1}`);
      
      setCurrentStream(stream);
      console.log(`✅ DAMITV stream ready: ${stream.embedUrl}`);
      
      // Smooth scroll to player
      setTimeout(() => {
        const playerElement = document.getElementById('stream-player');
        if (playerElement) {
          playerElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 200);
    } catch (error) {
      console.error('❌ Stream load error:', error);
      setCurrentStream(null);
    } finally {
      setStreamLoading(false);
    }
  }, []);

  // Match selection with comprehensive stream loading
  const handleMatchSelect = useCallback(async (match: Match) => {
    console.log(`🎯 Selected match: ${match.title}`);
    setFeaturedMatch(match);
    
    // Track match selection in GA4
    trackMatchSelect(match.title, match.id, match.category || 'unknown');
    
    // Fetch all streams for this match from all sources
    await fetchAllStreamsForMatch(match);
    
    // Smooth scroll to player
    setTimeout(() => {
      const playerElement = document.getElementById('stream-player');
      if (playerElement) {
        playerElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }
    }, 100);
  }, [fetchAllStreamsForMatch]);

  const handleSourceChange = async (source: string, id: string, streamNo?: number) => {
    console.log(`🔄 Source change requested: ${source}/${id}/${streamNo || 'default'}`);
    
    // Set switching state instead of clearing stream (prevents reconnect message)
    setStreamSwitching(true);
    
    // Track source change in GA4
    trackSourceChange(source, id);
    
    if (featuredMatch) {
      // Fetch new stream directly without clearing current one first
      await fetchStreamData({ source, id }, streamNo);
      setStreamSwitching(false);
    }
  };

  const handleStreamRetry = async () => {
    console.log('🔄 Retrying stream...');
    setStreamSwitching(true);
    
    if (featuredMatch?.sources && featuredMatch.sources.length > 0) {
      await fetchStreamData(featuredMatch.sources[0]);
    }
    
    setStreamSwitching(false);
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