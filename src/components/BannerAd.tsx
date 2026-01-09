import React, { useEffect, useRef } from 'react';

interface BannerAdProps {
  className?: string;
}

const BannerAd: React.FC<BannerAdProps> = ({ className = '' }) => {
  const adContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!adContainerRef.current) return;

    // Clear any existing content
    adContainerRef.current.innerHTML = '';

    // Create options script
    const optionsScript = document.createElement('script');
    optionsScript.innerHTML = `
      atOptions = {
        'key' : '24887eba6a7c2444602020b1915f8a43',
        'format' : 'iframe',
        'height' : 60,
        'width' : 468,
        'params' : {}
      };
    `;
    adContainerRef.current.appendChild(optionsScript);

    // Create invoke script
    const invokeScript = document.createElement('script');
    invokeScript.src = 'https://foreseehawancestor.com/24887eba6a7c2444602020b1915f8a43/invoke.js';
    adContainerRef.current.appendChild(invokeScript);

    return () => {
      if (adContainerRef.current) {
        adContainerRef.current.innerHTML = '';
      }
    };
  }, []);

  return (
    <div className={`w-full flex justify-center py-2 ${className}`}>
      <div 
        ref={adContainerRef}
        className="max-w-full overflow-hidden flex justify-center items-center min-h-[60px]"
        style={{ maxWidth: '468px', width: '100%' }}
      />
    </div>
  );
};

export default BannerAd;
