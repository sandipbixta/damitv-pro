import React, { useRef, useEffect, useState } from 'react';
import Hls from 'hls.js';
import { Stream, Match } from '../../types/sports';
import { ManualMatch } from '../../types/manualMatch';
import { Button } from '../ui/button';
import { Play, RotateCcw, Maximize, ExternalLink, Monitor, Clock } from 'lucide-react';
import IframeVideoPlayer from './IframeVideoPlayer';
import StreamQualitySelector from '../StreamQualitySelector';
import BufferIndicator from '../BufferIndicator';
import { getBohoImageUrl } from '../../api/sportsApi';
import { getConnectionInfo, getOptimizedHLSConfig, detectCasting, onConnectionChange, detectGeographicLatency } from '../../utils/connectionOptimizer';
import { 
  trackVideoStart, 
  trackVideoPause, 
  trackVideoResume, 
  trackVideoBuffering, 
  trackVideoError, 
  trackQualityChange, 
  trackFullscreen,
  createProgressTracker 
} from '../../utils/videoAnalytics';
import { markDomainFailed, getFallbackDomain, buildEmbedUrl, hasFallbackAvailable } from '../../utils/embedDomains';
import { toast } from 'sonner';


interface SimpleVideoPlayerProps {
  stream: Stream | null;
  isLoading?: boolean;
  onRetry?: () => void;
  isTheaterMode?: boolean;
  onTheaterModeToggle?: () => void;
  match?: Match | ManualMatch | null;
}

