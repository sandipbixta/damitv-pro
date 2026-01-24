import React, { useEffect, useRef } from 'react';

interface SidebarAdProps {
  className?: string;
}

/**
 * Sidebar Skyscraper Ad (160x600)
 * Best for sticky sidebar placement on desktop
 */
const SidebarAd: React.FC<SidebarAdProps> = ({ className = '' }) => {
  const adContainerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    if (!adContainerRef.current || scriptLoadedRef.current) return;

    const container = adContainerRef.current;
    const containerId = `sidebar-ad-${Date.now()}`;
    container.id = containerId;

    // Staggered delay to avoid conflicts with other ads
    const timer = setTimeout(() => {
      (window as any).atOptions = {
        'key': 'f6b9ed5242d1d0b7ebdc00c5ebba1752',
        'format': 'iframe',
        'height': 600,
        'width': 160,
        'params': {}
      };

      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = 'https://foreseehawancestor.com/f6b9ed5242d1d0b7ebdc00c5ebba1752/invoke.js';

      container.appendChild(script);
      scriptLoadedRef.current = true;
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className={`flex justify-center ${className}`}>
      <div
        ref={adContainerRef}
        className="overflow-hidden flex justify-center items-center"
        style={{ width: '160px', minHeight: '600px' }}
      />
    </div>
  );
};

export default SidebarAd;
