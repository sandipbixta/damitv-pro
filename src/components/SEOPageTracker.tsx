import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { analytics } from '@/utils/analytics';

interface SEOPageTrackerProps {
  children: React.ReactNode;
  pageTitle?: string;
  contentType?: 'match' | 'live' | 'channels' | 'schedule' | 'home';
}

const SEOPageTracker: React.FC<SEOPageTrackerProps> = ({ 
  children, 
  pageTitle,
  contentType = 'home'
}) => {
  const location = useLocation();

  useEffect(() => {
    // Check if this is an admin session
    const isAdminSession = localStorage.getItem('is_admin_session') === 'true';
    
    if (isAdminSession) {
      return;
    }

    // Track page view
    analytics.trackPageView(location.pathname, pageTitle);
    
    // Track content type
    analytics.track({
      action: 'content_view',
      category: 'Content',
      label: contentType,
      custom_parameters: {
        page_path: location.pathname,
        page_title: pageTitle || document.title
      }
    });

  }, [location.pathname, pageTitle, contentType]);

  return <>{children}</>;
};

export default SEOPageTracker;
