import React, { useRef, useEffect, useState } from 'react';
import Hls from 'hls.js';
import { useIsMobile } from '../../hooks/use-mobile';
import { Play, Pause, Volume2, VolumeX, Maximize, Home, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import { useNavigate } from 'react-router-dom';

interface Html5VideoPlayerProps {
  src: string;
  onLoad: () => void;
  onError: () => void;
  videoRef: React.RefObject<HTMLVideoElement>;
}

const Html5VideoPlayer: React.FC<Html5VideoPlayerProps> = ({ src, onLoad, onError, videoRef }) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [volume, setVolume] = useState(1);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();
  const hlsRef = useRef<Hls | null>(null);
  const internalVideoRef = useRef<HTMLVideoElement>(null);
  const actualVideoRef = videoRef || internalVideoRef;

  // Handle home navigation
  const handleHomeClick = () => {
    console.log('DAMITV home button clicked from HTML5 player');
    navigate('/');
  };

  // Auto-hide controls after 3 seconds of inactivity
  const resetControlsTimeout = () => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    setShowControls(true);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 4000);
  };

  // Initialize HLS.js for m3u8 streams
  useEffect(() => {
    if (!src || !actualVideoRef.current) return;
    
    const video = actualVideoRef.current;
    const isHLS = /\.m3u8(\?|$)/i.test(src);
    
    // Clean up previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    
    setHasError(false);
    setIsLoading(true);
    
    if (isHLS) {
      // Check for native HLS support (Safari, iOS)
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        console.log('📺 Using native HLS support');
        video.src = src;
        video.load();
      } else if (Hls.isSupported()) {
        console.log('📺 Using HLS.js for stream playback');
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
          maxBufferSize: 60 * 1000 * 1000,
          fragLoadingTimeOut: 20000,
          manifestLoadingTimeOut: 10000,
          levelLoadingTimeOut: 10000,
          startLevel: -1,
          autoStartLoad: true,
        });
        
        hlsRef.current = hls;
        hls.loadSource(src);
        hls.attachMedia(video);
        
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          console.log('📺 HLS manifest parsed, starting playback');
          setIsLoading(false);
          video.play().catch((e) => {
            console.log('Autoplay blocked:', e);
          });
        });
        
        hls.on(Hls.Events.ERROR, (_event, data) => {
          console.error('HLS error:', data.type, data.details);
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.log('🔄 Network error, attempting recovery...');
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.log('🔄 Media error, attempting recovery...');
                hls.recoverMediaError();
                break;
              default:
                console.error('💥 Fatal HLS error');
                setHasError(true);
                setIsLoading(false);
                onError();
                break;
            }
          }
        });
      } else {
        console.error('HLS is not supported in this browser');
        setHasError(true);
        setIsLoading(false);
        onError();
      }
    } else {
      // Regular video source
      video.src = src;
      video.load();
    }
    
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src, onError]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  // Video event handlers
  const handleLoadedData = () => {
    console.log('✅ Video loaded successfully');
    setIsLoading(false);
    onLoad();
  };

  const handleVideoError = () => {
    console.error('❌ Video failed to load');
    setHasError(true);
    setIsLoading(false);
    onError();
  };

  const handlePlay = () => {
    setIsPlaying(true);
    resetControlsTimeout();
  };

  const handlePause = () => {
    setIsPlaying(false);
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
  };

  const handleRetry = () => {
    setHasError(false);
    setIsLoading(true);
    if (actualVideoRef.current) {
      actualVideoRef.current.load();
    }
  };

  // Show error state
  if (hasError) {
    return (
      <div className="relative w-full h-full bg-black flex items-center justify-center">
        <div className="text-center text-white p-4">
          <p className="text-lg mb-4">Stream failed to load</p>
          <Button onClick={handleRetry} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="relative w-full h-full bg-black overflow-hidden"
      onMouseMove={() => resetControlsTimeout()}
      onTouchStart={() => resetControlsTimeout()}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      )}
      
      <video
        ref={actualVideoRef}
        className="w-full h-full object-contain"
        controls={false}
        autoPlay
        playsInline
        preload="auto"
        crossOrigin="anonymous"
        onLoadedData={handleLoadedData}
        onError={handleVideoError}
        onPlay={handlePlay}
        onPause={handlePause}
        onVolumeChange={() => {
          if (actualVideoRef.current) {
            setVolume(actualVideoRef.current.volume);
            setIsMuted(actualVideoRef.current.muted);
          }
        }}
      />

      {/* Always Visible DAMITV Home Button - Top Center */}
      <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-50">
        <Button
          variant="ghost"
          onClick={handleHomeClick}
          className="bg-black/80 hover:bg-black/90 text-white px-2 py-1 h-7 flex items-center gap-1 border border-white/20 shadow-lg"
          title="Go to DAMITV Home"
        >
          <Home className="h-3 w-3" />
          <span className="font-bold text-xs">DAMITV</span>
        </Button>
      </div>
      
      {/* Custom Video Controls */}
      <div 
        className={`absolute inset-0 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Top Controls Bar - moved down to avoid overlap */}
        <div className="absolute top-10 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-4">
          <div className="flex items-center justify-end">
            {/* Spacer to avoid overlap with always-visible button */}
            <div className="flex-1"></div>
          </div>
        </div>

        {/* Play/Pause Overlay */}
        <div 
          className="absolute inset-0 flex items-center justify-center cursor-pointer"
          onClick={() => {
            if (actualVideoRef.current) {
              if (isPlaying) {
                actualVideoRef.current.pause();
              } else {
                actualVideoRef.current.play();
              }
            }
          }}
        >
          {!isPlaying && (
            <div className="bg-black/50 rounded-full p-4">
              <Play className="h-12 w-12 text-white" fill="white" />
            </div>
          )}
        </div>
        
        {/* Bottom Controls Bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="flex items-center gap-3">
            {/* Play/Pause Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (actualVideoRef.current) {
                  if (isPlaying) {
                    actualVideoRef.current.pause();
                  } else {
                    actualVideoRef.current.play();
                  }
                }
              }}
              className="text-white hover:bg-white/20 h-8 w-8"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            
            {/* Volume Controls */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (actualVideoRef.current) {
                    actualVideoRef.current.muted = !isMuted;
                    setIsMuted(!isMuted);
                  }
                }}
                className="text-white hover:bg-white/20 h-8 w-8"
              >
                {isMuted || volume === 0 ? 
                  <VolumeX className="h-4 w-4" /> : 
                  <Volume2 className="h-4 w-4" />
                }
              </Button>
              
              {!isMobile && (
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={(e) => {
                    const newVolume = parseFloat(e.target.value);
                    setVolume(newVolume);
                    if (actualVideoRef.current) {
                      actualVideoRef.current.volume = newVolume;
                      setIsMuted(newVolume === 0);
                    }
                  }}
                  className="w-16 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer"
                />
              )}
            </div>
            
            {/* Spacer */}
            <div className="flex-1" />
            
            {/* Fullscreen Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (actualVideoRef.current) {
                  if (document.fullscreenElement) {
                    document.exitFullscreen();
                  } else {
                    actualVideoRef.current.requestFullscreen();
                  }
                }
              }}
              className="text-white hover:bg-white/20 h-8 w-8"
            >
              <Maximize className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Html5VideoPlayer;
