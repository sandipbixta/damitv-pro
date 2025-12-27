import { useEffect } from 'react';

/**
 * Adsterra Social Bar Ad
 * Loads once per session, appears as floating bar
 */
const AdsterraSocialBar: React.FC = () => {
  useEffect(() => {
    // Check if script already loaded
    const existingScript = document.querySelector(
      'script[src*="2d109cea62316aeb5d20389246c3d8a9"]'
    );
    
    if (existingScript) {
      return;
    }

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = '//foreseehawancestor.com/2d/10/9c/2d109cea62316aeb5d20389246c3d8a9.js';
    script.async = true;
    
    document.head.appendChild(script);

    return () => {
      // Don't remove on unmount as social bar should persist
    };
  }, []);

  return null;
};

export default AdsterraSocialBar;
