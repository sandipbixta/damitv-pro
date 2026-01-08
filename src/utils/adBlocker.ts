// Ad blocking utilities for iframe streams

/**
 * Attempts to remove ad elements from an iframe
 * Note: This only works if the iframe is same-origin (which it usually isn't for external streams)
 */
export const removeAdsFromIframe = (iframe: HTMLIFrameElement): void => {
  try {
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) {
      console.log('🛡️ Cannot access iframe document (cross-origin)');
      return;
    }

    // Common ad selectors to remove
    const adSelectors = [
      '[class*="ad-"]',
      '[class*="ads-"]',
      '[class*="advertisement"]',
      '[id*="ad-"]',
      '[id*="ads-"]',
      '[class*="popup"]',
      '[class*="overlay"]',
      '[class*="banner"]',
      'iframe[src*="ads"]',
      'iframe[src*="click"]',
      'div[onclick]',
      'a[target="_blank"]',
    ];

    adSelectors.forEach(selector => {
      try {
        const elements = iframeDoc.querySelectorAll(selector);
        elements.forEach(el => {
          if (el.parentNode) {
            el.parentNode.removeChild(el);
            console.log('🛡️ Removed ad element:', selector);
          }
        });
      } catch (e) {
        // Ignore selector errors
      }
    });
  } catch (error) {
    console.log('🛡️ Ad removal blocked by cross-origin policy');
  }
};

/**
 * Injects CSS styles to hide common ad elements
 */
export const injectAdBlockStyles = (iframe: HTMLIFrameElement): void => {
  try {
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) return;

    const style = iframeDoc.createElement('style');
    style.textContent = `
      [class*="ad-"], [class*="ads-"], [class*="advertisement"],
      [id*="ad-"], [id*="ads-"], [class*="popup"], [class*="overlay"],
      [class*="banner"], div[onclick], a[target="_blank"] {
        display: none !important;
        visibility: hidden !important;
        pointer-events: none !important;
      }
    `;
    iframeDoc.head?.appendChild(style);
    console.log('🛡️ Ad block styles injected');
  } catch (error) {
    console.log('🛡️ Style injection blocked by cross-origin policy');
  }
};

/**
 * Sets up delayed ad blocking that runs periodically
 */
export const setupDelayedAdBlocking = (
  iframe: HTMLIFrameElement,
  onReady?: () => void
): (() => void) => {
  let attempts = 0;
  const maxAttempts = 5;
  
  const interval = setInterval(() => {
    attempts++;
    removeAdsFromIframe(iframe);
    
    if (attempts >= maxAttempts) {
      clearInterval(interval);
      onReady?.();
    }
  }, 1000);

  return () => clearInterval(interval);
};

/**
 * Blocks window.open calls (for popunder prevention)
 * Note: This is applied to the main window, not the iframe
 */
export const blockPopups = (): void => {
  const originalOpen = window.open;
  
  window.open = function(...args) {
    console.log('🛡️ Blocked popup attempt:', args[0]);
    return null;
  };

  // Also block common popup triggers
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    
    // Block clicks that open new windows
    if (target.tagName === 'A' && target.getAttribute('target') === '_blank') {
      const href = target.getAttribute('href') || '';
      // Allow legitimate links, block ad-like URLs
      if (href.includes('ads') || href.includes('click') || href.includes('track')) {
        e.preventDefault();
        e.stopPropagation();
        console.log('🛡️ Blocked ad link click');
      }
    }
  }, true);
};

/**
 * Main ad blocker initialization
 */
export const initAdBlocker = (): void => {
  console.log('🛡️ DAMITV Ad Blocker initialized');
  blockPopups();
};
