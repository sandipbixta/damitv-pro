import React, { useState, useEffect } from 'react';
import { Match, Stream } from '../../types/sports';
import StreamPlayer from '../StreamPlayer';
import StreamSources from '../match/StreamSources';
import { Clock, Tv, Calendar, RefreshCcw, Users } from 'lucide-react';
import { Button } from '../ui/button';
import { Link } from 'react-router-dom';
import { isMatchLive } from '../../utils/matchUtils';
import { ViewerCount } from '../ViewerCount';

interface FeaturedPlayerProps {
  loading: boolean;
  featuredMatch: Match | null;
  currentStream: Stream | null;
  streamLoading: boolean;
  activeSource: string | null;
  onSourceChange: (source: string, id: string, streamNo?: number) => void;
  onStreamRetry: () => void;
  onRetryLoading: () => void;
}

const FeaturedPlayer: React.FC<FeaturedPlayerProps> = ({
  loading,
  featuredMatch,
  currentStream,
  streamLoading,
  activeSource,
  onSourceChange,
  onStreamRetry,
  onRetryLoading
}) => {
  const [currentStreamViewers, setCurrentStreamViewers] = useState<number>(0);

  const formatMatchTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  // Check if match is live
  const isLive = featuredMatch ? isMatchLive(featuredMatch) : false;

  // Fetch viewer count for current active stream
  useEffect(() => {
    const fetchCurrentViewers = async () => {
      if (!activeSource) return;
      
      const parts = activeSource.split('/');
      const [source, id] = parts;
      
      if (source && id) {
        try {
          const response = await fetch(`https://streamapi.cc/sport/stream/${source}/${id}`, {
            headers: { 'Accept': 'application/json' },
            signal: AbortSignal.timeout(5000)
          });
          
          if (response.ok) {
            const data = await response.json();
            
            // Sum up all viewers from this source
            if (Array.isArray(data)) {
              const total = data.reduce((sum: number, stream: any) => sum + (stream.viewers || 0), 0);
              setCurrentStreamViewers(total);
            }
          }
        } catch (error) {
          console.error('Failed to fetch viewer count:', error);
        }
      }
    };

    fetchCurrentViewers();
    // Refresh every 30 seconds
    const interval = setInterval(fetchCurrentViewers, 30000);
    return () => clearInterval(interval);
  }, [activeSource]);

  // Show loading only for initial load, not when we have matches
  if (loading && !featuredMatch) {
    return (
      <div className="w-full bg-[#242836] rounded-xl p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#9b87f5] mx-auto"></div>
        <p className="mt-3 text-gray-300 text-sm">Loading live streams...</p>
      </div>
    );
  }

  if (!featuredMatch) {
    return (
      <div className="w-full bg-[#242836] rounded-xl p-8 text-center">
        <Tv size={40} className="text-[#343a4d] mx-auto mb-3" />
        <p className="text-gray-300 text-lg mb-2">No live streams available at the moment.</p>
        <p className="text-gray-400 text-sm mb-4">Check back later or view scheduled matches.</p>
        <div className="flex gap-3 justify-center">
          <Button onClick={onRetryLoading} size="sm" className="bg-[#9b87f5] hover:bg-[#8a75e8]">
            <RefreshCcw size={14} className="mr-1" />
            Refresh
          </Button>
          <Link to="/schedule">
            <Button variant="outline" size="sm" className="bg-transparent border border-[#343a4d]">
              <Calendar size={14} className="mr-1" />
              Schedule
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="w-full max-w-5xl mx-auto flex justify-between items-center mb-3">
        <h2 className="text-xl font-bold text-white truncate pr-4">{featuredMatch.title}</h2>
        {streamLoading ? (
          <div className="text-xs text-[#9b87f5] flex items-center gap-1 flex-shrink-0">
            <span className="inline-block h-1.5 w-1.5 bg-[#9b87f5] rounded-full animate-pulse"></span>
            Loading...
          </div>
        ) : isMatchLive(featuredMatch) ? (
          <div className="text-xs text-[#fa2d04] flex items-center gap-1 flex-shrink-0">
            <span className="inline-block h-1.5 w-1.5 bg-[#fa2d04] rounded-full animate-pulse"></span>
            Live
          </div>
        ) : (
          <div className="text-xs text-[#1EAEDB] flex items-center gap-1 flex-shrink-0">
            <Clock size={12} />
            {formatMatchTime(featuredMatch.date)}
          </div>
        )}
      </div>
      
      <StreamPlayer 
        stream={currentStream} 
        isLoading={streamLoading}
        onRetry={onStreamRetry}
        match={featuredMatch}
        showMatchDetails={false}
      />
      
      {/* Stream Sources - only show if match has sources */}
      {featuredMatch.sources && featuredMatch.sources.length > 0 && (
        <div className="mt-3">
          <StreamSources
            sources={featuredMatch.sources}
            activeSource={activeSource}
            onSourceChange={onSourceChange}
            streamId={featuredMatch.id}
            currentStreamViewers={currentStreamViewers}
            isLive={isLive}
          />
        </div>
      )}
    </div>
  );
};

export default FeaturedPlayer;
