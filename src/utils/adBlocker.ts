/**
 * Ad-blocking utility for iframe video players
 * Works for same-origin iframes only due to CORS restrictions
 */

// Common ad element selectors to remove
const AD_SELECTORS = [
  // Common ad iframes
  'iframe[src*="doubleclick"]',
  'iframe[src*="googleads"]',
  'iframe[src*="googlesyndication"]',
  'iframe[src*="adservice"]',
  'iframe[src*="advertising"]',
  'iframe[src*="adserver"]',
  'iframe[src*="adform"]',
  'iframe[src*="taboola"]',
  'iframe[src*="outbrain"]',
  
  // Common ad containers
  'div[class*="ad-"]',
  'div[class*="ads-"]',
  'div[class*="advert"]',
  'div[id*="ad-"]',
  'div[id*="ads-"]',
  'div[id*="advert"]',
  '.advertisement',
  '.ads',
  '#ads',
  '.ad-container',
  '.ad-wrapper',
  '.ad-banner',
  '.ad-overlay',
  
  // Popup elements
  '.popup',
  '.popup-overlay',
  '.modal-ad',
  '.interstitial',
  '[class*="popup"]',
  '[id*="popup"]',
  
  // Overlay ads
  '.overlay-ad',
  '.video-ad',
  '.pre-roll',
  '.mid-roll',
  
  // Common tracking/ad scripts containers
  '[data-ad]',
  '[data-ads]',
  '[data-advertisement]',
];

// Ad script URLs to block
const AD_SCRIPT_PATTERNS = [
  'doubleclick.net',
  'googleads.g.doubleclick.net',
  'googlesyndication.com',
  'googleadservices.com',
  'adservice.google.com',
  'pagead2.googlesyndication.com',
  'adform.net',
  'taboola.com',
  'outbrain.com',
  'popads.net',
  'propellerads.com',
];

/**
 * Attempts to remove ad elements from an iframe's content
 * Only works for same-origin iframes due to CORS
 */
export const removeAdsFromIframe = (iframe: HTMLIFrameElement): boolean => {
  try {
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) {
      console.log('⚠️ Cannot access iframe content (cross-origin)');
      return false;
    }

    let removedCount = 0;

    // Remove ad elements
    AD_SELECTORS.forEach(selector => {
      try {
        const elements = iframeDoc.querySelectorAll(selector);
        elements.forEach(el => {
          el.remove();
          removedCount++;
        });
      } catch (e) {
        // Ignore selector errors
      }
    });

    // Block ad scripts
    const scripts = iframeDoc.querySelectorAll('script');
    scripts.forEach(script => {
      const src = script.src?.toLowerCase() || '';
      if (AD_SCRIPT_PATTERNS.some(pattern => src.includes(pattern))) {
        script.remove();
        removedCount++;
      }
    });

    // Remove inline scripts that contain ad-related code
    const inlineScripts = iframeDoc.querySelectorAll('script:not([src])');
    inlineScripts.forEach(script => {
      const content = script.textContent?.toLowerCase() || '';
      if (content.includes('googletag') || 
          content.includes('adsbygoogle') || 
          content.includes('doubleclick') ||
          content.includes('popunder') ||
          content.includes('popup')) {
        script.remove();
        removedCount++;
      }
    });

    if (removedCount > 0) {
      console.log(`🛡️ Ad blocker removed ${removedCount} ad elements`);
    }

    return true;
  } catch (error) {
    // Cross-origin access denied - this is expected for most streaming embeds
    console.log('🔒 Cross-origin iframe - CSS ad blocking only');
    return false;
  }
};

/**
 * Sets up delayed ad blocking that runs after iframe load
 * Runs at 1s and 3s to catch delayed ad injections
 */
export const setupDelayedAdBlocking = (
  iframe: HTMLIFrameElement,
  onComplete?: () => void
): (() => void) => {
  const timeouts: NodeJS.Timeout[] = [];

  // First pass at 1 second
  timeouts.push(setTimeout(() => {
    removeAdsFromIframe(iframe);
  }, 1000));

  // Second pass at 3 seconds to catch delayed ads
  timeouts.push(setTimeout(() => {
    removeAdsFromIframe(iframe);
    onComplete?.();
  }, 3000));

  // Cleanup function
  return () => {
    timeouts.forEach(t => clearTimeout(t));
  };
};

/**
 * Injects CSS ad-blocking styles into iframe (same-origin only)
 */
export const injectAdBlockStyles = (iframe: HTMLIFrameElement): boolean => {
  try {
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) return false;

    const style = iframeDoc.createElement('style');
    style.id = 'damitv-ad-blocker';
    style.textContent = `
      /* Hide common ad containers */
      ${AD_SELECTORS.join(',\n      ')} {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
        height: 0 !important;
        width: 0 !important;
        overflow: hidden !important;
      }
      
      /* Block popup overlays */
      div[style*="position: fixed"],
      div[style*="position:fixed"] {
        z-index: -1 !important;
      }
    `;

    // Only inject if not already present
    if (!iframeDoc.getElementById('damitv-ad-blocker')) {
      iframeDoc.head?.appendChild(style);
      console.log('💉 Injected ad-blocking CSS into iframe');
      return true;
    }

    return false;
  } catch (error) {
    return false;
  }
};
