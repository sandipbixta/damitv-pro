import React from 'react';
import { Stream } from '../types/sports';
import { Match } from '../types/sports';
import { ManualMatch } from '../types/manualMatch';
import IframeVideoPlayer from './StreamPlayer/IframeVideoPlayer';
import VideoPlayerSelector from './StreamPlayer/VideoPlayerSelector';
import MatchDetails from './MatchDetails';
import { useViewerTracking } from '@/hooks/useViewerTracking';

interface StreamPlayerProps {
  stream: Stream | null;
  isLoading: boolean;
  onRetry?: () => void;
  isManualChannel?: boolean;
  isTvChannel?: boolean;
  title?: string;
  isTheaterMode?: boolean;
  onTheaterModeToggle?: () => void;
  match?: Match | ManualMatch | null;
  showMatchDetails?: boolean;
  onAutoFallback?: () => void;
  allStreams?: Record<string, Stream[]>;
}

const StreamPlayer: React.FC<StreamPlayerProps> = ({ 
  stream, 
  isLoading, 
  onRetry,
  isManualChannel = false,
  isTvChannel = false,
  title,
  isTheaterMode = false,
  onTheaterModeToggle,
  match = null,
  showMatchDetails = true,
  onAutoFallback,
  allStreams = {}
}) => {
  // Track viewer for this match
  useViewerTracking(match?.id);

  // Determine if match is live based on stream availability and match time
  const isLive = stream && match && (
    Date.now() - (typeof match.date === 'number' ? match.date : new Date(match.date).getTime()) > -30 * 60 * 1000 &&
    Date.now() - (typeof match.date === 'number' ? match.date : new Date(match.date).getTime()) < 3 * 60 * 60 * 1000
  );

  // Get match start time for countdown
  const matchStartTime = match?.date ? (typeof match.date === 'number' ? match.date : new Date(match.date).getTime()) : null;

  if (isLoading) {
    return (
      <div className="w-full aspect-video bg-black flex items-center justify-center rounded-lg">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading stream...</p>
        </div>
      </div>
    );
  }

  if (!stream || !stream.embedUrl) {
    return (
      <div className="w-full aspect-video bg-black flex items-center justify-center rounded-lg">
        <div className="text-white text-center">
          <p className="text-lg mb-2">No stream available</p>
          <p className="text-sm text-gray-400">Check back closer to match time</p>
        </div>
      </div>
    );
  }

  // Check if HLS stream
  const isHlsStream = stream.embedUrl.includes('.m3u8');

  return (
    <>
      <div className="w-full aspect-video bg-black rounded-lg overflow-hidden">
        {isHlsStream ? (
          <VideoPlayerSelector
            src={stream.embedUrl}
            title={title || match?.title}
            matchStartTime={matchStartTime}
            onLoad={() => console.log('Stream loaded')}
            onError={() => onRetry?.()}
          />
        ) : (
          <IframeVideoPlayer
            src={stream.embedUrl}
            title={title || match?.title}
            onLoad={() => console.log('Stream loaded')}
            onError={() => onRetry?.()}
          />
        )}
      </div>
      
      {/* Match Details Below Player */}
      {showMatchDetails && match && !isTheaterMode && (
        <div className="mt-4 px-4">
          <MatchDetails 
            match={match}
            isLive={!!isLive}
            showCompact={false}
          />
        </div>
      )}
    </>
  );
};

export default StreamPlayer;
