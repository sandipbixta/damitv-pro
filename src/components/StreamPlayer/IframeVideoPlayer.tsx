
import React, { useRef, useEffect, useState } from 'react';
import { useIsMobile } from '../../hooks/use-mobile';
import { Home, Clock } from 'lucide-react';
import { Button } from '../ui/button';
import { useNavigate } from 'react-router-dom';

interface IframeVideoPlayerProps {
  src: string;
  onLoad: () => void;
  onError: () => void;
  title?: string;
  matchStartTime?: number | Date | null;
}

const IframeVideoPlayer: React.FC<IframeVideoPlayerProps> = ({ src, onLoad, onError, title, matchStartTime }) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSrc, setLastSrc] = useState('');
  const [reloadCount, setReloadCount] = useState(0);
  const [countdown, setCountdown] = useState<string>('');

  // Calculate countdown for upcoming matches
  useEffect(() => {
    if (!matchStartTime) {
      setCountdown('');
      return;
    }

    const matchDate = typeof matchStartTime === 'number' ? matchStartTime : new Date(matchStartTime).getTime();

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
  }, [matchStartTime]);

  // Handle home navigation
  const handleHomeClick = () => {
    console.log('DAMITV home button clicked from iframe player');
    navigate('/');
  };


  // Handle iframe load success
  const handleIframeLoad = () => {
    console.log('✅ Iframe content loaded');
    setIsLoading(false);
    onLoad();
    
    // Give the iframe content time to fully initialize
    setTimeout(() => {
      console.log('🎬 Stream should now be ready for playback');
    }, 1000);
  };

  // Handle iframe load error
  const handleIframeError = () => {
    console.error('❌ Iframe failed to load');
    setIsLoading(false);
    onError();
  };

  // Smart iframe reloading - only when src actually changes and with proper delay
  useEffect(() => {
    if (!src || src === lastSrc) return;
    
    console.log('🔄 Stream URL changed, reloading iframe...');
    setLastSrc(src);
    setIsLoading(true);
    setReloadCount(prev => prev + 1);
    
    if (iframeRef.current) {
      // Clear existing src first
      iframeRef.current.src = 'about:blank';
      
      // Wait longer before setting new src to ensure clean reload
      setTimeout(() => {
        if (iframeRef.current && src) {
          console.log('🎯 Setting new iframe src:', src.substring(0, 80) + '...');
          iframeRef.current.src = src;
        }
      }, 300); // Increased delay for better reliability
    }
  }, [src, lastSrc]);

  // Timeout handling with longer duration for streaming content
  useEffect(() => {
    if (!isLoading) return;
    
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.log('⏰ Iframe load timeout - assuming successful');
        setIsLoading(false);
        onLoad(); // Assume success after reasonable wait time
      }
    }, 15000); // Increased to 15 seconds for streaming content

    return () => clearTimeout(timeout);
  }, [isLoading, onLoad, reloadCount]);

  // Auto-hide controls
  useEffect(() => {
    if (!showControls) return;
    
    const timer = setTimeout(() => {
      setShowControls(false);
    }, 5000); // Increased to 5 seconds

    const handleMouseMove = () => {
      setShowControls(true);
    };

    const container = iframeRef.current?.parentElement;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      return () => {
        container.removeEventListener('mousemove', handleMouseMove);
        clearTimeout(timer);
      };
    }

    return () => clearTimeout(timer);
  }, [showControls]);

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      {/* Countdown Display - Show when match hasn't started */}
      {countdown && matchStartTime && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
          {/* Background decoration */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-32 h-32 bg-primary rounded-full blur-3xl" />
            <div className="absolute bottom-10 right-10 w-32 h-32 bg-purple-500 rounded-full blur-3xl" />
          </div>
          
          <div className="text-center text-white p-6 z-10">
            <Clock className="w-16 h-16 mx-auto mb-4 text-primary animate-pulse" />
            <h3 className="text-xl font-bold mb-2">Match Starting Soon</h3>
            <p className="text-sm text-gray-400 mb-4">Stream will be available when the match begins</p>
            
            {/* Countdown Display */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 inline-block">
              <div className="text-4xl font-black text-white mb-1 font-mono tracking-wider">
                {countdown}
              </div>
              <div className="text-xs text-gray-400 uppercase tracking-widest">Until Kickoff</div>
            </div>
            
            {title && (
              <p className="text-base text-white/80 mt-3 font-semibold">
                {title}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Loading indicator - only show for first 3 seconds and when no countdown */}
      {isLoading && reloadCount <= 1 && !countdown && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#151922]">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
            <p className="text-sm">Loading stream...</p>
            <p className="text-xs text-gray-400 mt-1">Preparing video player...</p>
          </div>
        </div>
      )}

      <iframe 
        ref={iframeRef}
        className="w-full h-full absolute inset-0"
        allowFullScreen
        title={title || "Live Stream"}
        onLoad={handleIframeLoad}
        onError={handleIframeError}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
        referrerPolicy="no-referrer"
        loading="eager"
        style={{ 
          border: 'none',
          pointerEvents: 'auto'
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

    </div>
  );
};

export default IframeVideoPlayer;
