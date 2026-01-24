
import React, { useEffect, useRef } from 'react';

// TypeScript declaration for aclib global
declare global {
  interface Window {
    aclib?: {
      runAutoTag: (options: { zoneId: string }) => void;
    };
  }
}

interface AdvertisementProps {
  type: 'sidebar' | 'video' | 'direct-link' | 'autotag';
  className?: string;
}

const Advertisement: React.FC<AdvertisementProps> = ({ type, className = '' }) => {
  const adRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!adRef.current || process.env.NODE_ENV === 'development') return;
    
    // Clean previous content
    adRef.current.innerHTML = '';
    
    if (type === 'sidebar') {
      // Sidebar ad - new social bar ad script
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = '//monkeyhundredsarmed.com/2d/10/9c/2d109cea62316aeb5d20389246c3d8a9.js';
      script.async = true;
      
      // Add error handling
      script.onerror = () => {
        console.log('Sidebar ad script failed to load');
      };
      
      script.onload = () => {
        console.log('Sidebar ad script loaded successfully');
      };
      
      adRef.current.appendChild(script);
      
    } else if (type === 'video') {
      // Video ad - use banner ad format (NOT popunder which auto-triggers)
      // The popunder script should ONLY be triggered via triggerPopunderAd on user click
      (window as any).atOptions = {
        'key': '24887eba6a7c2444602020b1915f8a43',
        'format': 'iframe',
        'height': 250,
        'width': 300,
        'params': {}
      };

      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = 'https://foreseehawancestor.com/24887eba6a7c2444602020b1915f8a43/invoke.js';
      script.async = true;

      // Add error handling
      script.onerror = () => {
        console.log('Video ad script failed to load');
      };

      script.onload = () => {
        console.log('Video ad script loaded successfully');
      };

      adRef.current.appendChild(script);
      
    } else if (type === 'direct-link') {
      // Direct link ad - mobile optimized
      const link = document.createElement('a');
      link.href = 'https://monkeyhundredsarmed.com/zbt0wegpe?key=39548340a9430381e48a2856c8cf8d37';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.className = 'block w-full h-16 sm:h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-semibold hover:from-blue-600 hover:to-purple-700 transition-all text-sm sm:text-base';
      link.innerHTML = '🎯 Exclusive Offers - Click Here!';
      
      adRef.current.appendChild(link);
      
    } else if (type === 'autotag') {
      // AutoTag ad - adblock bypass integration
      // First load the local aclib library if not already loaded
      if (!window.aclib) {
        const aclibScript = document.createElement('script');
        aclibScript.type = 'text/javascript';
        aclibScript.src = '/js/aclib.js'; // Local adblock bypass library
        aclibScript.async = true;
        
        aclibScript.onload = () => {
          // Run AutoTag after aclib is loaded
          if (window.aclib && window.aclib.runAutoTag) {
            window.aclib.runAutoTag({
              zoneId: 'bz3drbnei2', // Updated zone ID for adblock bypass
            });
          }
        };
        
        aclibScript.onerror = () => {
          console.log('AutoTag aclib script failed to load - ensure adblock bypass script is installed');
        };
        
        document.head.appendChild(aclibScript);
      } else {
        // aclib already loaded, run AutoTag directly
        window.aclib.runAutoTag({
          zoneId: 'bz3drbnei2', // Updated zone ID for adblock bypass
        });
      }
    }
    
    return () => {
      // Clean up when component unmounts
      if (adRef.current) {
        adRef.current.innerHTML = '';
      }
    };
  }, [type]);
  
  // Don't show ads in development
  if (process.env.NODE_ENV === 'development') {
    return (
      <div className={`bg-gray-200 dark:bg-gray-800 rounded-lg p-4 text-center ${className}`}>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Advertisement Placeholder ({type}) - {type === 'video' ? 'Video Ad' : type === 'sidebar' ? 'Sidebar Ad' : type === 'autotag' ? 'AutoTag Ad' : 'Ad'}
        </p>
      </div>
    );
  }
  
  return (
    <div 
      ref={adRef} 
      className={`ad-container flex justify-center items-center overflow-hidden min-h-[90px] w-full ${className}`} 
      data-ad-type={type}
      style={{ 
        minHeight: type === 'video' ? '250px' : type === 'sidebar' ? '200px' : type === 'autotag' ? '100px' : 'auto',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    />
  );
};

export default Advertisement;
