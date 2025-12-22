import React, { useEffect, useRef, useState } from 'react';
import { 
  adConfig, 
  isAdCooldownPassed, 
  markAdTriggered,
  wasAdShownThisSession,
  markAdShownThisSession
} from '@/utils/adConfig';

/**
 * Adsterra 160x600 Wide Skyscraper Banner
 * - Desktop only (lg breakpoint and above)
 * - STRICT 6-hour frequency cap to maintain CPM
 * - Only loads ONCE per 6-hour window
 */
const AdsterraSidebar: React.FC = () => {
  const adContainerRef = useRef<HTMLDivElement>(null);
  const hasLoadedRef = useRef(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    // Prevent multiple loads
    if (hasLoadedRef.current) {
      return;
    }

    // Only load on desktop
    const isDesktop = window.innerWidth >= 1024;
    if (!isDesktop) {
      return;
    }

    // Check session-level flag (prevents SPA navigation re-triggers)
    if (wasAdShownThisSession(adConfig.sidebar.sessionKey)) {
      console.log('⏳ Sidebar ad already shown this session');
      return;
    }

    // STRICT cooldown check - 6 hours between impressions
    if (!isAdCooldownPassed(adConfig.sidebar.sessionKey, adConfig.sidebar.cooldownMinutes)) {
      return;
    }

    // Mark as triggered IMMEDIATELY
    hasLoadedRef.current = true;
    markAdTriggered(adConfig.sidebar.sessionKey);
    markAdShownThisSession(adConfig.sidebar.sessionKey);
    setShouldRender(true);
    console.log('🎯 Sidebar ad loading (once per 6 hours)');

  }, []);

  useEffect(() => {
    if (!shouldRender || !adContainerRef.current) {
      return;
    }

    // Set atOptions globally for Adsterra
    (window as any).atOptions = {
      'key': 'f6b9ed5242d1d0b7ebdc00c5ebba1752',
      'format': 'iframe',
      'height': 600,
      'width': 160,
      'params': {}
    };

    // Load Adsterra script
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = '//foreseehawancestor.com/f6b9ed5242d1d0b7ebdc00c5ebba1752/invoke.js';
    script.async = true;
    
    adContainerRef.current.appendChild(script);
    console.log('✅ Sidebar ad script loaded');

    return () => {
      if (adContainerRef.current) {
        adContainerRef.current.innerHTML = '';
      }
      delete (window as any).atOptions;
    };
  }, [shouldRender]);

  // Don't render anything if ad shouldn't show
  if (!shouldRender) {
    return null;
  }

  return (
    <div 
      className="hidden lg:block lg:w-[160px] lg:min-w-[160px] lg:flex-shrink-0"
    >
      <div 
        ref={adContainerRef}
        className="bg-sports-card/50 border border-border rounded-lg overflow-hidden sticky top-4"
        style={{ 
          width: '160px',
          height: '600px'
        }}
      />
    </div>
  );
};

export default AdsterraSidebar;
