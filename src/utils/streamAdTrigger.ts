import { adConfig, isAdCooldownPassed, markAdTriggered, isGlobalThrottlePassed, markGlobalThrottle } from './adConfig';
import { adTracking } from './adTracking';

/**
 * Triggers smartlink ad when changing streams
 * Uses per-match tracking + global throttle for optimal monetization
 * 
 * @param matchId - Unique identifier for the match (required for per-match tracking)
 */
export const triggerStreamChangeAd = (matchId: string): void => {
  // Check if direct link ads are enabled
  if (!adConfig.directLinkEnabled) {
    console.log('⏸️ Direct link ads disabled');
    return;
  }

  // Validate matchId
  if (!matchId) {
    console.warn('⚠️ No matchId provided for stream change ad');
    return;
  }

  // Build per-match session key
  const perMatchKey = `${adConfig.directLink.sessionKeyPrefix}:${matchId}`;
  const cooldownMinutes = adConfig.directLink.perMatchCooldownMinutes;

  // Check per-match cooldown first
  if (!isAdCooldownPassed(perMatchKey, cooldownMinutes)) {
    console.log(`⏳ Stream change ad cooldown active for match: ${matchId}`);
    return;
  }

  // Check global throttle (2 minute minimum between any ads)
  if (!isGlobalThrottlePassed()) {
    console.log('⏳ Global ad throttle active (2 min between ads)');
    return;
  }

  // Try to open the smartlink ad
  const adWindow = window.open(adConfig.directLink.url, "_blank", "noopener noreferrer");
  
  // Only mark as triggered if the window opened successfully
  if (adWindow && !adWindow.closed) {
    // Mark both per-match AND global throttle
    markAdTriggered(perMatchKey);
    markGlobalThrottle();
    adTracking.trackStreamChangeAd();
    console.log(`🎯 Stream change ad triggered for match: ${matchId}`);
  } else {
    console.log('❌ Stream change ad blocked by popup blocker');
  }
};
