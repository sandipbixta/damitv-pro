import React, { useEffect } from 'react';
import { analytics } from '@/utils/analytics';

interface MonetizationTrackerProps {
  children: React.ReactNode;
}

const MonetizationTracker: React.FC<MonetizationTrackerProps> = ({ children }) => {
  useEffect(() => {
    // Track session value and user quality metrics
    const trackUserValue = () => {
      const sessionStart = performance.timing.navigationStart;
      const currentTime = Date.now();
      const sessionDuration = currentTime - sessionStart;
      
      // Calculate user value score based on engagement
      let userValueScore = 0;
      
      // Time on site (max 50 points)
      if (sessionDuration > 30000) userValueScore += 10; // 30+ seconds
      if (sessionDuration > 60000) userValueScore += 15; // 1+ minute
      if (sessionDuration > 180000) userValueScore += 25; // 3+ minutes
      
      // Page interactions (max 30 points)
      const clickCount = parseInt(sessionStorage.getItem('click_count') || '0');
      userValueScore += Math.min(clickCount * 3, 30);
      
      // Scroll depth (max 20 points)
      const scrollDepth = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
      userValueScore += Math.min(scrollDepth / 5, 20);
      
      analytics.track({
        action: 'user_value_score',
        category: 'Monetization',
        label: 'user_quality',
        value: userValueScore,
        custom_parameters: {
          session_duration_seconds: Math.round(sessionDuration / 1000),
          click_count: clickCount,
          scroll_depth_percent: Math.round(scrollDepth),
          page_views_session: parseInt(sessionStorage.getItem('session_page_views') || '1')
        }
      });
      
      // Store user value for ad targeting
      sessionStorage.setItem('user_value_score', userValueScore.toString());
      
      // Update page view counter
      const currentPageViews = parseInt(sessionStorage.getItem('session_page_views') || '0');
      sessionStorage.setItem('session_page_views', (currentPageViews + 1).toString());
      
      // Update total metrics in localStorage
      const totalViews = parseInt(localStorage.getItem('total_page_views') || '0');
      localStorage.setItem('total_page_views', (totalViews + 1).toString());
    };

    // Track user value on page load and periodically
    trackUserValue();
    const valueTrackingInterval = setInterval(trackUserValue, 60000); // Every minute

    // Enhanced bounce rate tracking
    let bounceTimeout: NodeJS.Timeout;
    const preventBounce = () => {
      clearTimeout(bounceTimeout);
      analytics.track({
        action: 'bounce_prevented',
        category: 'User Engagement',
        label: 'quality_traffic'
      });
    };

    // Set bounce timer (10 seconds)
    bounceTimeout = setTimeout(() => {
      analytics.track({
        action: 'bounce_detected',
        category: 'User Engagement',
        label: 'quality_issue'
      });
    }, 10000);

    // Prevent bounce on user interaction
    const interactionEvents = ['click', 'scroll', 'keydown', 'mousemove'];
    interactionEvents.forEach(event => {
      document.addEventListener(event, preventBounce, { once: true });
    });

    // Track revenue opportunities
    const trackRevenueOpportunities = () => {
      const currentPath = window.location.pathname;
      let revenueValue = 1; // Base value
      
      // High-value pages get higher revenue potential
      if (currentPath.includes('/match/') || currentPath.includes('/live')) {
        revenueValue = 10;
      } else if (currentPath.includes('/channels')) {
        revenueValue = 5;
      } else if (currentPath.includes('/schedule')) {
        revenueValue = 3;
      }
      
      analytics.track({
        action: 'revenue_opportunity',
        category: 'Monetization',
        label: currentPath,
        value: revenueValue,
        custom_parameters: {
          page_type: currentPath.split('/')[1] || 'home',
          revenue_potential: revenueValue > 5 ? 'high' : revenueValue > 2 ? 'medium' : 'low'
        }
      });
    };

    trackRevenueOpportunities();

    // Track ad blocker detection
    const detectAdBlocker = () => {
      const adTest = document.createElement('div');
      adTest.innerHTML = '&nbsp;';
      adTest.className = 'adsbox';
      adTest.style.cssText = 'position: absolute; left: -10000px;';
      document.body.appendChild(adTest);
      
      setTimeout(() => {
        const isBlocked = adTest.offsetHeight === 0;
        document.body.removeChild(adTest);
        
        if (isBlocked) {
          analytics.track({
            action: 'adblock_detected',
            category: 'Monetization',
            label: 'revenue_impact',
            custom_parameters: {
              user_agent: navigator.userAgent.substring(0, 100),
              page_url: window.location.href
            }
          });
        }
      }, 100);
    };

    detectAdBlocker();

    // Cleanup
    return () => {
      clearInterval(valueTrackingInterval);
      clearTimeout(bounceTimeout);
      interactionEvents.forEach(event => {
        document.removeEventListener(event, preventBounce);
      });
    };
  }, []);

  // Track external link clicks for potential affiliate opportunities
  useEffect(() => {
    const trackExternalLinks = (event: MouseEvent) => {
      const target = event.target as HTMLAnchorElement;
      if (target.tagName === 'A' && target.href) {
        const url = new URL(target.href);
        if (url.hostname !== window.location.hostname) {
          analytics.track({
            action: 'external_link_click',
            category: 'Monetization Opportunity',
            label: url.hostname,
            custom_parameters: {
              full_url: target.href,
              link_text: target.textContent?.substring(0, 100),
              affiliate_potential: url.hostname.includes('bet') || url.hostname.includes('sport') ? 'high' : 'low'
            }
          });
        }
      }
    };

    document.addEventListener('click', trackExternalLinks);
    
    return () => {
      document.removeEventListener('click', trackExternalLinks);
    };
  }, []);

  return <>{children}</>;
};

export default MonetizationTracker;