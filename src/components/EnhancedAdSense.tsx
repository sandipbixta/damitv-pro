import React, { useEffect, useRef, useState } from 'react';
import { analytics } from '@/utils/analytics';

interface EnhancedAdSenseProps {
  adSlot: string;
  adFormat?: 'auto' | 'rectangle' | 'banner' | 'leaderboard';
  className?: string;
  responsive?: boolean;
  priority?: 'high' | 'medium' | 'low';
}

const EnhancedAdSense: React.FC<EnhancedAdSenseProps> = ({
  adSlot,
  adFormat = 'auto',
  className = '',
  responsive = true,
  priority = 'medium'
}) => {
  const adRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [adLoaded, setAdLoaded] = useState(false);
  const impressionTracked = useRef(false);

  useEffect(() => {
    // Intersection Observer for lazy loading and viewability tracking
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !adLoaded) {
            setIsVisible(true);
            loadAd();
          }
          
          // Track ad viewability (50% visible for 1 second)
          if (entry.isIntersecting && entry.intersectionRatio > 0.5 && !impressionTracked.current) {
            setTimeout(() => {
              if (entry.isIntersecting) {
                analytics.trackAdEvent('impression', adSlot);
                impressionTracked.current = true;
              }
            }, 1000);
          }
        });
      },
      {
        threshold: [0.1, 0.5, 0.9],
        rootMargin: '50px'
      }
    );

    if (adRef.current) {
      observer.observe(adRef.current);
    }

    return () => {
      if (adRef.current) {
        observer.unobserve(adRef.current);
      }
    };
  }, [adSlot, adLoaded]);

  const loadAd = () => {
    if (adLoaded || !window.adsbygoogle) return;

    try {
      // Initialize AdSense ad
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      setAdLoaded(true);
      
      // Track ad load success
      analytics.track({
        action: 'ad_load_success',
        category: 'AdSense',
        label: adSlot,
        custom_parameters: {
          ad_format: adFormat,
          priority: priority,
          page_url: window.location.pathname
        }
      });
    } catch (error) {
      console.warn('AdSense load error:', error);
      analytics.track({
        action: 'ad_load_error',
        category: 'AdSense',
        label: adSlot,
        custom_parameters: {
          error_message: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  };

  // Get ad dimensions based on format
  const getAdStyle = () => {
    const baseStyle: React.CSSProperties = {
      display: 'block',
      width: '100%'
    };

    if (!responsive) {
      switch (adFormat) {
        case 'banner':
          return { ...baseStyle, width: '728px', height: '90px' };
        case 'rectangle':
          return { ...baseStyle, width: '300px', height: '250px' };
        case 'leaderboard':
          return { ...baseStyle, width: '728px', height: '90px' };
        default:
          return baseStyle;
      }
    }

    return baseStyle;
  };

  // Track ad clicks
  const handleAdClick = () => {
    analytics.trackAdEvent('click', adSlot, 1);
    analytics.trackMonetization('ad_click', {
      ad_unit_name: adSlot,
      click_position: adRef.current?.getBoundingClientRect().top.toString(),
      user_engagement_time: Date.now() - performance.timing.navigationStart
    });
  };

  return (
    <div 
      ref={adRef}
      className={`ad-container ${className}`}
      onClick={handleAdClick}
      style={{ minHeight: responsive ? '100px' : undefined }}
    >
      {isVisible && (
        <ins
          className="adsbygoogle"
          style={getAdStyle()}
          data-ad-client="ca-pub-5505494656170063"
          data-ad-slot={adSlot}
          data-ad-format={responsive ? 'auto' : adFormat}
          data-full-width-responsive={responsive ? 'true' : 'false'}
          data-ad-priority={priority}
        />
      )}
    </div>
  );
};

// Extend window for AdSense
declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

export default EnhancedAdSense;