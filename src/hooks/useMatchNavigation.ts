
import { useNavigate, useLocation } from 'react-router-dom';
import { useIsMobile } from './use-mobile';
import { useCallback, useRef, useEffect } from 'react';

export const useMatchNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const lastNavigateTime = useRef(0);
  const navigationHistory = useRef<string[]>([]);

  // Track navigation history
  useEffect(() => {
    const currentPath = location.pathname + location.search;
    const history = navigationHistory.current;
    
    // Only add to history if it's different from the last entry
    if (history.length === 0 || history[history.length - 1] !== currentPath) {
      history.push(currentPath);
      
      // Keep only last 10 entries to prevent memory issues
      if (history.length > 10) {
        history.shift();
      }
    }
  }, [location.pathname, location.search]);

  const handleGoBack = useCallback((e?: React.MouseEvent | React.TouchEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    // Debounce to prevent rapid-fire navigation
    const now = Date.now();
    if (now - lastNavigateTime.current < 300) {
      console.log('Navigation debounced - too rapid');
      return;
    }
    lastNavigateTime.current = now;
    
    console.log('Back button clicked, navigating...');
    
    try {
      const history = navigationHistory.current;
      
      // If we have history and can go back to a previous page
      if (history.length > 1) {
        // Remove current page and go to previous
        history.pop();
        const previousPage = history[history.length - 1];
        
        if (previousPage && previousPage !== location.pathname + location.search) {
          navigate(previousPage, { replace: false });
          return;
        }
      }
      
      // Check if browser has history to go back to
      if (window.history.length > 1) {
        navigate(-1);
      } else {
        // Fallback to home if no history
        navigate('/', { replace: true });
      }
    } catch (error) {
      console.error('Navigation failed, falling back to home:', error);
      navigate('/', { replace: true });
    }
  }, [navigate, location]);

  return { handleGoBack, isMobile };
};
