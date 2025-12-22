import React, { useEffect, useRef } from 'react';
import { analytics } from '@/utils/analytics';

interface RevenueOptimizerProps {
  pagePath: string;
  contentType: 'match' | 'live' | 'channels' | 'schedule' | 'news' | 'home' | 'blog';
}

const RevenueOptimizer: React.FC<RevenueOptimizerProps> = ({ pagePath, contentType }) => {
  const timeSpentRef = useRef(Date.now());
  const adImpressionTracked = useRef(false);

  useEffect(() => {
    // Track page value for monetization
    analytics.track({
      action: 'page_view_start',
      category: 'Revenue Tracking',
      label: contentType,
      custom_parameters: {
        page_path: pagePath,
        content_type: contentType,
        timestamp: Date.now()
      }
    });

    // Track ad impressions on high-value pages
    if (['match', 'live'].includes(contentType) && !adImpressionTracked.current) {
      setTimeout(() => {
        analytics.trackAdEvent('impression', `${contentType}_page_banner`);
        adImpressionTracked.current = true;
      }, 2000);
    }

    // Track user engagement for RPM optimization
    const engagementInterval = setInterval(() => {
      const timeSpent = Date.now() - timeSpentRef.current;
      
      if (timeSpent > 30000) { // 30 seconds
        analytics.track({
          action: 'high_engagement',
          category: 'User Quality',
          label: contentType,
          value: Math.floor(timeSpent / 1000),
          custom_parameters: {
            page_path: pagePath,
            engagement_level: timeSpent > 120000 ? 'high' : 'medium'
          }
        });
      }
    }, 30000);

    // Track scroll engagement for ad viewability
    const handleScroll = () => {
      const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
      
      if (scrollPercent > 25 && scrollPercent < 30) {
        analytics.track({
          action: 'scroll_25',
          category: 'Content Engagement',
          label: contentType
        });
      } else if (scrollPercent > 50 && scrollPercent < 55) {
        analytics.track({
          action: 'scroll_50',
          category: 'Content Engagement', 
          label: contentType
        });
      } else if (scrollPercent > 75 && scrollPercent < 80) {
        analytics.track({
          action: 'scroll_75',
          category: 'Content Engagement',
          label: contentType
        });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    // Cleanup
    return () => {
      const totalTime = Date.now() - timeSpentRef.current;
      
      analytics.track({
        action: 'page_exit',
        category: 'Revenue Tracking',
        label: contentType,
        value: Math.floor(totalTime / 1000),
        custom_parameters: {
          page_path: pagePath,
          total_time_seconds: Math.floor(totalTime / 1000),
          bounce: totalTime < 10000 ? 'true' : 'false'
        }
      });

      clearInterval(engagementInterval);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [pagePath, contentType]);

  // Track ad clicks when they occur
  useEffect(() => {
    const trackAdClicks = (event: Event) => {
      const target = event.target as HTMLElement;
      
      // Detect ad clicks (customize selectors based on your ad networks)
      if (target.closest('.adsbygoogle, [id*="ad"], [class*="ad-"], [data-ad]')) {
        analytics.trackAdEvent('click', `${contentType}_page_ad`, 1);
        analytics.trackMonetization('ad_click', {
          ad_unit_name: `${contentType}_page_ad`,
          click_position: target.getBoundingClientRect().top.toString(),
          user_engagement_time: Date.now() - timeSpentRef.current
        });
      }
    };

    document.addEventListener('click', trackAdClicks);
    
    return () => {
      document.removeEventListener('click', trackAdClicks);
    };
  }, [contentType]);

  return null; // This component doesn't render anything
};

export default RevenueOptimizer;