import React, { useEffect, useState, useRef } from 'react';
import { Match } from '../../types/sports';
import { ManualMatch } from '../../types/manualMatch';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';

interface StreamIframeProps {
  src: string;
  onLoad: () => void;
  onError: () => void;
  videoRef: React.RefObject<HTMLIFrameElement>;
  match?: Match | ManualMatch | null;
}

const StreamIframe: React.FC<StreamIframeProps> = ({ src, onLoad, onError, videoRef, match }) => {
  const [loaded, setLoaded] = useState(false);
  const [loadingTime, setLoadingTime] = useState(0);
  const [showSlowWarning, setShowSlowWarning] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    setLoaded(false);
    setLoadingTime(0);
    setShowSlowWarning(false);
    setLoadError(false);
    startTimeRef.current = Date.now();
    
    // Update loading time every second
    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setLoadingTime(elapsed);
      
      // Show slow warning after 5 seconds
      if (elapsed >= 5 && !showSlowWarning) {
        setShowSlowWarning(true);
      }
      
      // Trigger error state after 15 seconds
      if (elapsed >= 15 && !loaded) {
        setLoadError(true);
        if (timerRef.current) clearInterval(timerRef.current);
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [src]);

  const handleLoad = () => {
    setLoaded(true);
    setLoadError(false);
    if (timerRef.current) clearInterval(timerRef.current);
    onLoad?.();
  };

  const handleError = () => {
    setLoadError(true);
    if (timerRef.current) clearInterval(timerRef.current);
    onError?.();
  };

  const handleRetry = () => {
    setLoadError(false);
    setLoaded(false);
    setLoadingTime(0);
    setShowSlowWarning(false);
    startTimeRef.current = Date.now();
    
    // Force iframe reload
    if (videoRef.current) {
      const currentSrc = videoRef.current.src;
      videoRef.current.src = '';
      setTimeout(() => {
        if (videoRef.current) videoRef.current.src = currentSrc;
      }, 100);
    }
  };

  return (
    <div className="absolute inset-0 w-full h-full bg-black">
      {/* Error State Only */}
      {loadError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-background to-muted z-10">
          <AlertCircle className="w-12 h-12 text-destructive mb-4" />
          <p className="text-foreground font-medium mb-2">Stream unavailable</p>
          <p className="text-muted-foreground text-sm mb-4 text-center max-w-xs">
            Try another source or refresh the page
          </p>
          <Button
            onClick={handleRetry}
            variant="default"
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </Button>
        </div>
      )}
      
      <iframe 
        ref={videoRef}
        src={src}
        className="w-full h-full"
        allowFullScreen
        title="Live Sports Stream - DAMITV"
        onLoad={handleLoad}
        onError={handleError}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
        referrerPolicy="origin"
        loading="eager"
        style={{ 
          border: 'none',
          width: '100%',
          height: '100%'
        }}
      />
    </div>
  );
};

export default StreamIframe;
