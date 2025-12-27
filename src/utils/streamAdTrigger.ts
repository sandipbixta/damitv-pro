import { adConfig, isAdCooldownPassed, markAdTriggered } from './adConfig';
import { adTracking } from './adTracking';

/**
 * Triggers smartlink ad when changing streams
 * Respects cooldown period to prevent spam
 */
export const triggerStreamChangeAd = (): void => {
  // Check if directLink ads are enabled
  if (!adConfig.directLink.enabled) {
    console.log('🚫 Stream change ad disabled');
    return;
  }

  // Check if cooldown period has passed
  if (!isAdCooldownPassed(adConfig.directLink.sessionKey, adConfig.directLink.cooldownMinutes)) {
    console.log('⏳ Stream change ad on cooldown');
    return;
  }

  // Try to open the smartlink ad
  const adWindow = window.open(adConfig.directLink.url, "_blank", "noopener noreferrer");
  
  // Only mark as triggered if the window opened successfully
  if (adWindow && !adWindow.closed) {
    markAdTriggered(adConfig.directLink.sessionKey);
    adTracking.trackStreamChangeAd();
    console.log('🎯 Stream change ad triggered!');
  } else {
    console.log('❌ Stream change ad blocked by popup blocker');
  }
};
