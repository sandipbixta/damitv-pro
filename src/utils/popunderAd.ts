/**
 * Popunder ad trigger utility
 * Loads the popunder script when triggered, with per-match cooldown
 */

const POPUNDER_SCRIPT_URL = 'https://foreseehawancestor.com/ae/f7/eb/aef7eba12c46ca91518228f813db6ce5.js';
const COOLDOWN_MS = 6 * 60 * 60 * 1000; // 6 hours

/**
 * Triggers a popunder ad with per-match cooldown
 * @param matchId - Unique identifier for the match
 * @param source - Optional source identifier for tracking (e.g., 'play_button', 'source_change')
 */
export const triggerPopunderAd = (matchId: string, source: string = 'unknown'): void => {
  if (!matchId) {
    console.warn('⚠️ No matchId provided for popunder ad');
    return;
  }

  const adSessionKey = `popunderAdTriggered:${matchId}`;
  const lastTriggered = localStorage.getItem(adSessionKey);
  
  const shouldShowAd = !lastTriggered || (Date.now() - parseInt(lastTriggered, 10)) >= COOLDOWN_MS;
  
  if (shouldShowAd) {
    try {
      // Load popunder script
      const script = document.createElement('script');
      script.src = POPUNDER_SCRIPT_URL;
      script.async = true;
      document.body.appendChild(script);
      
      // Mark ad as triggered
      localStorage.setItem(adSessionKey, Date.now().toString());
      console.log(`🎯 Popunder ad triggered for match: ${matchId} (source: ${source})`);
    } catch (error) {
      console.warn('Failed to load popunder ad:', error);
    }
  } else {
    const remainingMs = COOLDOWN_MS - (Date.now() - parseInt(lastTriggered!, 10));
    const remainingMinutes = Math.ceil(remainingMs / 60000);
    console.log(`⏳ Popunder ad on cooldown for match: ${matchId} (${remainingMinutes} min remaining)`);
  }
};
