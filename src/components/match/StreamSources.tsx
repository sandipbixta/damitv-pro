import { Button } from '@/components/ui/button';
import { Source, Stream, Match } from '@/types/sports';
import { useState, useEffect } from 'react';
import { fetchStream } from '@/api/sportsApi';
import { Loader, Play, Users } from 'lucide-react';
import { getConnectionInfo } from '@/utils/connectionOptimizer';
import { formatViewerCount } from '@/services/viewerCountService';
import { LiveViewerCount } from '@/components/LiveViewerCount';

interface StreamSourcesProps {
  sources: Source[];
  activeSource: string | null;
  onSourceChange: (source: string, id: string, streamNo?: number) => void;
  streamId: string;
  allStreams?: Record<string, Stream[]>;
  viewerCount?: React.ReactNode;
  currentStreamViewers?: number;
  isLive?: boolean;
  streamDiscovery?: {
    sourcesChecked: number;
    sourcesWithStreams: number;
    sourceNames: string[];
  };
  onRefresh?: () => Promise<void>;
  match?: Match;
}

const StreamSources = ({ 
  sources, 
  activeSource, 
  onSourceChange, 
  streamId,
  allStreams = {},
  viewerCount,
  currentStreamViewers = 0,
  isLive = false,
  streamDiscovery,
  onRefresh,
  match
}: StreamSourcesProps) => {
  const [localStreams, setLocalStreams] = useState<Record<string, Stream[]>>({});
  const [loadingStreams, setLoadingStreams] = useState<Record<string, boolean>>({});
  const [connectionQuality, setConnectionQuality] = useState<'poor' | 'fair' | 'good' | 'excellent'>('good');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasFetchedStreams, setHasFetchedStreams] = useState(false);

  // Monitor connection quality
  useEffect(() => {
    const updateConnectionQuality = () => {
      const info = getConnectionInfo();
      const effectiveType = info.effectiveType || '4g';
      const downlink = info.downlink || 10;

      if (effectiveType === 'slow-2g' || effectiveType === '2g' || downlink < 1) {
        setConnectionQuality('poor');
      } else if (effectiveType === '3g' || (downlink >= 1 && downlink < 5)) {
        setConnectionQuality('fair');
      } else if (effectiveType === '4g' || (downlink >= 5 && downlink < 10)) {
        setConnectionQuality('good');
      } else {
        setConnectionQuality('excellent');
      }
    };

    updateConnectionQuality();
    
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (connection) {
      connection.addEventListener('change', updateConnectionQuality);
      return () => connection.removeEventListener('change', updateConnectionQuality);
    }
  }, []);

  const getConnectionDotColor = () => {
    switch (connectionQuality) {
      case 'poor':
        return 'bg-red-500';
      case 'fair':
        return 'bg-yellow-500';
      case 'good':
        return 'bg-green-500';
      case 'excellent':
        return 'bg-green-400';
      default:
        return 'bg-green-500';
    }
  };

  // Mark admin sources but don't hide them
  const isAdminSourceName = (name: string) => name?.toLowerCase().includes('admin');
  const visibleSources = sources.map(s => ({
    ...s,
    isAdmin: isAdminSourceName(s.source),
  }));

  // Use pre-loaded streams if available, otherwise use local streams
  const effectiveStreams = Object.keys(allStreams).length > 0 ? allStreams : localStreams;

  // LAZY LOAD: Only fetch streams when user clicks a source button (not on mount)
  const fetchStreamForSource = async (source: Source) => {
    const sourceKey = `${source.source}/${source.id}`;
    
    // Skip if already loaded
    if (localStreams[sourceKey] && localStreams[sourceKey].length > 0) {
      return localStreams[sourceKey];
    }
    
    setLoadingStreams(prev => ({ ...prev, [sourceKey]: true }));
    
    try {
      console.log(`🔄 Lazy-loading streams for: ${source.source}/${source.id}`);
      const streamData = await fetchStream(source.source, source.id);
      
      // Ensure streamData is always an array
      const streamArray = Array.isArray(streamData) ? streamData : (streamData ? [streamData] : []);
      
      const streams = streamArray
        .map((s: any) => {
          const url = s?.embedUrl || '';
          const normalized = url.startsWith('//') ? 'https:' + url : url.replace(/^http:\/\//i, 'https://');
          return normalized &&
            !normalized.includes('youtube.com') &&
            !normalized.includes('demo')
            ? { ...s, embedUrl: normalized }
            : null;
        })
        .filter(Boolean) as Stream[];
      
      console.log(`✅ Loaded ${streams.length} streams for ${sourceKey}`);
      
      setLocalStreams(prev => ({
        ...prev,
        [sourceKey]: streams
      }));
      
      return streams;
    } catch (error) {
      console.error(`Failed to fetch streams for ${sourceKey}:`, error);
      setLocalStreams(prev => ({
        ...prev,
        [sourceKey]: []
      }));
      return [];
    } finally {
      setLoadingStreams(prev => ({ ...prev, [sourceKey]: false }));
    }
  };

  // Handle source button click - lazy load streams
  const handleSourceClick = async (source: Source, streamNo?: number) => {
    const sourceKey = `${source.source}/${source.id}`;
    const existingStreams = effectiveStreams[sourceKey];
    
    if (!existingStreams || existingStreams.length === 0) {
      // Fetch streams first
      const streams = await fetchStreamForSource(source);
      if (streams && streams.length > 0) {
        const firstStream = streams[0];
        onSourceChange(firstStream.source || source.source, firstStream.id || source.id, streamNo || firstStream.streamNo || 1);
      }
    } else {
      // Use existing streams
      const stream = existingStreams[0];
      onSourceChange(stream.source || source.source, stream.id || source.id, streamNo || stream.streamNo || 1);
    }
  };

  // Handle refresh button click
  const handleRefresh = async () => {
    if (!onRefresh) return;
    
    setIsRefreshing(true);
    try {
      await onRefresh();
      console.log('🔄 Stream refresh completed');
    } catch (error) {
      console.error('❌ Stream refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!visibleSources || visibleSources.length === 0) {
    return null;
  }

  // Collect all available streams from all sources (only from pre-loaded or already fetched)
  const allAvailableStreams: Array<{
    stream: any;
    sourceKey: string;
    index: number;
  }> = [];
  
  visibleSources.forEach((source) => {
    const sourceKey = `${source.source}/${source.id}`;
    const streams = effectiveStreams[sourceKey] || [];
    
    streams.forEach((stream, index) => {
      allAvailableStreams.push({
        stream,
        sourceKey,
        index
      });
    });
  });

  const isAnyLoading = Object.values(loadingStreams).some(Boolean);

  // If no streams are loaded yet, show source buttons to trigger lazy load
  const showSourceButtons = allAvailableStreams.length === 0 && !isAnyLoading;

  return (
    <div className="mt-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-white">Stream Links</h3>
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-8 px-3 text-xs bg-gray-800 hover:bg-gray-700 border-gray-600"
            >
              {isRefreshing ? (
                <>
                  <Loader className="w-3 h-3 mr-1.5 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="14" 
                    height="14" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    className="mr-1.5"
                  >
                    <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                  </svg>
                  Refresh
                </>
              )}
            </Button>
          )}
        </div>
        <div className="flex items-center gap-3 mr-4">
          {isLive && match && <LiveViewerCount match={match} size="md" showTrend={true} />}
          {currentStreamViewers > 0 && (
            <div className="flex items-center gap-2 text-lg animate-fade-in">
              <Users className="w-5 h-5 text-red-500 animate-pulse" />
              <span className="font-bold text-white animate-counter-up" title="Live viewers from stream source">
                {currentStreamViewers.toLocaleString()}
              </span>
              <span className="text-muted-foreground text-sm ml-1">watching</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Loading state */}
      {isAnyLoading && allAvailableStreams.length === 0 && (
        <div className="flex items-center gap-2 text-gray-400 justify-center py-8">
          <Loader className="h-4 w-4 animate-spin" />
          <span className="text-sm">Loading streams...</span>
        </div>
      )}

      {/* Show source buttons to trigger lazy load */}
      {showSourceButtons && (
        <div className="flex flex-wrap gap-3">
          {visibleSources.map((source, idx) => {
            const sourceKey = `${source.source}/${source.id}`;
            const isLoading = loadingStreams[sourceKey];
            
            return (
              <Button
                key={sourceKey}
                variant="outline"
                className="rounded-full px-5 py-2.5 min-w-[120px] bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-600 hover:border-primary/50"
                onClick={() => handleSourceClick(source)}
                disabled={isLoading}
              >
                <div className="flex items-center gap-2">
                  {isLoading ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span className={`w-2 h-2 rounded-full ${getConnectionDotColor()} animate-pulse`} />
                      <Play className="w-4 h-4" />
                    </>
                  )}
                  <span>Stream {idx + 1}</span>
                </div>
              </Button>
            );
          })}
        </div>
      )}

      {/* Show loaded streams */}
      {allAvailableStreams.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {allAvailableStreams.map(({ stream, sourceKey, index }) => {
            // Use streamNo from API, fallback to index + 1
            const actualStreamNo = stream.streamNo !== undefined ? stream.streamNo : index + 1;
            const streamKey = `${stream.source}/${stream.id}/${actualStreamNo}`;
            const isActive = activeSource === streamKey;
            const viewerCount = stream.viewers || 0;
            
            // Use API-provided names with streamNo priority
            let streamName = stream.name || 
                            (stream.language && stream.language !== 'Original' ? `${stream.language} ${actualStreamNo}` : null) ||
                            (stream.source && stream.source !== 'intel' ? `${stream.source.toUpperCase()} ${actualStreamNo}` : null) ||
                            `Stream ${actualStreamNo}`;
            
            return (
              <Button
                key={streamKey}
                variant={isActive ? "default" : "outline"}
                className={`rounded-full px-5 py-2.5 min-w-[120px] flex-col h-auto gap-1 ${
                  isActive 
                    ? 'bg-primary hover:bg-primary/90 text-primary-foreground border-primary' 
                    : 'bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-600 hover:border-primary/50'
                }`}
                onClick={() => {
                  onSourceChange(stream.source, stream.id, actualStreamNo);
                }}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${getConnectionDotColor()} animate-pulse`} />
                  <Play className="w-4 h-4" />
                  <span>{streamName}</span>
                  {stream.hd && <span className="text-xs bg-red-600 px-1 rounded">HD</span>}
                </div>
                {viewerCount > 0 && (
                  <div className="flex items-center gap-1 text-xs font-semibold">
                    <Users className="w-3 h-3 text-primary" />
                    <span>{formatViewerCount(viewerCount, false)}</span>
                  </div>
                )}
              </Button>
            );
          })}
        </div>
      )}

      {/* No streams message */}
      {!isAnyLoading && !showSourceButtons && allAvailableStreams.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-400">No streams available for this match.</p>
        </div>
      )}
    </div>
  );
};

export default StreamSources;
