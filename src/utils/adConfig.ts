
// Ad configuration utility
export const adConfig = {
  directLink: {
    enabled: false, // TEMPORARILY DISABLED
    url: 'https://foreseehawancestor.com/umr66h0d?key=580a7a980918e6f2337c20ccf5d82054',
    cooldownMinutes: 360, // 6 hours
    sessionKey: 'directLinkAdTriggered'
  },
  popunder: {
    enabled: false, // TEMPORARILY DISABLED
    scriptSrc: '//foreseehawancestor.com/ae/f7/eb/aef7eba12c46ca91518228f813db6ce5.js',
    cooldownMinutes: 360, // 6 hours
    sessionKey: 'popunderAdTriggered_v2', // Updated key to reset stale entries
    delaySeconds: 3
  },
};

// Helper to determine if ads should be shown
export const shouldShowAds = () => {
  return true;
};

// Helper to check if ad cooldown has passed - STRICT enforcement
export const isAdCooldownPassed = (sessionKey: string, cooldownMinutes: number): boolean => {
  try {
    const lastTriggered = localStorage.getItem(sessionKey);
    
    // If never triggered, allow
    if (!lastTriggered) {
      return true;
    }
    
    const lastTime = parseInt(lastTriggered, 10);
    
    // Validate the stored value is a valid timestamp
    if (isNaN(lastTime) || lastTime <= 0) {
      // Invalid data, clear it and allow
      localStorage.removeItem(sessionKey);
      return true;
    }
    
    const now = Date.now();
    const cooldownMs = cooldownMinutes * 60 * 1000;
    const timePassed = now - lastTime;
    
    // STRICT: Only allow if full cooldown has passed
    const passed = timePassed >= cooldownMs;
    
    if (!passed) {
      const remainingMinutes = Math.ceil((cooldownMs - timePassed) / 60000);
      console.log(`⏳ Ad cooldown: ${remainingMinutes} minutes remaining for ${sessionKey}`);
    }
    
    return passed;
  } catch (error) {
    // If localStorage fails, default to NOT showing ad (safer for CPM)
    console.warn('localStorage error in cooldown check:', error);
    return false;
  }
};

// Helper to mark ad as triggered with validation
export const markAdTriggered = (sessionKey: string): void => {
  try {
    const timestamp = Date.now().toString();
    localStorage.setItem(sessionKey, timestamp);
    console.log(`✅ Ad marked as triggered: ${sessionKey} at ${new Date().toISOString()}`);
  } catch (error) {
    console.warn('Failed to mark ad as triggered:', error);
  }
};

// Check if ad was already shown in this session (prevents multiple loads on SPA navigation)
export const wasAdShownThisSession = (sessionKey: string): boolean => {
  try {
    return sessionStorage.getItem(`${sessionKey}_session`) === 'true';
  } catch {
    return false;
  }
};

// Mark ad as shown for this session
export const markAdShownThisSession = (sessionKey: string): void => {
  try {
    sessionStorage.setItem(`${sessionKey}_session`, 'true');
  } catch {
    // Ignore
  }
};
