import React, { useRef, useEffect, useState } from 'react';
import Hls from 'hls.js';
import { Stream, Match } from '../../types/sports';
import { ManualMatch } from '../../types/manualMatch';
import { Button } from '../ui/button';
import { Play, RotateCcw, Maximize, ExternalLink, Monitor, Clock, Users } from 'lucide-react';
import StreamIframe from './StreamIframe';
import StreamQualitySelector from '../StreamQualitySelector';
import BufferIndicator from '../BufferIndicator';
import { LiveViewerCount } from '../LiveViewerCount';
import { getConnectionInfo, getOptimizedHLSConfig, detectCasting, onConnectionChange, detectGeographicLatency } from '../../utils/connectionOptimizer';


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
  const isM3U8 = !!stream?.embedUrl && /\.m3u8(\?|$)/i.test(stream.embedUrl || '');
  const isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);
  const isCasting = detectCasting();
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
      console.log('🎬 New stream loaded, resetting error state');
      
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

  const handleRetry = () => {
    setError(false);
    setErrorCount(0);
    if (onRetry) {
      onRetry();
    }
  };

  // Auto-fallback on error
  const handleError = () => {
    const newErrorCount = errorCount + 1;
    setErrorCount(newErrorCount);
    setError(true);
    
    console.log(`❌ Stream error detected (count: ${newErrorCount})`);
    
    // Trigger auto-fallback after first error
    if (newErrorCount === 1 && onAutoFallback) {
      console.log('🔄 Triggering auto-fallback to next source...');
      setTimeout(() => {
        onAutoFallback();
      }, 1500); // Wait 1.5s before trying next source
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(() => {
        console.log('Fullscreen failed');
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
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

  if (!stream || error) {
    // Show countdown timer if match hasn't started yet
    if (!stream && countdown && match) {
      // Parse countdown into separate parts
      const countdownParts = countdown.split(/[hms\s]+/).filter(Boolean);
      const hasHours = countdown.includes('h');
      const hasMinutes = countdown.includes('m');
      const hasDays = countdown.includes('d');
      
      // Extract time values
      let hours = '00', minutes = '00', seconds = '00';
      if (hasDays) {
        // Format: "Xd Xh Xm"
        hours = countdownParts[1]?.padStart(2, '0') || '00';
        minutes = countdownParts[2]?.padStart(2, '0') || '00';
        seconds = '00';
      } else if (hasHours) {
        // Format: "Xh Xm Xs"
        hours = countdownParts[0]?.padStart(2, '0') || '00';
        minutes = countdownParts[1]?.padStart(2, '0') || '00';
        seconds = countdownParts[2]?.padStart(2, '0') || '00';
      } else if (hasMinutes) {
        // Format: "Xm Xs"
        hours = '00';
        minutes = countdownParts[0]?.padStart(2, '0') || '00';
        seconds = countdownParts[1]?.padStart(2, '0') || '00';
      } else {
        // Just seconds
        seconds = countdownParts[0]?.padStart(2, '0') || '00';
      }

      const homeTeam = (match as Match).teams?.home;
      const awayTeam = (match as Match).teams?.away;
      const tournament = (match as Match).tournament;

      return (
        <div className={`w-full ${isTheaterMode ? 'max-w-none' : 'max-w-5xl'} mx-auto aspect-video bg-gradient-to-br from-[#0f1419] via-[#1a1f2e] to-[#0f1419] rounded-lg sm:rounded-2xl flex items-center justify-center relative overflow-hidden`}>
          {/* Background decoration - colorful blurs */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-20 -left-20 w-40 h-40 sm:w-64 sm:h-64 bg-blue-600/30 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -right-20 w-40 h-40 sm:w-64 sm:h-64 bg-red-500/20 rounded-full blur-3xl" />
            <div className="absolute top-1/2 right-0 w-32 h-32 sm:w-48 sm:h-48 bg-purple-500/20 rounded-full blur-3xl" />
          </div>
          
          <div className="text-center text-white p-3 sm:p-6 z-10 w-full max-w-lg">
            {/* Watch Live In */}
            <p className="text-xs sm:text-sm text-gray-300 mb-2 sm:mb-3 tracking-wide">Watch Live In</p>
            
            {/* Countdown Timer Boxes */}
            <div className="flex items-center justify-center gap-1 sm:gap-2 mb-4 sm:mb-6">
              <div className="bg-white text-black font-bold text-xl sm:text-3xl md:text-4xl px-2 sm:px-4 py-1 sm:py-2 rounded-md min-w-[40px] sm:min-w-[60px]">
                {hours}
              </div>
              <span className="text-white text-xl sm:text-3xl font-bold">:</span>
              <div className="bg-white text-black font-bold text-xl sm:text-3xl md:text-4xl px-2 sm:px-4 py-1 sm:py-2 rounded-md min-w-[40px] sm:min-w-[60px]">
                {minutes}
              </div>
              <span className="text-white text-xl sm:text-3xl font-bold">:</span>
              <div className="bg-white text-black font-bold text-xl sm:text-3xl md:text-4xl px-2 sm:px-4 py-1 sm:py-2 rounded-md min-w-[40px] sm:min-w-[60px]">
                {seconds}
              </div>
            </div>

            {/* Tournament/League Name */}
            {tournament && (
              <p className="text-xs sm:text-sm text-gray-300 mb-3 sm:mb-4">{tournament}</p>
            )}

            {/* Team Names and Logos */}
            <div className="flex items-center justify-center gap-2 sm:gap-4">
              {/* Home Team */}
              <div className="flex flex-col items-center gap-1 sm:gap-2 flex-1">
                {homeTeam?.badge && (
                  <img 
                    src={homeTeam.badge} 
                    alt={homeTeam.name || 'Home team'} 
                    className="w-10 h-10 sm:w-16 sm:h-16 md:w-20 md:h-20 object-contain"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                )}
                <span className="text-xs sm:text-sm md:text-base font-semibold text-white truncate max-w-[100px] sm:max-w-[150px]">
                  {homeTeam?.name || 'Home'}
                </span>
              </div>

              {/* VS */}
              <span className="text-[hsl(16,100%,60%)] font-bold text-sm sm:text-lg mx-1 sm:mx-2">Vs</span>

              {/* Away Team */}
              <div className="flex flex-col items-center gap-1 sm:gap-2 flex-1">
                {awayTeam?.badge && (
                  <img 
                    src={awayTeam.badge} 
                    alt={awayTeam.name || 'Away team'} 
                    className="w-10 h-10 sm:w-16 sm:h-16 md:w-20 md:h-20 object-contain"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                )}
                <span className="text-xs sm:text-sm md:text-base font-semibold text-white truncate max-w-[100px] sm:max-w-[150px]">
                  {awayTeam?.name || 'Away'}
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    }

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
      {/* Countdown Overlay - Show over everything when match hasn't started */}
      {countdown && match && (() => {
        // Parse countdown into separate parts
        const countdownParts = countdown.split(/[hms\s]+/).filter(Boolean);
        const hasHours = countdown.includes('h');
        const hasMinutes = countdown.includes('m');
        const hasDays = countdown.includes('d');
        
        // Extract time values
        let hours = '00', minutes = '00', seconds = '00';
        if (hasDays) {
          hours = countdownParts[1]?.padStart(2, '0') || '00';
          minutes = countdownParts[2]?.padStart(2, '0') || '00';
          seconds = '00';
        } else if (hasHours) {
          hours = countdownParts[0]?.padStart(2, '0') || '00';
          minutes = countdownParts[1]?.padStart(2, '0') || '00';
          seconds = countdownParts[2]?.padStart(2, '0') || '00';
        } else if (hasMinutes) {
          hours = '00';
          minutes = countdownParts[0]?.padStart(2, '0') || '00';
          seconds = countdownParts[1]?.padStart(2, '0') || '00';
        } else {
          seconds = countdownParts[0]?.padStart(2, '0') || '00';
        }

        const homeTeam = (match as Match).teams?.home;
        const awayTeam = (match as Match).teams?.away;
        const tournament = (match as Match).tournament;

        return (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-[#0f1419] via-[#1a1f2e] to-[#0f1419]">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-20 -left-20 w-40 h-40 sm:w-64 sm:h-64 bg-blue-600/30 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -right-20 w-40 h-40 sm:w-64 sm:h-64 bg-red-500/20 rounded-full blur-3xl" />
              <div className="absolute top-1/2 right-0 w-32 h-32 sm:w-48 sm:h-48 bg-purple-500/20 rounded-full blur-3xl" />
            </div>
            
            <div className="text-center text-white p-3 sm:p-6 z-10 w-full max-w-lg">
              {/* Watch Live In */}
              <p className="text-xs sm:text-sm text-gray-300 mb-2 sm:mb-3 tracking-wide">Watch Live In</p>
              
              {/* Countdown Timer Boxes */}
              <div className="flex items-center justify-center gap-1 sm:gap-2 mb-4 sm:mb-6">
                <div className="bg-white text-black font-bold text-xl sm:text-3xl md:text-4xl px-2 sm:px-4 py-1 sm:py-2 rounded-md min-w-[40px] sm:min-w-[60px]">
                  {hours}
                </div>
                <span className="text-white text-xl sm:text-3xl font-bold">:</span>
                <div className="bg-white text-black font-bold text-xl sm:text-3xl md:text-4xl px-2 sm:px-4 py-1 sm:py-2 rounded-md min-w-[40px] sm:min-w-[60px]">
                  {minutes}
                </div>
                <span className="text-white text-xl sm:text-3xl font-bold">:</span>
                <div className="bg-white text-black font-bold text-xl sm:text-3xl md:text-4xl px-2 sm:px-4 py-1 sm:py-2 rounded-md min-w-[40px] sm:min-w-[60px]">
                  {seconds}
                </div>
              </div>

              {/* Tournament/League Name */}
              {tournament && (
                <p className="text-xs sm:text-sm text-gray-300 mb-3 sm:mb-4">{tournament}</p>
              )}

              {/* Team Names and Logos */}
              <div className="flex items-center justify-center gap-2 sm:gap-4">
                {/* Home Team */}
                <div className="flex flex-col items-center gap-1 sm:gap-2 flex-1">
                  {homeTeam?.badge && (
                    <img 
                      src={homeTeam.badge} 
                      alt={homeTeam.name || 'Home team'} 
                      className="w-10 h-10 sm:w-16 sm:h-16 md:w-20 md:h-20 object-contain"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  )}
                  <span className="text-xs sm:text-sm md:text-base font-semibold text-white truncate max-w-[100px] sm:max-w-[150px]">
                    {homeTeam?.name || 'Home'}
                  </span>
                </div>

                {/* VS */}
                <span className="text-[hsl(16,100%,60%)] font-bold text-sm sm:text-lg mx-1 sm:mx-2">Vs</span>

                {/* Away Team */}
                <div className="flex flex-col items-center gap-1 sm:gap-2 flex-1">
                  {awayTeam?.badge && (
                    <img 
                      src={awayTeam.badge} 
                      alt={awayTeam.name || 'Away team'} 
                      className="w-10 h-10 sm:w-16 sm:h-16 md:w-20 md:h-20 object-contain"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  )}
                  <span className="text-xs sm:text-sm md:text-base font-semibold text-white truncate max-w-[100px] sm:max-w-[150px]">
                    {awayTeam?.name || 'Away'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

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
            // Progress tracking removed
          }}
          onPause={() => {
            console.log('Video paused');
            // Stop progress tracking
            if (progressIntervalRef.current) {
              clearInterval(progressIntervalRef.current);
              progressIntervalRef.current = null;
            }
          }}
          onPlay={() => {
            console.log('Video resumed');
            // Resume progress tracking
            if (!progressIntervalRef.current) {
              progressIntervalRef.current = setInterval(() => {
                // Progress tracking placeholder
              }, 1000);
            }
          }}
          onWaiting={() => {
            console.log('Video buffering...');
            setIsBuffering(true);
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
        <StreamIframe
          videoRef={iframeRef}
          src={stream.embedUrl.startsWith('http://') ? stream.embedUrl.replace(/^http:\/\//i, 'https://') : stream.embedUrl}
          onLoad={() => setError(false)}
          onError={handleError}
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
        <Button
          onClick={toggleFullscreen}
          className="bg-black/50 hover:bg-black/70 text-white border-0"
          size="sm"
        >
          <Maximize className="w-4 h-4" />
        </Button>
      </div>

      {/* Buffer Indicator - center overlay */}
      <BufferIndicator isBuffering={isBuffering} />

      </div>
      
      {/* Viewer Count - Below Player */}
      {match && (
        <div className="flex items-center justify-end mt-2 px-1">
          <LiveViewerCount 
            match={match as Match} 
            size="md" 
            showTrend={true}
            className="text-muted-foreground" 
          />
        </div>
      )}
    </div>
  );
};

export default SimpleVideoPlayer;