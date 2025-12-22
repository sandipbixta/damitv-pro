import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { initVideoAnalytics, trackPageView } from '@/utils/videoAnalytics';

// Google Analytics 4 Measurement ID
const GA_MEASUREMENT_ID = 'G-012D2PN0S2';

/**
 * Google Analytics 4 integration component
 * Tracks page views and user interactions
 */
const GoogleAnalytics = () => {
  const location = useLocation();

  // Initialize video analytics on mount
  useEffect(() => {
    initVideoAnalytics();
  }, []);

  useEffect(() => {
    // Track page view on route change
    if (window.gtag) {
      const pageTitle = document.title || 'DamiTV';
      const pagePath = location.pathname + location.search;
      
      // Determine stream ID for live pages
      let streamId: string | undefined;
      if (location.pathname.includes('/live') || location.pathname.includes('/match')) {
        streamId = location.pathname.split('/').pop();
      }
      
      // Track with custom page view function
      trackPageView(pageTitle, pagePath, streamId);
      
      // Also send standard GA4 config
      window.gtag('config', GA_MEASUREMENT_ID, {
        page_path: pagePath,
        page_title: pageTitle,
      });
    }
  }, [location]);

  // Load GA script dynamically after page load
  useEffect(() => {
    // Check if GA is already loaded
    if (window.gtag) return;

    const loadGA = () => {
      const script = document.createElement('script');
      script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);

      script.onload = () => {
        window.dataLayer = window.dataLayer || [];
        window.gtag = function gtag() {
          window.dataLayer.push(arguments);
        };
        window.gtag('js', new Date());
        window.gtag('config', GA_MEASUREMENT_ID, {
          send_page_view: true,
          anonymize_ip: true,
          cookie_flags: 'SameSite=None;Secure',
          custom_map: {
            'dimension1': 'stream_id',
            'dimension2': 'match_title',
            'dimension3': 'quality_level'
          }
        });
      };
    };

    // Delay GA loading to prioritize critical content
    if (document.readyState === 'complete') {
      setTimeout(loadGA, 1000);
    } else {
      window.addEventListener('load', () => setTimeout(loadGA, 1000));
    }
  }, []);

  return null;
};

// Helper function to track custom events
export const trackEvent = (eventName: string, eventParams?: Record<string, any>) => {
  if (window.gtag) {
    window.gtag('event', eventName, eventParams);
  }
};

// Helper function to track conversions
export const trackConversion = (conversionName: string, value?: number) => {
  if (window.gtag) {
    window.gtag('event', 'conversion', {
      send_to: `${GA_MEASUREMENT_ID}/${conversionName}`,
      value: value,
    });
  }
};

// Extend Window interface for TypeScript
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

export default GoogleAnalytics;
