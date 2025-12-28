import { adConfig, isAdCooldownPassed, markAdTriggered } from '@/utils/adConfig';

/**
 * Trigger direct link ad when user clicks play button on stream
 * This opens a new tab with the ad URL - more reliable than popunder
 */
export const triggerStreamPlayAd = (): boolean => {
  // Check if stream play ads are enabled
  if (!adConfig.streamPlayAdEnabled || !adConfig.directLinkEnabled) {
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
    console.log('🎬 Triggering stream play ad (direct link)...');
    
    // Open direct link in new tab
    const adWindow = window.open(adConfig.directLink.url, '_blank');
    
    if (adWindow) {
      console.log('✅ Stream play ad opened successfully');
      markAdTriggered(sessionKey);
      return true;
    } else {
      console.warn('⚠️ Popup was blocked - ad not shown');
      return false;
    }
  } catch (error) {
    console.error('❌ Error triggering stream play ad:', error);
    return false;
  }
};
