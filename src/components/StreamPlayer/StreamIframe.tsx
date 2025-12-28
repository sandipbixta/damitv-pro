import React, { useEffect, useState, useCallback } from 'react';
import { useIsMobile } from '../../hooks/use-mobile';
import { getEmbedProviders } from '@/services/bohoSportApi';

interface StreamIframeProps {
  src: string;
  onLoad: () => void;
  onError: () => void;
  videoRef: React.RefObject<HTMLIFrameElement>;
}

const StreamIframe: React.FC<StreamIframeProps> = ({ src, onLoad, onError, videoRef }) => {
  const isMobile = useIsMobile();
  const [loaded, setLoaded] = useState(false);
  const [hadError, setHadError] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);
  const [usingFallback, setUsingFallback] = useState(false);
  const isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);

  const providers = getEmbedProviders();

  // Handle iframe clicks on mobile to prevent automatic opening
  const handleIframeClick = (e: React.MouseEvent) => {
    if (isMobile) {
      e.preventDefault();
      console.log('Mobile iframe click prevented');
    }
  };

  // Switch to fallback provider
  const switchToFallback = useCallback(() => {
    if (!usingFallback && src.includes(providers.primary)) {
      const fallbackUrl = src.replace(providers.primary, providers.fallback);
      console.log(`🔄 Switching to fallback: ${fallbackUrl}`);
      setCurrentSrc(fallbackUrl);
      setUsingFallback(true);
      setLoaded(false);
      setHadError(false);
      setTimedOut(false);
    }
  }, [src, usingFallback, providers]);

  useEffect(() => {
    // Reset states when original src changes
    setCurrentSrc(src);
    setUsingFallback(false);
    setLoaded(false);
    setHadError(false);
    setTimedOut(false);

    // Timeout to detect if primary fails
    const t = window.setTimeout(() => {
      if (!loaded && !usingFallback) {
        console.log('⏱️ Primary embed timed out, switching to fallback...');
        switchToFallback();
      }
      setTimedOut(true);
    }, 5000); // 5 seconds timeout for primary

    return () => window.clearTimeout(t);
  }, [src]);

  const handleLoad = () => {
    setLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHadError(true);
    
    // If primary fails, switch to fallback
    if (!usingFallback) {
      console.log('❌ Primary embed failed, switching to fallback...');
      switchToFallback();
    } else {
      // Fallback also failed
      onError?.();
    }
  };

  const showOpenOverlay = isAndroid && usingFallback && (hadError || (timedOut && !loaded));

  return (
    <div className="absolute inset-0 w-full h-full">
      <iframe 
        ref={videoRef}
        src={currentSrc}
        className="w-full h-full"
        width="1920"
        height="1080"
        allowFullScreen
        title="Live Sports Stream"
        onLoad={handleLoad}
        onError={handleError}
        onClick={handleIframeClick}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen; camera; microphone"
        referrerPolicy="no-referrer-when-downgrade"
        loading="eager"
        frameBorder="0"
        scrolling="no"
        style={{ 
          border: 'none',
          pointerEvents: isMobile ? 'auto' : 'auto',
          minWidth: '100%',
          minHeight: '100%',
          willChange: 'transform',
          isolation: 'isolate',
          ...(isMobile && {
            touchAction: 'manipulation',
            WebkitOverflowScrolling: 'touch',
            WebkitTouchCallout: 'none',
            WebkitUserSelect: 'none',
            userSelect: 'none'
          })
        }}
      />

      {/* Show provider indicator */}
      {usingFallback && loaded && (
        <div className="absolute top-2 right-2 bg-yellow-500/80 text-black text-xs px-2 py-1 rounded">
          Using backup stream
        </div>
      )}

      {showOpenOverlay && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 px-4">
          <a
            href={currentSrc}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-md px-4 py-2 text-white bg-white/10 hover:bg-white/20"
            aria-label="Open stream in a new tab"
          >
            Open stream in new tab
          </a>
        </div>
      )}
    </div>
  );
};

export default StreamIframe;