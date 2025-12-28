import { useCallback, useRef } from 'react';
import { adConfig, isAdCooldownPassed, markAdTriggered } from '@/utils/adConfig';

/**
 * Hook to trigger ad only when user clicks play button on stream
 * This ensures ads only show when user explicitly wants to watch content
 */
export const useStreamPlayAd = () => {
  const adTriggeredRef = useRef(false);

  const triggerStreamPlayAd = useCallback(() => {
    // Check if stream play ads are enabled
    if (!adConfig.streamPlayAdEnabled || !adConfig.popunderEnabled) {
      console.log('🚫 Stream play ads disabled');
      return false;
    }

    // Check cooldown
    const { sessionKey, cooldownMinutes } = adConfig.streamPlayAd;
    if (!isAdCooldownPassed(sessionKey, cooldownMinutes)) {
      console.log('⏳ Stream play ad cooldown active');
      return false;
    }

    // Prevent double-triggering in same session
    if (adTriggeredRef.current) {
      console.log('🔄 Stream play ad already triggered this session');
      return false;
    }

    try {
      console.log('🎬 Triggering stream play ad...');
      
      // Dynamically inject the popunder script
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = adConfig.streamPlayAd.scriptSrc;
      script.async = true;
      
      script.onload = () => {
        console.log('✅ Stream play ad script loaded');
        markAdTriggered(sessionKey);
        adTriggeredRef.current = true;
      };
      
      script.onerror = () => {
        console.warn('⚠️ Stream play ad script failed to load');
      };
      
      document.body.appendChild(script);
      
      return true;
    } catch (error) {
      console.error('❌ Error triggering stream play ad:', error);
      return false;
    }
  }, []);

  const resetAdTrigger = useCallback(() => {
    adTriggeredRef.current = false;
  }, []);

  return {
    triggerStreamPlayAd,
    resetAdTrigger
  };
};

/**
 * Standalone function to trigger stream play ad (for use outside of React components)
 */
export const triggerStreamPlayAd = (): boolean => {
  // Check if stream play ads are enabled
  if (!adConfig.streamPlayAdEnabled || !adConfig.popunderEnabled) {
    console.log('🚫 Stream play ads disabled');
    return false;
  }

  // Check cooldown
  const { sessionKey, cooldownMinutes } = adConfig.streamPlayAd;
  if (!isAdCooldownPassed(sessionKey, cooldownMinutes)) {
    console.log('⏳ Stream play ad cooldown active');
    return false;
  }

  try {
    console.log('🎬 Triggering stream play ad...');
    
    // Dynamically inject the popunder script
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = adConfig.streamPlayAd.scriptSrc;
    script.async = true;
    
    script.onload = () => {
      console.log('✅ Stream play ad script loaded');
      markAdTriggered(sessionKey);
    };
    
    script.onerror = () => {
      console.warn('⚠️ Stream play ad script failed to load');
    };
    
    document.body.appendChild(script);
    
    return true;
  } catch (error) {
    console.error('❌ Error triggering stream play ad:', error);
    return false;
  }
};
