import { adConfig, isAdCooldownPassed, markAdTriggered, isGlobalThrottlePassed, markGlobalThrottle } from '@/utils/adConfig';

/**
 * Trigger direct link ad when user clicks play button on stream
 * Uses per-match tracking + global throttle for optimal monetization
 * 
 * @param matchId - Unique identifier for the match (required for per-match tracking)
 */
export const triggerStreamPlayAd = (matchId: string): boolean => {
  // Check if stream play ads are enabled
  if (!adConfig.streamPlayAdEnabled || !adConfig.directLinkEnabled) {
    console.log('🚫 Stream play ads disabled');
    return false;
  }

  // Validate matchId
  if (!matchId) {
    console.warn('⚠️ No matchId provided for stream play ad');
    return false;
  }

  // Build per-match session key
  const perMatchKey = `${adConfig.streamPlayAd.sessionKeyPrefix}:${matchId}`;
  const cooldownMinutes = adConfig.streamPlayAd.perMatchCooldownMinutes;

  // Check per-match cooldown first
  if (!isAdCooldownPassed(perMatchKey, cooldownMinutes)) {
    console.log(`⏳ Stream play ad cooldown active for match: ${matchId}`);
    return false;
  }

  // Check global throttle (2 minute minimum between any ads)
  if (!isGlobalThrottlePassed()) {
    console.log('⏳ Global ad throttle active (2 min between ads)');
    return false;
  }

  try {
    console.log(`🎬 Triggering stream play ad for match: ${matchId}`);
    
    // Open direct link in new tab
    const adWindow = window.open(adConfig.directLink.url, '_blank');
    
    if (adWindow) {
      console.log(`✅ Stream play ad opened for match: ${matchId}`);
      // Mark both per-match AND global throttle
      markAdTriggered(perMatchKey);
      markGlobalThrottle();
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
