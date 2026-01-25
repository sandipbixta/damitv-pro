import React, { useEffect, useRef } from 'react';

interface MediumRectangleAdProps {
  className?: string;
}

const MediumRectangleAd: React.FC<MediumRectangleAdProps> = ({ className = '' }) => {
  const adContainerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    if (!adContainerRef.current || scriptLoadedRef.current) return;

    const container = adContainerRef.current;
    const containerId = `medium-rect-ad-${Date.now()}`;
    container.id = containerId;

    const timer = setTimeout(() => {
      // Set global atOptions for 300x250 Medium Rectangle
      (window as any).atOptions = {
        'key': '7c589340b2a1155dcea92f44cc468438',
        'format': 'iframe',
        'height': 250,
        'width': 300,
        'params': {}
      };

      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = 'https://foreseehawancestor.com/7c589340b2a1155dcea92f44cc468438/invoke.js';

      container.appendChild(script);
      scriptLoadedRef.current = true;
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className={`w-full flex justify-center py-4 ${className}`}>
      <div
        ref={adContainerRef}
        className="flex justify-center items-center"
        style={{ minWidth: '300px', minHeight: '250px' }}
      />
    </div>
  );
};

export default MediumRectangleAd;
