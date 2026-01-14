import React, { useEffect, useRef } from 'react';

interface NativeAdProps {
  className?: string;
}

const NativeAd: React.FC<NativeAdProps> = ({ className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptLoaded = useRef(false);

  useEffect(() => {
    if (scriptLoaded.current || !containerRef.current) return;

    // Create the ad container div
    const adContainer = document.createElement('div');
    adContainer.id = 'container-a873bc1d3d203f2f13c32a99592441b8';
    containerRef.current.appendChild(adContainer);

    // Create and load the script
    const script = document.createElement('script');
    script.async = true;
    script.setAttribute('data-cfasync', 'false');
    script.src = 'https://foreseehawancestor.com/a873bc1d3d203f2f13c32a99592441b8/invoke.js';
    
    containerRef.current.appendChild(script);
    scriptLoaded.current = true;

    return () => {
      // Cleanup on unmount
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
      scriptLoaded.current = false;
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className={`native-ad-container min-h-[250px] bg-sports-card rounded-lg overflow-hidden ${className}`}
    />
  );
};

export default NativeAd;
