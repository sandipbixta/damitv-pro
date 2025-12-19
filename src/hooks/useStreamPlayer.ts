import { useState, useCallback, useEffect } from 'react';
import { useToast } from './use-toast';
import { Match, Stream, Source } from '../types/sports';
import { fetchSimpleStream, fetchAllMatchStreams } from '../api/sportsApi';

import { getPreloadedStreams } from '@/utils/streamPreloader';

const STREAM_CACHE_KEY = 'damitv_stream_cache';
const STREAM_CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

// Get cached streams from localStorage
const getCachedStreams = (matchId: string): { streams: Record<string, Stream[]>; firstStream: Stream | null } | null => {
  try {
    const cached = localStorage.getItem(`${STREAM_CACHE_KEY}_${matchId}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < STREAM_CACHE_DURATION) {
        return { streams: parsed.streams, firstStream: parsed.firstStream };
      }
    }
    
    // Check preloaded streams as fallback
    const preloaded = getPreloadedStreams(matchId);
    if (preloaded && preloaded.length > 0) {
      const streams: Record<string, Stream[]> = {};
      preloaded.forEach(stream => {
        const sourceKey = `${stream.source}/${stream.id}`;
        if (!streams[sourceKey]) streams[sourceKey] = [];
        streams[sourceKey].push(stream);
      });
      return { streams, firstStream: preloaded[0] };
    }
  } catch (e) {
    console.error('Error reading stream cache:', e);
  }
  return null;
};

// Set cached streams to localStorage
const setCachedStreams = (matchId: string, streams: Record<string, Stream[]>, firstStream: Stream | null) => {
  try {
    localStorage.setItem(`${STREAM_CACHE_KEY}_${matchId}`, JSON.stringify({
      streams,
      firstStream,
      timestamp: Date.now()
    }));
  } catch (e) {
    console.error('Error setting stream cache:', e);
  }
};

export const useStreamPlayer = () => {
  const { toast } = useToast();
  const [featuredMatch, setFeaturedMatch] = useState<Match | null>(null);
  const [currentStream, setCurrentStream] = useState<Stream | null>(null);
  const [streamLoading, setStreamLoading] = useState(false);
  const [activeSource, setActiveSource] = useState<string | null>(null);
  const [allStreams, setAllStreams] = useState<Record<string, Stream[]>>({});
  const [streamDiscovery, setStreamDiscovery] = useState<{
    sourcesChecked: number;
    sourcesWithStreams: number;
    sourceNames: string[];
  }>({ sourcesChecked: 0, sourcesWithStreams: 0, sourceNames: [] });

  // Fetch ALL streams with caching
  const fetchAllStreamsForMatch = useCallback(async (match: Match, forceRefresh = false) => {
    // Check cache first (unless forced refresh)
    if (!forceRefresh) {
      const cached = getCachedStreams(match.id);
      if (cached && Object.keys(cached.streams).length > 0) {
        console.log(`✅ Using cached streams for match: ${match.title}`);
        setAllStreams(cached.streams);
        
        if (cached.firstStream) {
          setCurrentStream({ ...cached.firstStream, timestamp: Date.now() });
          setActiveSource(`${cached.firstStream.source}/${cached.firstStream.id}/${cached.firstStream.streamNo || 1}`);
        }
        
        setStreamLoading(false);
        return;
      }
    }

    setStreamLoading(true);
    
    try {
      console.log(`🎯 Fetching streams for match: ${match.title}`);
      
      const result = await fetchAllMatchStreams(match);
      
      setStreamDiscovery({
        sourcesChecked: result.sourcesChecked,
        sourcesWithStreams: result.sourcesWithStreams,
        sourceNames: result.sourceNames
      });
      
      // Convert to Record format
      const streamsData: Record<string, Stream[]> = {};
      result.streams.forEach(stream => {
        const sourceKey = `${stream.source}/${stream.id}`;
        if (!streamsData[sourceKey]) {
          streamsData[sourceKey] = [];
        }
        streamsData[sourceKey].push(stream);
      });
      
      setAllStreams(streamsData);
      
      // Auto-select first stream
      let firstStream: Stream | null = null;
      const sourceKeys = Object.keys(streamsData);
      if (sourceKeys.length > 0 && streamsData[sourceKeys[0]].length > 0) {
        firstStream = streamsData[sourceKeys[0]][0];
        setCurrentStream({ ...firstStream, timestamp: Date.now() });
        setActiveSource(`${firstStream.source}/${firstStream.id}/${firstStream.streamNo || 1}`);
        console.log(`✅ Auto-selected stream: ${firstStream.source} Stream ${firstStream.streamNo}`);
      }
      
      // Cache the result
      setCachedStreams(match.id, streamsData, firstStream);
      
      console.log(`🎬 Total streams: ${result.streams.length} from ${result.sourcesWithStreams} sources`);
      
    } catch (error) {
      console.error('❌ Error fetching streams:', error);
      setAllStreams({});
      setCurrentStream(null);
    } finally {
      setStreamLoading(false);
    }
  }, []);

  // Fetch single stream source
  const fetchStreamData = useCallback(async (source: Source, streamNo?: number) => {
    setStreamLoading(true);
    const sourceKey = `${source.source}/${source.id}`;
    setActiveSource(sourceKey);
    
    try {
      console.log(`🎯 Fetching stream: ${source.source}/${source.id}`);
      
      const streams = await fetchSimpleStream(source.source, source.id);
      
      if (streams.length > 0) {
        const selectedStream = streamNo 
          ? streams.find(s => s.streamNo === streamNo)
          : streams[0];
        
        if (selectedStream) {
          setActiveSource(`${source.source}/${source.id}/${selectedStream.streamNo || 1}`);
          setCurrentStream({ ...selectedStream, timestamp: Date.now() });
          console.log(`✅ Stream loaded: Stream ${selectedStream.streamNo}`);
        }
      }
      
      // Scroll to player
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

  // Match selection with caching
  const handleMatchSelect = useCallback(async (match: Match) => {
    console.log(`🎯 Selected match: ${match.title}`);
    setFeaturedMatch(match);
    
    
    
    // Use cached streams if available, fetch in background
    await fetchAllStreamsForMatch(match, false);
    
    // Scroll to player
    setTimeout(() => {
      const playerElement = document.getElementById('stream-player');
      if (playerElement) {
        playerElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }, [fetchAllStreamsForMatch]);

  const handleSourceChange = async (source: string, id: string, streamNo?: number) => {
    console.log(`🔄 Source change: ${source}/${id}/${streamNo || 'default'}`);
    
    setCurrentStream(null);
    
    if (featuredMatch) {
      setTimeout(() => {
        fetchStreamData({ source, id }, streamNo);
      }, 100);
    }
  };

  const handleStreamRetry = () => {
    console.log('🔄 Retrying stream...');
    setCurrentStream(null);
    
    if (featuredMatch?.sources && featuredMatch.sources.length > 0) {
      setTimeout(() => {
        fetchStreamData(featuredMatch.sources[0]);
      }, 100);
    }
  };

  const handleRefreshStreams = useCallback(async (match?: Match) => {
    const targetMatch = match || featuredMatch;
    if (targetMatch) {
      // Force refresh - skip cache
      await fetchAllStreamsForMatch(targetMatch, true);
    }
  }, [featuredMatch, fetchAllStreamsForMatch]);

  return {
    featuredMatch,
    currentStream,
    streamLoading,
    activeSource,
    allStreams,
    streamDiscovery,
    handleMatchSelect,
    handleSourceChange,
    handleStreamRetry,
    handleRefreshStreams,
    setFeaturedMatch,
    fetchStreamData,
    fetchAllMatchStreams: fetchAllStreamsForMatch
  };
};
