import React, { useRef, useEffect, useState } from 'react';
import { Stream, Match } from '../../types/sports';
import { ManualMatch } from '../../types/manualMatch';
import { Button } from '../ui/button';
import { RotateCcw, ExternalLink, Monitor, Clock } from 'lucide-react';
import IframeVideoPlayer from './IframeVideoPlayer';
import PlyrVideoPlayer from './PlyrVideoPlayer';
import { trackVideoStart, trackVideoError } from '../../utils/videoAnalytics';
import { markDomainFailed, getFallbackDomain, buildEmbedUrl, hasFallbackAvailable, getEmbedDomainSync } from '../../utils/embedDomains';
import { toast } from 'sonner';

interface SimpleVideoPlayerProps {
  stream: Stream | null;
  isLoading?: boolean;
  onRetry?: () => void;
  isTheaterMode?: boolean;
  onTheaterModeToggle?: () => void;
  onAutoFallback?: () => void;
  match?: Match | ManualMatch | null;
}

const SimpleVideoPlayer: React.FC<SimpleVideoPlayerProps> = ({
  stream,
  isLoading = false,
  onRetry,
  isTheaterMode = false,
  onTheaterModeToggle,
  onAutoFallback,
  match = null
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);
  const [errorCount, setErrorCount] = useState(0);
  const [lastStreamUrl, setLastStreamUrl] = useState<string>('');
  const [countdown, setCountdown] = useState<string>('');

  // Check if stream is M3U8 (HLS)
  const originalIsM3U8 = !!stream?.embedUrl && /\.m3u8(\?|$)/i.test(stream.embedUrl || '');
  const isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);

  // Embed fallback state
  const [fallbackEmbedUrl, setFallbackEmbedUrl] = useState<string | null>(null);
  const [embedFallbackAttempted, setEmbedFallbackAttempted] = useState(false);
  const [hlsFailedUseIframe, setHlsFailedUseIframe] = useState(false);
  const [waitingForAutoFallback, setWaitingForAutoFallback] = useState(false);

  // Use Plyr for M3U8, unless HLS failed then use iframe
  const isM3U8 = originalIsM3U8 && !hlsFailedUseIframe;

  // Calculate countdown for upcoming matches
  useEffect(() => {
    if (!match || !match.date) {
      setCountdown('');
      return;
    }

    const matchDate = typeof match.date === 'number' ? match.date : new Date(match.date).getTime();

    if (matchDate <= Date.now()) {
      setCountdown('');
      return;
    }

    const updateCountdown = () => {
      const now = Date.now();
      const timeUntilMatch = matchDate - now;

      if (timeUntilMatch <= 0) {
        setCountdown('');
        return;
      }

      const days = Math.floor(timeUntilMatch / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeUntilMatch % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeUntilMatch % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeUntilMatch % (1000 * 60)) / 1000);

      if (days > 0) {
        setCountdown(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setCountdown(`${hours}h ${minutes}m ${seconds}s`);
      } else if (minutes > 0) {
        setCountdown(`${minutes}m ${seconds}s`);
      } else {
        setCountdown(`${seconds}s`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [match]);

  // Reset error state on stream change
  useEffect(() => {
    if (stream?.embedUrl && stream.embedUrl !== lastStreamUrl) {
      setError(false);
      setErrorCount(0);
      setLastStreamUrl(stream.embedUrl);
      setFallbackEmbedUrl(null);
      setEmbedFallbackAttempted(false);
      setHlsFailedUseIframe(false);
      setWaitingForAutoFallback(false);
      console.log('🎬 New stream loaded');

      // Track video start
      const streamId = match?.id || stream.embedUrl;
      const matchTitle = match?.title || 'Unknown Match';
      trackVideoStart(streamId, stream.embedUrl, matchTitle);
    }
  }, [stream?.embedUrl, lastStreamUrl, match]);

  // Handle embed domain failure
  const handleEmbedFailed = (failedDomain: string) => {
    console.log(`🔄 Embed failed for domain: ${failedDomain}`);
    markDomainFailed(failedDomain);

    if (!embedFallbackAttempted && hasFallbackAvailable(failedDomain) && stream) {
      const fallbackDomain = getFallbackDomain(failedDomain);

      if (fallbackDomain && stream.source && stream.id) {
        const newUrl = buildEmbedUrl(fallbackDomain, stream.source, stream.id, stream.streamNo || 1);
        console.log(`🔄 Switching to fallback: ${newUrl}`);
        toast.info('Switching to backup stream...', { duration: 2000 });
        setFallbackEmbedUrl(newUrl);
        setEmbedFallbackAttempted(true);
        setError(false);
        return;
      }
    }

    handleError();
  };

  const handleRetry = () => {
    setError(false);
    setErrorCount(0);
    setFallbackEmbedUrl(null);
    setEmbedFallbackAttempted(false);
    setHlsFailedUseIframe(false);
    setWaitingForAutoFallback(false);
    if (onRetry) onRetry();
  };

  const handleError = () => {
    const newErrorCount = errorCount + 1;
    setErrorCount(newErrorCount);
    console.log(`❌ Stream error (count: ${newErrorCount})`);

    trackVideoError('Stream failed to load', match?.id || stream?.embedUrl, 'load_error');

    // If HLS/Plyr failed, try iframe
    if (originalIsM3U8 && !hlsFailedUseIframe && stream?.source && stream?.id) {
      console.log('🔄 Plyr failed, falling back to iframe...');
      setHlsFailedUseIframe(true);
      const iframeUrl = buildEmbedUrl(getEmbedDomainSync(), stream.source, stream.id, stream.streamNo || 1);
      console.log(`🔄 Iframe fallback: ${iframeUrl}`);
      toast.info('Switching to embedded player...', { duration: 2000 });
      return;
    }

    // All internal fallbacks exhausted - try next stream source automatically
    if (onAutoFallback) {
      console.log('🔄 Trying next stream source automatically...');
      toast.info('Stream failed, trying next source...', { duration: 2000 });
      setWaitingForAutoFallback(true);
      onAutoFallback();

      // Timeout: if no new stream after 5 seconds, show error
      setTimeout(() => {
        setWaitingForAutoFallback(prev => {
          if (prev) {
            console.log('⏰ Auto-fallback timeout - showing error');
            setError(true);
            return false;
          }
          return prev;
        });
      }, 5000);

      // Don't set error - wait for new stream
      return;
    }

    setError(true);
  };

  // Loading state (including when waiting for auto-fallback)
  if (isLoading || waitingForAutoFallback) {
    return (
      <div className={`w-full ${isTheaterMode ? 'max-w-none' : 'max-w-5xl'} mx-auto aspect-video bg-black rounded-2xl flex items-center justify-center`}>
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p>{waitingForAutoFallback ? 'Switching to next source...' : 'Loading stream...'}</p>
        </div>
      </div>
    );
  }

  // Error or no stream state
  if (!stream || error) {
    return (
      <div className={`w-full ${isTheaterMode ? 'max-w-none' : 'max-w-5xl'} mx-auto aspect-video bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl flex items-center justify-center relative overflow-hidden`}>
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
        </div>

        <div className="text-center text-white p-6 z-10">
          <div className="relative mb-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <Monitor className="w-10 h-10 text-primary" />
            </div>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary rounded-full animate-pulse" />
          </div>
          <h3 className="text-xl font-bold mb-2">
            {!stream ? 'Select a Stream Link' : 'Stream Unavailable'}
          </h3>
          <p className="text-gray-400 mb-6 max-w-xs mx-auto">
            {!stream
              ? 'Choose a stream link from the options below.'
              : 'Failed to load the stream. Please try again.'
            }
          </p>
          <div className="flex items-center justify-center gap-3">
            {onRetry && (
              <Button onClick={handleRetry} className="bg-primary hover:bg-primary/90">
                <RotateCcw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            )}
            {stream?.embedUrl && (
              <a href={stream.embedUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="secondary" className="bg-white/10 hover:bg-white/20 text-white">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Stream
                </Button>
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${isTheaterMode ? 'max-w-none' : 'max-w-5xl mx-auto'}`}>
      <div
        ref={containerRef}
        className="relative bg-black rounded-2xl overflow-hidden aspect-video w-full"
      >
        {/* Countdown Overlay */}
        {isM3U8 && countdown && match && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-10 left-10 w-32 h-32 bg-primary rounded-full blur-3xl" />
              <div className="absolute bottom-10 right-10 w-32 h-32 bg-purple-500 rounded-full blur-3xl" />
            </div>

            <div className="text-center text-white p-6 z-10">
              <Clock className="w-20 h-20 mx-auto mb-6 text-primary animate-pulse" />
              <h3 className="text-2xl font-bold mb-3">Match Starting Soon</h3>
              <p className="text-gray-400 mb-6">Stream will be available when the match begins</p>

              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 mb-4 inline-block">
                <div className="text-5xl font-black text-white mb-2 font-mono tracking-wider">
                  {countdown}
                </div>
                <div className="text-sm text-gray-400 uppercase tracking-widest">Until Kickoff</div>
              </div>

              {match.title && (
                <p className="text-lg text-white/80 mt-4 font-semibold">{match.title}</p>
              )}
            </div>
          </div>
        )}

        {/* Video Player */}
        {isM3U8 ? (
          <PlyrVideoPlayer
            stream={stream}
            onError={handleError}
            onReady={() => console.log('Plyr ready')}
            match={match}
          />
        ) : (
          <IframeVideoPlayer
            src={(() => {
              if (hlsFailedUseIframe && stream?.source && stream?.id) {
                return buildEmbedUrl(getEmbedDomainSync(), stream.source, stream.id, stream.streamNo || 1);
              }
              return fallbackEmbedUrl || stream.embedUrl;
            })()}
            onLoad={() => setError(false)}
            onError={handleError}
            onEmbedFailed={handleEmbedFailed}
            title={match?.title}
            matchStartTime={match?.date ? (typeof match.date === 'string' ? new Date(match.date).getTime() : match.date) : undefined}
            match={match}
          />
        )}

        {/* Android external open button */}
        {!isM3U8 && isAndroid && (
          <div className="absolute top-4 left-4">
            <Button asChild className="bg-black/50 hover:bg-black/70 text-white border-0" size="sm">
              <a href={stream.embedUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                Open
              </a>
            </Button>
          </div>
        )}

        {/* Theater mode toggle */}
        {onTheaterModeToggle && (
          <div className="absolute top-4 right-4">
            <Button
              onClick={onTheaterModeToggle}
              className={`bg-black/50 hover:bg-black/70 text-white border-0 ${isTheaterMode ? 'bg-primary/70 hover:bg-primary/90' : ''}`}
              size="sm"
            >
              <Monitor className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleVideoPlayer;
