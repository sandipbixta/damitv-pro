import { useEffect, useRef, useState } from 'react';

interface AdBlockingVideoPlayerProps {
  url: string;
  thumbnail?: string;
  onPlay?: () => void;
  onEnded?: () => void;
}

const AdBlockingVideoPlayer = ({
  url,
  thumbnail,
  onPlay,
}: AdBlockingVideoPlayerProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Ad blocking script
    const blockAds = () => {
      if (iframeRef.current) {
        try {
          const iframe = iframeRef.current;

          // Attempt to access iframe content (may be blocked by CORS)
          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;

          if (iframeDoc) {
            // Remove common ad elements
            const adSelectors = [
              'iframe[src*="doubleclick"]',
              'iframe[src*="googleads"]',
              'iframe[src*="advertising"]',
              'div[class*="ad-"]',
              'div[id*="ad-"]',
              'div[class*="advertisement"]',
              '.advertisement',
              '.ad-container',
              '.ads',
              '#ads',
              '[class*="popup"]',
              '[id*="popup"]',
            ];

            adSelectors.forEach(selector => {
              const elements = iframeDoc.querySelectorAll(selector);
              elements.forEach(el => el.remove());
            });

            // Block ad scripts
            const scripts = iframeDoc.querySelectorAll('script[src]');
            scripts.forEach(script => {
              const src = script.getAttribute('src') || '';
              if (
                src.includes('doubleclick') ||
                src.includes('googleads') ||
                src.includes('advertising') ||
                src.includes('adservice')
              ) {
                script.remove();
              }
            });

            console.log('✅ Ad blocking attempted on iframe');
          }
        } catch (e) {
          // CORS will prevent access to cross-origin iframes
          console.log('⚠️ Cannot access iframe content (CORS restriction)');
        }
      }
    };

    // Try to block ads on load
    const timer = setTimeout(blockAds, 1000);

    // Try again after 3 seconds (some ads load delayed)
    const timer2 = setTimeout(blockAds, 3000);

    return () => {
      clearTimeout(timer);
      clearTimeout(timer2);
    };
  }, [url]);

  const handleLoad = () => {
    setIsLoading(false);
    onPlay?.();
  };

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-sports-darker z-10">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-border border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground text-sm">Loading stream...</p>
          </div>
        </div>
      )}

      {/* Thumbnail overlay before load */}
      {isLoading && thumbnail && (
        <div 
          className="absolute inset-0 bg-cover bg-center z-5"
          style={{ backgroundImage: `url(${thumbnail})` }}
        />
      )}

      {/* Iframe with ad-blocking attributes */}
      <iframe
        ref={iframeRef}
        src={url}
        className="w-full h-full"
        allowFullScreen
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        onLoad={handleLoad}
        style={{ border: 'none' }}
        referrerPolicy="no-referrer"
        loading="lazy"
        sandbox="allow-scripts allow-same-origin allow-presentation allow-forms"
      />

      {/* Global styles to block common ad patterns */}
      <style>{`
        /* Block common ad containers */
        iframe[src*="doubleclick"],
        iframe[src*="googleads"],
        iframe[src*="advertising"],
        iframe[src*="adservice"] {
          display: none !important;
        }

        /* Prevent popup ads */
        .ad-overlay,
        .popup-ad,
        [class*="popup-overlay"],
        [class*="ad-container"] {
          display: none !important;
        }
      `}</style>
    </div>
  );
};

export default AdBlockingVideoPlayer;
