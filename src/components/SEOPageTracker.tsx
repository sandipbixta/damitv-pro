// SEO Page Tracker - simplified (no Supabase)
import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { analytics } from '@/utils/analytics';
import RevenueOptimizer from './RevenueOptimizer';

interface SEOPageTrackerProps {
  children: React.ReactNode;
  pageTitle?: string;
  contentType?: 'match' | 'live' | 'channels' | 'schedule' | 'news' | 'home' | 'blog';
}

const SEOPageTracker: React.FC<SEOPageTrackerProps> = ({
  children,
  pageTitle,
  contentType = 'home'
}) => {
  const location = useLocation();

  useEffect(() => {
    // Track page view with analytics only (no database)
    analytics.trackPageView(location.pathname, pageTitle);

    // Track content type for better segmentation
    analytics.track({
      action: 'content_view',
      category: 'Content',
      label: contentType,
      custom_parameters: {
        page_path: location.pathname,
        page_title: pageTitle || document.title,
      }
    });

  }, [location.pathname, pageTitle, contentType]);

  return (
    <>
      <RevenueOptimizer pagePath={location.pathname} contentType={contentType} />
      {children}
    </>
  );
};

export default SEOPageTracker;
