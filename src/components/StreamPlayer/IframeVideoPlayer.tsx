import React, { useRef, useEffect, useState } from 'react';
import { useIsMobile } from '../../hooks/use-mobile';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '../ui/button';
import { useNavigate } from 'react-router-dom';
import { Match } from '../../types/sports';
import { ManualMatch } from '../../types/manualMatch';
import { getBohoImageUrl } from '../../api/sportsApi';
import { removeAdsFromIframe, setupDelayedAdBlocking, injectAdBlockStyles } from '../../utils/adBlocker';

interface IframeVideoPlayerProps {
  src: string;
  onLoad: () => void;
  onError: () => void;
  onEmbedFailed?: (failedDomain: string) => void;
  title?: string;
  matchStartTime?: number | Date | null;
  match?: Match | ManualMatch | null;
}

const IframeVideoPlayer: React.FC<IframeVideoPlayerProps> = ({ src, onLoad, onError, onEmbedFailed, title, matchStartTime, match }) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [loadAttempts, setLoadAttempts] = useState(0);

  // Ensure autoplay=true is added to embed URLs
  const embedSrc = React.useMemo(() => {
    if (!src) return src;
    // Add autoplay for embedsports.top and other embed domains
    if (!src.includes('autoplay=')) {
      const separator = src.includes('?') ? '&' : '?';
      return `${src}${separator}autoplay=true`;
    }
    return src;
  }, [src]);

  // Handle home navigation
  const handleHomeClick = () => {
    console.log('DAMITV home button clicked from iframe player');
    navigate('/');
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
  };

  // Handle iframe load error
  const handleIframeError = () => {
    console.error('❌ Iframe failed to load');
    setIsLoading(false);
    setLoadAttempts(prev => prev + 1);
    
    // Extract domain from src and notify parent for fallback
    if (onEmbedFailed && loadAttempts === 0) {
      try {
        const url = new URL(src);
        const domain = `${url.protocol}//${url.host}`;
        console.log(`🔄 Notifying parent of embed failure: ${domain}`);
        onEmbedFailed(domain);
      } catch {
        onError();
      }
    } else {
      onError();
    }
  };

  // Only track initial src - no reloading on re-renders
  const initialSrcRef = useRef(src);
  
  useEffect(() => {
    // Only log if src actually changed from initial
    if (src && src !== initialSrcRef.current) {
      console.log('🔄 Stream URL changed to:', src.substring(0, 80) + '...');
      initialSrcRef.current = src;
      setIsLoading(true);
    }
  }, [src]);

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
  }, [isLoading, onLoad]);

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
          <p className="mt-6 text-white/90 font-semibold text-sm tracking-wide">Connecting to stream...</p>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
            <p className="text-white/40 text-xs font-medium uppercase tracking-widest">DAMITV</p>
          </div>
        </div>
      )}

      <iframe
        ref={iframeRef}
        src={embedSrc}
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
