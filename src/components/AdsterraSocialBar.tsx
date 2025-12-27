import { useEffect } from 'react';

/**
 * Adsterra Social Bar Ad
 * Loads once per session, appears as floating bar
 */
const AdsterraSocialBar: React.FC = () => {
  useEffect(() => {
    // Check if script already loaded (check for any social bar script)
    const existingScript = document.querySelector(
      'script[src*="2d109cea62316aeb5d20389246c3d8a9"]'
    );
    
    if (existingScript) {
      console.log('✅ Social bar script already loaded');
      return;
    }

    console.log('🎯 Loading social bar ad script...');
    
    const script = document.createElement('script');
    script.type = 'text/javascript';
    // Use the working domain from index.html
    script.src = '//temperweekly.com/2d/10/9c/2d109cea62316aeb5d20389246c3d8a9.js';
    script.async = true;
    
    script.onload = () => {
      console.log('✅ Social bar script loaded successfully');
    };
    
    script.onerror = () => {
      console.warn('❌ Social bar script failed to load');
    };
    
    document.body.appendChild(script);

    return () => {
      // Don't remove on unmount as social bar should persist
    };
  }, []);

  return null;
};

export default AdsterraSocialBar;