const SimpleVideoPlayer: React.FC<SimpleVideoPlayerProps> = ({
  stream,
  isLoading = false,
  onRetry,
  isTheaterMode = false,
  onTheaterModeToggle,
  match = null
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState(false);
  const [errorCount, setErrorCount] = useState(0);
  const [lastStreamUrl, setLastStreamUrl] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [currentQuality, setCurrentQuality] = useState(-1);
  const [availableQualities, setAvailableQualities] = useState<Array<{ width: number; height: number; bitrate: number }>>([]);
  const [connectionInfo, setConnectionInfo] = useState(() => getConnectionInfo());
  const [measuredLatency, setMeasuredLatency] = useState<number | null>(null);
  const [isBuffering, setIsBuffering] = useState(false);
  const [autoDowngradeAttempted, setAutoDowngradeAttempted] = useState(false);
  const bufferStallCountRef = useRef(0);
  const [countdown, setCountdown] = useState<string>('');
  const originalIsM3U8 = !!stream?.embedUrl && /\.m3u8(\?|$)/i.test(stream.embedUrl || '');
  const isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);
  const isCasting = detectCasting();
  const progressTrackerRef = useRef<ReturnType<typeof createProgressTracker> | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // No click-to-play - stream loads immediately
  
  // Embed fallback state
  const [fallbackEmbedUrl, setFallbackEmbedUrl] = useState<string | null>(null);
  const [embedFallbackAttempted, setEmbedFallbackAttempted] = useState(false);
  // Track if HLS failed and we should use iframe instead
  const [hlsFailedUseIframe, setHlsFailedUseIframe] = useState(false);
  
  // Use M3U8 player only if it's a .m3u8 URL and HLS hasn't failed
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

  // Reset error state and track stream changes
  useEffect(() => {
    if (stream?.embedUrl && stream.embedUrl !== lastStreamUrl) {
      setError(false);
      setErrorCount(0);
      setAutoDowngradeAttempted(false);
      bufferStallCountRef.current = 0;
      setLastStreamUrl(stream.embedUrl);
      setFallbackEmbedUrl(null);
      setEmbedFallbackAttempted(false);
      setHlsFailedUseIframe(false); // Reset HLS failure state
      console.log('🎬 New stream loaded, resetting error state');
      
      // Track video start event
      const streamId = match?.id || stream.embedUrl;
      const matchTitle = match?.title || 'Unknown Match';
      trackVideoStart(streamId, stream.embedUrl, matchTitle);
      
      // Initialize progress tracker
      progressTrackerRef.current = createProgressTracker(streamId);
    }
  }, [stream?.embedUrl, lastStreamUrl, match]);

  // Detect geographic latency on mount
  useEffect(() => {
    detectGeographicLatency().then((latency: number) => {
      setMeasuredLatency(latency);
      console.log('🌍 Measured geographic latency:', latency + 'ms');
      if (latency > 300) {
        console.log('🌐 High latency detected - optimizing for international viewers');
      }
    });
  }, []);

  // Monitor connection changes and update buffering strategy
  useEffect(() => {
    const cleanup = onConnectionChange((newConnectionInfo) => {
      setConnectionInfo(newConnectionInfo);
      console.log('🌐 Connection changed:', newConnectionInfo.effectiveType, `${newConnectionInfo.downlink}Mbps`);
    });
    
    return cleanup;
  }, []);

  // Handle embed domain failure - try fallback
  const handleEmbedFailed = (failedDomain: string) => {
    console.log(`🔄 Embed failed for domain: ${failedDomain}`);
    
    // Mark domain as failed
    markDomainFailed(failedDomain);
    
    // Check if we have a fallback available and haven't tried it yet
    if (!embedFallbackAttempted && hasFallbackAvailable(failedDomain) && stream) {
      const fallbackDomain = getFallbackDomain(failedDomain);
      
      if (fallbackDomain && stream.source && stream.id) {
        const newUrl = buildEmbedUrl(fallbackDomain, stream.source, stream.id, stream.streamNo || 1);
        console.log(`🔄 Switching to fallback embed: ${newUrl}`);
        
        toast.info('Switching to backup stream...', { duration: 2000 });
        setFallbackEmbedUrl(newUrl);
        setEmbedFallbackAttempted(true);
        setError(false);
        return;
      }
    }
    
    // No fallback available, show error
    handleError();
  };

  const handleRetry = () => {
    setError(false);
    setErrorCount(0);
    setFallbackEmbedUrl(null);
    setEmbedFallbackAttempted(false);
    setHlsFailedUseIframe(false); // Reset to try HLS again
    if (onRetry) {
      onRetry();
    }
  };

  // Handle error - try iframe first for HLS failures, but NO auto-fallback
  // User can manually click "Try Another Source" if needed
  const handleError = () => {
    const newErrorCount = errorCount + 1;
    setErrorCount(newErrorCount);
    
    console.log(`❌ Stream error detected (count: ${newErrorCount})`);
    
    // Track video error in GA4
    trackVideoError('Stream failed to load', match?.id || stream?.embedUrl, 'load_error');
    
    // If HLS failed and we haven't tried iframe yet, switch to iframe embed
    if (originalIsM3U8 && !hlsFailedUseIframe && stream?.source && stream?.id) {
      console.log('🔄 HLS stream failed, falling back to iframe embed...');
      setHlsFailedUseIframe(true);
      
      // Build iframe embed URL from stream source/id
      const iframeUrl = buildEmbedUrl('https://embed.damitv.pro', stream.source, stream.id, stream.streamNo || 1);
      console.log(`🔄 Iframe fallback URL: ${iframeUrl}`);
      toast.info('Switching to embedded player...', { duration: 2000 });
      return; // Don't show error, let iframe try
    }
    
    setError(true);
    
    // NO automatic fallback - let user decide via "Try Another Source" button
    // This prevents working streams from being switched away
    console.log('⚠️ Stream error - user can manually try another source');
  };

  // Stream loads immediately - no play click required

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
        trackFullscreen(true, match?.id || stream?.embedUrl);
      }).catch(() => {
        console.log('Fullscreen failed');
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
        trackFullscreen(false, match?.id || stream?.embedUrl);
      });
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Set up HLS for Android/Chrome when URL is .m3u8
  useEffect(() => {
    if (!isM3U8 || !stream?.embedUrl) return;
    const src = stream.embedUrl.startsWith('http://') ? stream.embedUrl.replace(/^http:\/\//i, 'https://') : stream.embedUrl;

    if (videoRef.current && (videoRef.current as any).canPlayType && videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      videoRef.current.src = src;
      return;
    }

    let hls: Hls | null = null;
    if (Hls.isSupported() && videoRef.current) {
      // Use measured latency if available, otherwise use connection RTT
      const effectiveLatency = measuredLatency || connectionInfo.rtt;
      const adjustedConnectionInfo = { ...connectionInfo, rtt: effectiveLatency };
      
      // Get optimized HLS configuration based on network conditions
      const optimizedConfig = getOptimizedHLSConfig(adjustedConnectionInfo, isCasting);
      
      console.log(`🔧 Initializing HLS with optimized config for ${connectionInfo.effectiveType} connection (${connectionInfo.downlink}Mbps)`);
      console.log(`📊 Buffer settings: ${optimizedConfig.maxBufferLength}s buffer, ${optimizedConfig.maxBufferSize / 1000000}MB max`);
      
      // Minimal configuration for direct streaming without buffering issues
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        
        // Minimal buffering for smooth playback
        maxBufferLength: 10,  // Reduced buffer size
        maxMaxBufferLength: 20,
        maxBufferSize: 30 * 1000 * 1000,  // 30MB
        maxBufferHole: 0.5,
        
        // Fast loading
        fragLoadingTimeOut: 10000,
        manifestLoadingTimeOut: 5000,
        levelLoadingTimeOut: 5000,
        
        // Direct streaming settings
        enableSoftwareAES: true,
        startFragPrefetch: true,
        testBandwidth: false,
        
        // Auto quality
        startLevel: -1,
        autoStartLoad: true,
        progressive: true  // Enable progressive streaming
      });
      
      // Store reference for quality control
      hlsRef.current = hls;
      
      hls.loadSource(src);
      hls.attachMedia(videoRef.current);
      
      // Enhanced error handling with smart recovery
      hls.on(Hls.Events.ERROR, (_event, data) => {
        console.error('HLS error:', data.type, data.details, data.reason);
        
        if (data.fatal) {
          switch(data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.log('🔄 Network error - attempting recovery...');
              setTimeout(() => hls?.startLoad(), 1000); // Brief delay before retry
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.log('🔄 Media error - attempting recovery...');
              hls?.recoverMediaError();
              break;
            default:
              console.log('💥 Fatal error - destroying HLS instance');
              handleError();
              break;
          }
        } else {
          // Handle non-fatal errors
          if (data.details === Hls.ErrorDetails.BUFFER_STALLED_ERROR) {
            console.log('⚠️ Buffer stalled - attempting recovery...');
            hls?.startLoad();
          }
        }
      });

      // Smart quality management
      hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
        console.log(`📺 HLS manifest parsed: ${data.levels.length} quality levels available`);
        
        // Store available qualities for the selector
        const qualities = data.levels.map(level => ({
          width: level.width,
          height: level.height,
          bitrate: level.bitrate
        }));
        setAvailableQualities(qualities);
        
        // Start with appropriate quality based on connection
        if (hls && hls.levels.length > 1) {
          // Auto quality selection
          hls.currentLevel = -1;
          setCurrentQuality(-1);
          
          // Log available qualities for debugging
          hls.levels.forEach((level, index) => {
            console.log(`Level ${index}: ${level.width}x${level.height} @ ${Math.round(level.bitrate/1000)}kbps`);
          });
        }
      });

      // Monitor buffer health and auto-adjust quality on stalls
      hls.on(Hls.Events.BUFFER_CREATED, () => {
        console.log('✅ HLS buffers created successfully');
      });

      // Detect buffering/waiting states
      hls.on(Hls.Events.BUFFER_APPENDING, () => {
        setIsBuffering(false);
      });

      hls.on(Hls.Events.BUFFER_CODECS, () => {
        setIsBuffering(false);
      });

      // Monitor buffer stalls through error event
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.details === Hls.ErrorDetails.BUFFER_STALLED_ERROR) {
          bufferStallCountRef.current++;
          console.warn(`⚠️ Buffer stall detected (count: ${bufferStallCountRef.current})`);
          
          if (bufferStallCountRef.current >= 3 && !autoDowngradeAttempted && hls.currentLevel > 0) {
            console.log('📉 Auto-downgrading quality due to persistent buffering');
            const newLevel = Math.max(0, hls.currentLevel - 1);
            hls.currentLevel = newLevel;
            setCurrentQuality(newLevel);
            setAutoDowngradeAttempted(true);
            
            // Reset counter after downgrade
            bufferStallCountRef.current = 0;
          }
        }
      });

      // Track quality changes
      hls.on(Hls.Events.LEVEL_SWITCHED, (_event, data) => {
        const level = hls.levels[data.level];
        setCurrentQuality(data.level === -1 ? -1 : data.level + 1); // Adjust for display
        console.log(`🎯 Quality switched to: ${level.width}x${level.height} @ ${Math.round(level.bitrate/1000)}kbps`);
      });

      // Monitor loading progress
      hls.on(Hls.Events.FRAG_LOADED, (_event, data) => {
        if (data.frag.type === 'main') {
          console.log(`📦 Fragment loaded: ${data.frag.sn} (${Math.round(data.frag.duration * 1000)}ms)`);
        }
      });
    }
    return () => {
      if (hls) {
        hls.destroy();
        hlsRef.current = null;
      }
    };
  }, [isM3U8, stream?.embedUrl]);

  // Handle quality change from selector
  const handleQualityChange = (level: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = level === -1 ? -1 : level - 1; // Adjust for HLS indexing
      setCurrentQuality(level);
      console.log(`🎮 Manual quality change to: ${level === -1 ? 'Auto' : `Level ${level}`}`);
      
      // Track quality change in GA4
      const qualityLabel = level === -1 ? 'Auto' : `${availableQualities[level - 1]?.height || level}p`;
      trackQualityChange(qualityLabel, match?.id || stream?.embedUrl);
    }
  };

  if (isLoading) {
    return (
      <div className={`w-full ${isTheaterMode ? 'max-w-none' : 'max-w-5xl'} mx-auto aspect-video bg-black rounded-2xl flex items-center justify-center`}>
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading stream...</p>
        </div>
      </div>
    );
  }
  // Stream loads immediately - no overlay needed

  if (!stream || error) {
    // No countdown overlay - show simple error/no stream state
    return (
      <div className={`w-full ${isTheaterMode ? 'max-w-none' : 'max-w-5xl'} mx-auto aspect-video bg-gray-900 rounded-2xl flex items-center justify-center`}>
        <div className="text-center text-white p-6">
          <Play className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">
            {!stream ? 'No Stream Available' : 'Stream Error'}
          </h3>
          <p className="text-gray-400 mb-4">
            {!stream 
              ? 'Please select a stream source to watch.' 
              : 'Failed to load the stream. Please try again.'
            }
          </p>
          <div className="flex items-center justify-center gap-3">
            {onRetry && (
              <Button onClick={handleRetry} variant="outline" className="bg-blue-600 hover:bg-blue-700">
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
        className={`relative bg-black rounded-2xl overflow-hidden ${
          isFullscreen ? 'w-screen h-screen' : 'aspect-video w-full'
        }`}
      >
      {/* Countdown Overlay - Show over everything when match hasn't started (HLS only) */}
      {isM3U8 && countdown && match && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
          {/* Background decoration */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-32 h-32 bg-primary rounded-full blur-3xl" />
            <div className="absolute bottom-10 right-10 w-32 h-32 bg-purple-500 rounded-full blur-3xl" />
          </div>
          
          <div className="text-center text-white p-6 z-10">
            <Clock className="w-20 h-20 mx-auto mb-6 text-primary animate-pulse" />
            <h3 className="text-2xl font-bold mb-3">Match Starting Soon</h3>
            <p className="text-gray-400 mb-6">Stream will be available when the match begins</p>
            
            {/* Countdown Display */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 mb-4 inline-block">
              <div className="text-5xl font-black text-white mb-2 font-mono tracking-wider">
                {countdown}
              </div>
              <div className="text-sm text-gray-400 uppercase tracking-widest">Until Kickoff</div>
            </div>
            
            {match.title && (
              <p className="text-lg text-white/80 mt-4 font-semibold">
                {match.title}
              </p>
            )}
          </div>
        </div>
      )}

      {isM3U8 ? (
        <video
          ref={videoRef}
          className="w-full h-full object-contain rounded-2xl"
          controls
          autoPlay
          muted={false}
          playsInline
          preload="auto"
          crossOrigin="anonymous"
          onError={handleError}
          onLoadStart={() => console.log('Video load started')}
          onCanPlay={() => {
            console.log('Video can play');
            setIsBuffering(false);
          }}
          onPlaying={() => {
            console.log('Video playing');
            setIsBuffering(false);
            // Start progress tracking
            if (progressTrackerRef.current && !progressIntervalRef.current) {
              progressIntervalRef.current = setInterval(() => {
                progressTrackerRef.current?.tick();
              }, 1000);
            }
          }}
          onPause={() => {
            console.log('Video paused');
            trackVideoPause(match?.id || stream?.embedUrl || 'unknown');
            // Stop progress tracking
            if (progressIntervalRef.current) {
              clearInterval(progressIntervalRef.current);
              progressIntervalRef.current = null;
            }
          }}
          onPlay={() => {
            console.log('Video resumed');
            trackVideoResume(match?.id || stream?.embedUrl || 'unknown');
            // Resume progress tracking
            if (progressTrackerRef.current && !progressIntervalRef.current) {
              progressIntervalRef.current = setInterval(() => {
                progressTrackerRef.current?.tick();
              }, 1000);
            }
          }}
          onWaiting={() => {
            console.log('Video buffering...');
            setIsBuffering(true);
            trackVideoBuffering(match?.id || stream?.embedUrl);
          }}
          onLoadedData={() => {
            console.log('Video data loaded');
            setIsBuffering(false);
          }}
          onProgress={() => console.log('Video buffering progress')}
          style={{ 
            backgroundColor: 'black',
            // Force hardware acceleration
            transform: 'translateZ(0)',
            willChange: 'transform'
          }}
        />
      ) : (
        <IframeVideoPlayer
          src={(() => {
            // If HLS failed and we're falling back, build iframe URL from source/id
            if (hlsFailedUseIframe && stream?.source && stream?.id) {
              return buildEmbedUrl('https://embed.damitv.pro', stream.source, stream.id, stream.streamNo || 1);
            }
            // Use fallback URL if available, otherwise use original
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
      {/* External open fallback on Android for non-m3u8 embeds */}
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

      {/* Theater mode, quality selector and fullscreen buttons */}
      <div className="absolute top-4 right-4 flex gap-2">
        {/* Quality Selector - only show for HLS streams */}
        {isM3U8 && availableQualities.length > 0 && (
          <StreamQualitySelector
            currentLevel={currentQuality}
            availableLevels={availableQualities}
            onQualityChange={handleQualityChange}
          />
        )}
        
        {onTheaterModeToggle && (
          <Button
            onClick={onTheaterModeToggle}
            className={`bg-black/50 hover:bg-black/70 text-white border-0 ${isTheaterMode ? 'bg-blue-600/70 hover:bg-blue-600/90' : ''}`}
            size="sm"
          >
            <Monitor className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Buffer Indicator - center overlay */}
      <BufferIndicator isBuffering={isBuffering} />

      </div>
      
    </div>
  );
};

export default SimpleVideoPlayer;