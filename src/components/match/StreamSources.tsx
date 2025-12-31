
import { Button } from '@/components/ui/button';
import { Source, Stream } from '@/types/sports';
import { useState, useEffect } from 'react';
import { fetchStream } from '@/api/sportsApi';
import { Loader, Play, Users } from 'lucide-react';
import { getConnectionInfo } from '@/utils/connectionOptimizer';
import { fetchViewerCountFromSource, formatViewerCount } from '@/services/viewerCountService';
import { triggerStreamChangeAd } from '@/utils/streamAdTrigger';
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
  onRefresh
}: StreamSourcesProps) => {
  const [localStreams, setLocalStreams] = useState<Record<string, Stream[]>>({});
  const [loadingStreams, setLoadingStreams] = useState<Record<string, boolean>>({});
  const [connectionQuality, setConnectionQuality] = useState<'poor' | 'fair' | 'good' | 'excellent'>('good');
  const [streamViewers, setStreamViewers] = useState<Record<string, number>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Monitor connection quality
  useEffect(() => {
    const updateConnectionQuality = () => {
      const info = getConnectionInfo();
      const effectiveType = info.effectiveType || '4g';
      const downlink = info.downlink || 10;
      const rtt = info.rtt || 50;

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

  // Use pre-loaded streams if available, otherwise fetch individually
  const effectiveStreams = Object.keys(allStreams).length > 0 ? allStreams : localStreams;

  // Fetch streams only if not already provided
  useEffect(() => {
    const fetchMissingStreams = async () => {
      if (Object.keys(allStreams).length > 0) {
        console.log('✅ Using pre-loaded streams from all sources');
        return;
      }

      if (!visibleSources || visibleSources.length === 0) return;

      console.log('🔄 Fetching individual streams (fallback mode)');
      
      for (const source of visibleSources) {
        const sourceKey = `${source.source}/${source.id}`;
        
        if (localStreams[sourceKey]) continue;
        
        setLoadingStreams(prev => ({ ...prev, [sourceKey]: true }));
        
        try {
          console.log(`Fetching streams for: ${source.source}/${source.id}`);
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
          
          console.log(`Found ${streams.length} valid streams for ${sourceKey}:`, streams);
          
          setLocalStreams(prev => ({
            ...prev,
            [sourceKey]: streams
          }));
        } catch (error) {
          console.error(`Failed to fetch streams for ${sourceKey}:`, error);
          setLocalStreams(prev => ({
            ...prev,
            [sourceKey]: []
          }));
        } finally {
          setLoadingStreams(prev => ({ ...prev, [sourceKey]: false }));
        }
      }
    };

    fetchMissingStreams();
  }, [sources]);

  // Fetch viewer counts for all streams
  useEffect(() => {
    const fetchViewerCounts = async () => {
      const viewers: Record<string, number> = {};
      
      for (const source of visibleSources) {
        const count = await fetchViewerCountFromSource(source.source, source.id);
        if (count !== null) {
          const sourceKey = `${source.source}/${source.id}`;
          viewers[sourceKey] = count;
        }
      }
      
      setStreamViewers(viewers);
    };

    if (visibleSources.length > 0) {
      fetchViewerCounts();
      // Refresh every 30 seconds
      const interval = setInterval(fetchViewerCounts, 30000);
      return () => clearInterval(interval);
    }
  }, [sources]);

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

  // Collect all available streams from all sources
  const allAvailableStreams: Array<{
    stream: any;
    sourceKey: string;
    index: number;
  }> = [];
  
  visibleSources.forEach((source) => {
    const sourceKey = `${source.source}/${source.id}`;
    const streams = effectiveStreams[sourceKey] || [];
    
    console.log(`📺 Source ${sourceKey} has ${streams.length} streams:`, streams);
    
    streams.forEach((stream, index) => {
      allAvailableStreams.push({
        stream,
        sourceKey,
        index
      });
    });
  });
  
  console.log(`📺 Total available streams to display: ${allAvailableStreams.length}`);

  const isAnyLoading = Object.values(loadingStreams).some(Boolean);

  // Show loading state
  if (isAnyLoading && allAvailableStreams.length === 0) {
    return (
      <div className="mt-6 flex items-center gap-2 text-gray-400 justify-center py-8">
        <Loader className="h-4 w-4 animate-spin" />
        <span className="text-sm">Loading streams...</span>
      </div>
    );
  }

  // Show no streams message
  if (allAvailableStreams.length === 0) {
    return (
      <div className="mt-6 text-center py-8">
        <p className="text-gray-400">No streams available for this match.</p>
      </div>
    );
  }

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
          
          console.log(`🎯 Rendering stream button: ${streamName}`, { streamNo: actualStreamNo, hd: stream.hd });
          
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
                triggerStreamChangeAd(streamId);
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
      
      {/* Export viewer counts for parent component */}
      <div className="hidden" data-stream-viewers={JSON.stringify(streamViewers)} />
    </div>
  );
};

export default StreamSources;
