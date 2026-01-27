import { useEffect, useRef } from 'react';

/**
 * Adsterra Popunder Ad
 * High CPM ad that opens in a new tab on user interaction
 * Triggers once per session to avoid annoying users
 */
const PopunderAd: React.FC = () => {
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    // Prevent double loading
    if (scriptLoadedRef.current) return;

    // Check if already loaded in this session
    const alreadyLoaded = sessionStorage.getItem('popunder_loaded');
    if (alreadyLoaded) {
      console.log('Popunder: Already loaded this session');
      return;
    }

    // Check if script already exists
    const existingScript = document.querySelector('script[src*="aef7eba12c46ca91518228f813db6ce5"]');
    if (existingScript) {
      console.log('Popunder: Script already exists');
      scriptLoadedRef.current = true;
      return;
    }

    // Load the Popunder script
    const script = document.createElement('script');
    script.src = 'https://foreseehawancestor.com/ae/f7/eb/aef7eba12c46ca91518228f813db6ce5.js';
    script.async = true;

    script.onload = () => {
      console.log('Popunder: Loaded successfully');
      sessionStorage.setItem('popunder_loaded', 'true');
    };

    script.onerror = () => {
      console.warn('Popunder: Failed to load');
    };

    document.body.appendChild(script);
    scriptLoadedRef.current = true;

    return () => {
      // Don't remove - popunder should persist
    };
  }, []);

  // This component doesn't render anything visible
  return null;
};

export default PopunderAd;
