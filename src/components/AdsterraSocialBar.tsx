import { useEffect, useRef } from 'react';

/**
 * Adsterra Social Bar Ad
 * Floating social bar widget that appears globally on all pages
 */
const AdsterraSocialBar: React.FC = () => {
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    // Prevent double loading
    if (scriptLoadedRef.current) return;

    // Don't load in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Adsterra Social Bar: Skipped in development');
      return;
    }

    // Check if script already exists
    const existingScript = document.querySelector('script[src*="2d109cea62316aeb5d20389246c3d8a9"]');
    if (existingScript) {
      console.log('Adsterra Social Bar: Script already loaded');
      scriptLoadedRef.current = true;
      return;
    }

    // Load the Social Bar script
    const script = document.createElement('script');
    script.src = 'https://foreseehawancestor.com/2d/10/9c/2d109cea62316aeb5d20389246c3d8a9.js';
    script.async = true;

    script.onload = () => {
      console.log('Adsterra Social Bar: Loaded successfully');
    };

    script.onerror = () => {
      console.warn('Adsterra Social Bar: Failed to load');
    };

    document.body.appendChild(script);
    scriptLoadedRef.current = true;

    return () => {
      // Don't remove on unmount as Social Bar should persist
    };
  }, []);

  // This component doesn't render anything visible - the ad script handles the UI
  return null;
};

export default AdsterraSocialBar;
