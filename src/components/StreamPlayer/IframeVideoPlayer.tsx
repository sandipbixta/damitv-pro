import React, { useRef, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { removeAdsFromIframe, setupDelayedAdBlocking, injectAdBlockStyles } from '../../utils/adBlocker';

interface IframeVideoPlayerProps {
  src: string;
  fallbackSrc?: string;
  onLoad: () => void;
  onError: () => void;
  title?: string;
}

const IframeVideoPlayer: React.FC<IframeVideoPlayerProps> = ({ src, fallbackSrc, onLoad, onError, title }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSrc, setLastSrc] = useState('');
  const [reloadCount, setReloadCount] = useState(0);
  const [currentSrc, setCurrentSrc] = useState(src);
  const [hasTriedFallback, setHasTriedFallback] = useState(false);
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const fallbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Switch to fallback stream
  const switchToFallback = () => {
    if (fallbackSrc && !hasTriedFallback) {
      console.log('🔄 Switching to fallback stream:', fallbackSrc);
      setHasTriedFallback(true);
      setIsUsingFallback(true);
      setCurrentSrc(fallbackSrc);
      setIsLoading(true);
    }
  };

  // Handle iframe load success with ad blocking
  const handleIframeLoad = () => {
    console.log('✅ Iframe content loaded');
    setIsLoading(false);
    onLoad();
    
    // Apply ad blocking on iframe load
    if (iframeRef.current) {
      removeAdsFromIframe(iframeRef.current);
      injectAdBlockStyles(iframeRef.current);
      setupDelayedAdBlocking(iframeRef.current, () => {
        console.log('🎬 Stream ready with ad blocking applied');
      });
    }

    // Start 20-second fallback timeout if primary stream and fallback is available
    // This handles cases where iframe loads but video inside fails
    if (fallbackSrc && !hasTriedFallback && !isUsingFallback) {
      console.log('⏱️ Starting 20-second fallback timer...');
      if (fallbackTimeoutRef.current) {
        clearTimeout(fallbackTimeoutRef.current);
      }
      fallbackTimeoutRef.current = setTimeout(() => {
        // Only switch if user hasn't interacted and we haven't tried fallback yet
        if (!hasTriedFallback) {
          console.log('⏰ 20 seconds elapsed - auto-switching to fallback stream');
          switchToFallback();
        }
      }, 20000);
    }
  };

  // Handle iframe load error - try fallback first
  const handleIframeError = () => {
    console.error('❌ Iframe failed to load:', currentSrc);
    
    // Clear fallback timeout since we're handling error
    if (fallbackTimeoutRef.current) {
      clearTimeout(fallbackTimeoutRef.current);
    }
    
    // Try fallback URL if available and not already tried
    if (fallbackSrc && !hasTriedFallback) {
      console.log('🔄 Primary stream failed, switching to fallback:', fallbackSrc);
      switchToFallback();
      return;
    }
    
    setIsLoading(false);
    onError();
  };

  // Cleanup fallback timeout on unmount or src change
  useEffect(() => {
    return () => {
      if (fallbackTimeoutRef.current) {
        clearTimeout(fallbackTimeoutRef.current);
      }
    };
  }, []);

  // Reset fallback state when src changes
  useEffect(() => {
    if (src !== lastSrc) {
      setHasTriedFallback(false);
      setIsUsingFallback(false);
      setCurrentSrc(src);
      // Clear any existing timeout
      if (fallbackTimeoutRef.current) {
        clearTimeout(fallbackTimeoutRef.current);
      }
    }
  }, [src, lastSrc]);

  // Smart iframe reloading - only when currentSrc actually changes and with proper delay
  useEffect(() => {
    if (!currentSrc || currentSrc === lastSrc) return;
    
    console.log('🔄 Stream URL changed, reloading iframe...');
    setLastSrc(currentSrc);
    setIsLoading(true);
    setReloadCount(prev => prev + 1);
    
    if (iframeRef.current) {
      // Clear existing src first
      iframeRef.current.src = 'about:blank';
      
      // Wait longer before setting new src to ensure clean reload
      setTimeout(() => {
        if (iframeRef.current && currentSrc) {
          console.log('🎯 Setting new iframe src:', currentSrc.substring(0, 80) + '...');
          iframeRef.current.src = currentSrc;
        }
      }, 300);
    }
  }, [currentSrc, lastSrc]);

  // Timeout handling with longer duration for streaming content
  useEffect(() => {
    if (!isLoading) return;
    
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.log('⏰ Iframe load timeout - assuming successful');
        setIsLoading(false);
        onLoad();
      }
    }, 15000);

    return () => clearTimeout(timeout);
  }, [isLoading, onLoad, reloadCount]);

  // Auto-hide controls
  useEffect(() => {
    if (!showControls) return;
    
    const timer = setTimeout(() => {
      setShowControls(false);
    }, 5000);

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

      {/* Premium Loading State */}
      {isLoading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gradient-to-br from-[#0a0a0a] via-[#111111] to-[#0a0a0a]">
          {/* Animated rings */}
          <div className="relative">
            <div className="absolute inset-0 w-16 h-16 rounded-full border-2 border-primary/30 animate-ping" />
            <div className="absolute inset-0 w-16 h-16 rounded-full border border-primary/20" />
            <div className="relative w-16 h-16 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          </div>
          <p className="mt-6 text-white/90 font-semibold text-sm tracking-wide">
            {isUsingFallback ? 'Connecting to backup stream...' : 'Connecting to stream...'}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
            <p className="text-white/40 text-xs font-medium uppercase tracking-widest">
              {isUsingFallback ? 'BACKUP' : 'DAMITV'}
            </p>
          </div>
        </div>
      )}

      {/* Fallback indicator badge */}
      {isUsingFallback && !isLoading && (
        <div className="absolute top-2 right-2 z-20 bg-orange-500/90 text-white text-xs px-2 py-1 rounded-md font-medium">
          Backup Stream
        </div>
      )}

      <iframe 
        ref={iframeRef}
        src={currentSrc}
        className="w-full h-full absolute inset-0"
        allowFullScreen
        title={title || "Live Stream"}
        onLoad={handleIframeLoad}
        onError={handleIframeError}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
        loading="eager"
        style={{ 
          border: 'none'
        }}
      />
    </div>
  );
};

export default IframeVideoPlayer;
