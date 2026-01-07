import { useState, useCallback } from 'react';
import { Match, Stream, Source } from '../types/sports';
import { fetchAllMatchStreams } from '../services/bohoSportApi';

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

  const fetchAllStreamsForMatch = useCallback(async (match: Match) => {
    try {
      console.log(`🎯 Building streams for: ${match.title}`);
      
      const streams = await fetchAllMatchStreams(match.id, match.sources || []);
      
      setStreamDiscovery({
        sourcesChecked: match.sources?.length || 0,
        sourcesWithStreams: streams.length,
        sourceNames: streams.map(s => s.source)
      });
      
      const streamsData: Record<string, Stream[]> = {};
      streams.forEach(stream => {
        const sourceKey = `${stream.source}/${stream.id}`;
        if (!streamsData[sourceKey]) {
          streamsData[sourceKey] = [];
        }
        streamsData[sourceKey].push(stream);
      });
      
      setAllStreams(streamsData);
      
      if (streams.length > 0) {
        const firstStream = streams[0];
        setCurrentStream({
          ...firstStream,
          timestamp: Date.now()
        });
        setActiveSource(`${firstStream.source}/${firstStream.id}/${firstStream.streamNo || 1}`);
        console.log(`✅ Stream ready: ${firstStream.source}`);
      }
      
      console.log(`🎬 ${streams.length} streams ready`);
      
    } catch (error) {
      console.error('❌ Error building streams:', error);
      setAllStreams({});
      setCurrentStream(null);
    }
  }, []);

  const fetchStreamData = useCallback(async (source: Source, streamNo?: number) => {
    console.log(`🎯 Selecting stream: ${source.source}/${source.id}${streamNo ? `/${streamNo}` : ''}`);
    
    const DAMITV_EMBED_BASE = 'https://embed.damitv.pro';
    const embedUrl = `${DAMITV_EMBED_BASE}/${source.source}/${source.id}`;
    
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

  const handleMatchSelect = useCallback(async (match: Match) => {
    console.log(`🎯 Selected match: ${match.title}`);
    setFeaturedMatch(match);
    await fetchAllStreamsForMatch(match);
  }, [fetchAllStreamsForMatch]);

  const handleSourceChange = async (source: string, id: string, streamNo?: number) => {
    console.log(`🔄 Switching to: ${source}/${id}/${streamNo || 'default'}`);
    await fetchStreamData({ source, id }, streamNo);
  };

  const handleStreamRetry = async () => {
    console.log('🔄 Retrying stream...');
    
    if (featuredMatch?.sources && featuredMatch.sources.length > 0) {
      await fetchStreamData(featuredMatch.sources[0]);
    }
  };

  return {
    featuredMatch,
    currentStream,
    streamLoading,
    streamSwitching,
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
