import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

/**
 * Sticky Mobile Bottom Banner Ad (468x60)
 * - Fixed to bottom of screen on mobile only
 * - Dismissible with X button
 * - Respects user's choice (stays hidden for session)
 * - Doesn't interfere with social bar (positioned above it)
 */
const StickyMobileAd: React.FC = () => {
  const adContainerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user dismissed this session
    const dismissed = sessionStorage.getItem('stickyAdDismissed');
    if (dismissed) {
      setIsDismissed(true);
      return;
    }

    // Show after a short delay (let page load first)
    const showTimer = setTimeout(() => {
      setIsVisible(true);
    }, 3000);

    return () => clearTimeout(showTimer);
  }, []);

  useEffect(() => {
    if (!adContainerRef.current || scriptLoadedRef.current || isDismissed || !isVisible) return;

    const container = adContainerRef.current;
    container.id = `sticky-mobile-ad-${Date.now()}`;

    const timer = setTimeout(() => {
      (window as any).atOptions = {
        'key': '24887eba6a7c2444602020b1915f8a43',
        'format': 'iframe',
        'height': 60,
        'width': 468,
        'params': {}
      };

      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = 'https://foreseehawancestor.com/24887eba6a7c2444602020b1915f8a43/invoke.js';
      container.appendChild(script);
      scriptLoadedRef.current = true;
    }, 200);

    return () => clearTimeout(timer);
  }, [isDismissed, isVisible]);

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('stickyAdDismissed', 'true');
  };

  // Don't render on desktop or if dismissed
  if (isDismissed || !isVisible) return null;

  return (
    <div className="md:hidden fixed bottom-16 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-t border-border shadow-lg">
      {/* Close button */}
      <button
        onClick={handleDismiss}
        className="absolute -top-8 right-2 bg-background border border-border rounded-full p-1 shadow-md hover:bg-muted transition-colors"
        aria-label="Close ad"
      >
        <X className="w-4 h-4 text-muted-foreground" />
      </button>

      {/* Ad container */}
      <div className="flex justify-center py-2">
        <div
          ref={adContainerRef}
          className="overflow-hidden flex justify-center items-center"
          style={{ maxWidth: '468px', width: '100%', minHeight: '60px' }}
        />
      </div>
    </div>
  );
};

export default StickyMobileAd;
