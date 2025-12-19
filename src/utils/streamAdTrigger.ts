import { adConfig, isAdCooldownPassed, markAdTriggered } from './adConfig';

/**
 * Triggers smartlink ad when changing streams
 * Uses direct navigation instead of popup to avoid blockers
 */
export const triggerStreamChangeAd = (): void => {
  // Check if cooldown period has passed
  if (!isAdCooldownPassed(adConfig.directLink.sessionKey, adConfig.directLink.cooldownMinutes)) {
    console.log('⏳ Stream change ad on cooldown');
    return;
  }

  // Mark as triggered first to prevent multiple triggers
  markAdTriggered(adConfig.directLink.sessionKey);
  
  // Create a temporary anchor element and click it (bypasses popup blockers)
  const link = document.createElement('a');
  link.href = adConfig.directLink.url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  console.log('🎯 Stream change ad triggered via anchor click!');
};
