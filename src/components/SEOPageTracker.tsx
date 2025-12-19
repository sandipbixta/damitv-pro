import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

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
    // Check if this is an admin session (visited /analytics page)
    const isAdminSession = localStorage.getItem('is_admin_session') === 'true';
    
    // Don't track admin views
    if (isAdminSession) {
      return;
    }

    // Save page view to database
    const savePageView = async () => {
      try {
        let sessionId = sessionStorage.getItem('analytics_session_id');
        if (!sessionId) {
          sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          sessionStorage.setItem('analytics_session_id', sessionId);
        }

        await supabase.from('page_views').insert({
          page_path: location.pathname,
          page_title: pageTitle || document.title,
          referrer: document.referrer || null,
          user_agent: navigator.userAgent.substring(0, 255),
          session_id: sessionId
        });
      } catch (error) {
        console.error('Error saving page view:', error);
      }
    };

    savePageView();
  }, [location.pathname, pageTitle, contentType]);

  return <>{children}</>;
};

export default SEOPageTracker;
