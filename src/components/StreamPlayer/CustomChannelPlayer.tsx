import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CustomChannelPlayerProps {
  embedUrl: string;
  title?: string;
  onError?: () => void;
}

const CustomChannelPlayer: React.FC<CustomChannelPlayerProps> = ({
  embedUrl,
  title = "Live Stream",
  onError
}) => {
  const navigate = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Hide controls after 3 seconds of inactivity
    const resetControlsTimeout = () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      setShowControls(true);
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    };

    resetControlsTimeout();
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  const handleMouseMove = () => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    setShowControls(true);
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  const handleLoad = () => {
    setIsLoading(false);
    console.log('✅ Custom channel player loaded successfully');
  };

  const handleError = () => {
    setIsLoading(false);
    console.error('❌ Custom channel player failed to load');
    onError?.();
  };

  const toggleFullscreen = () => {
    const container = iframeRef.current?.parentElement;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(err => {
        console.error('Error attempting to enable fullscreen:', err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const handleHomeClick = () => {
    navigate('/');
  };

  return (
    <div 
      className="relative w-full max-w-5xl mx-auto aspect-video bg-background rounded-lg overflow-hidden group"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setShowControls(true)}
    >
      {/* Custom styled iframe */}
      <iframe
        ref={iframeRef}
        src={embedUrl}
        width="100%"
        height="100%"
        allowFullScreen
        title={title}
        allow="autoplay; fullscreen; picture-in-picture"
        style={{ 
          border: 'none',
          background: 'hsl(var(--background))'
        }}
        onLoad={handleLoad}
        onError={handleError}
        className="w-full h-full"
      />

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
          <div className="text-center text-foreground">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sports-primary mx-auto mb-4"></div>
            <p>Loading stream...</p>
          </div>
        </div>
      )}

      {/* Fixed Home Button */}
      <button
        onClick={handleHomeClick}
        className="absolute top-4 left-4 z-50 bg-background/70 hover:bg-background/90 text-foreground p-2 rounded-lg transition-all duration-200 backdrop-blur-sm"
        title="Go to Home"
      >
        <Home size={20} />
      </button>

      {/* Custom Controls Overlay */}
      <div className={`absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent transition-opacity duration-300 ${
        showControls ? 'opacity-100' : 'opacity-0'
      }`}>
        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex items-center justify-between text-foreground">
            {/* Left controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2 hover:bg-muted/40 rounded-full transition-colors"
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Pause size={24} /> : <Play size={24} />}
              </button>
              
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-2 hover:bg-muted/40 rounded-full transition-colors"
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
              </button>
            </div>

            {/* Center spacer */}
            <div className="flex-1"></div>

            {/* Right controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={toggleFullscreen}
                className="p-2 hover:bg-muted/40 rounded-full transition-colors"
                title="Fullscreen"
              >
                <Maximize size={24} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Live indicator */}
      <div className="absolute top-4 right-4 bg-sports-primary text-foreground text-xs px-2 py-1 rounded-full font-medium">
        • LIVE
      </div>
    </div>
  );
};

export default CustomChannelPlayer;