import React, { useEffect, useRef, useState } from 'react';

interface BannerAdProps {
  className?: string;
}

const BannerAd: React.FC<BannerAdProps> = ({ className = '' }) => {
  const adContainerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 500);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!adContainerRef.current || scriptLoadedRef.current) return;

    const container = adContainerRef.current;

    // Create a unique container ID
    const containerId = `banner-ad-${Date.now()}`;
    container.id = containerId;

    // Use a small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      // Set global atOptions - use smaller size for mobile
      (window as any).atOptions = {
        'key': '24887eba6a7c2444602020b1915f8a43',
        'format': 'iframe',
        'height': 60,
        'width': 468,
        'params': {}
      };

      // Create and append the invoke script
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = 'https://foreseehawancestor.com/24887eba6a7c2444602020b1915f8a43/invoke.js';

      container.appendChild(script);
      scriptLoadedRef.current = true;
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  // Calculate scale for mobile to fit the ad within screen
  const scale = isMobile ? Math.min(1, (window.innerWidth - 32) / 468) : 1;

  return (
    <div className={`w-full flex justify-center py-2 overflow-hidden ${className}`}>
      <div
        className="overflow-hidden flex justify-center items-center"
        style={{
          maxWidth: '100%',
          width: isMobile ? `${468 * scale}px` : '468px'
        }}
      >
        <div
          ref={adContainerRef}
          className="flex justify-center items-center"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'center center',
            minHeight: `${60 * scale}px`,
            width: '468px'
          }}
        />
      </div>
    </div>
  );
};

export default BannerAd;
