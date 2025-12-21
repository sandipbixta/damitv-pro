import { useNavigate } from 'react-router-dom';
import { useIsMobile } from './use-mobile';
import { useCallback } from 'react';

export const useMatchNavigation = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const handleGoBack = useCallback((e?: React.MouseEvent | React.TouchEvent) => {
    // Prevent default but don't stop propagation
    if (e) {
      e.preventDefault();
    }
    
    console.log('Back button clicked, navigating...');
    
    // Simple and reliable: use browser history if available, otherwise go home
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  return { handleGoBack, isMobile };
};
