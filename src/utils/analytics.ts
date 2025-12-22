// Enhanced Analytics utilities for traffic tracking and monetization optimization

export interface AnalyticsEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
  custom_parameters?: { [key: string]: any };
}

export interface MonetizationEvent {
  revenue?: number;
  currency?: string;
  ad_unit_name?: string;
  click_position?: string;
  user_engagement_time?: number;
}

class Analytics {
  private isProduction = window.location.hostname !== 'localhost';
  private sessionStartTime = Date.now();
  private pageViewStartTime = Date.now();

  // Enhanced event tracking with monetization focus
  track(event: AnalyticsEvent) {
    if (!this.isProduction) {
      console.log('Analytics Event:', event);
      return;
    }

    // Google Analytics 4 with enhanced ecommerce
    if (typeof window.gtag !== 'undefined') {
      window.gtag('event', event.action, {
        event_category: event.category,
        event_label: event.label,
        value: event.value,
        custom_page_url: window.location.href,
        session_id: this.getSessionId(),
        engagement_time_msec: Date.now() - this.pageViewStartTime,
        ...event.custom_parameters
      });
    }
  }

  // Track monetization events (ad clicks, revenue)
  trackMonetization(action: string, data: MonetizationEvent) {
    this.track({
      action,
      category: 'Monetization',
      label: data.ad_unit_name || 'unknown',
      value: data.revenue || 0,
      custom_parameters: {
        currency: data.currency || 'USD',
        click_position: data.click_position,
        user_engagement_time: data.user_engagement_time
      }
    });
  }

  // Track ad impressions and clicks
  trackAdEvent(action: 'impression' | 'click' | 'revenue', adUnit: string, value?: number) {
    this.track({
      action: `ad_${action}`,
      category: 'Advertising',
      label: adUnit,
      value: value || 1,
      custom_parameters: {
        page_url: window.location.pathname,
        timestamp: Date.now()
      }
    });
  }

  // Enhanced page view tracking with user engagement metrics
  trackPageView(path: string, title?: string) {
    // Reset page view timer
    this.pageViewStartTime = Date.now();
    
    if (!this.isProduction) {
      console.log('Page View:', { path, title });
      return;
    }

    if (typeof window.gtag !== 'undefined') {
      window.gtag('config', 'G-012D2PN0S2', {
        page_path: path,
        page_title: title,
        custom_map: {
          custom_parameter_1: 'user_type',
          custom_parameter_2: 'traffic_source'
        }
      });
      
      // Track enhanced ecommerce page view
      window.gtag('event', 'page_view', {
        page_title: title,
        page_location: window.location.href,
        page_path: path,
        content_group1: this.getContentGroup(path),
        content_group2: this.getTrafficSource()
      });
    }
  }

  // Track match engagement
  trackMatchEngagement(action: 'view' | 'play' | 'share' | 'source_change', matchTitle: string, data?: any) {
    this.track({
      action,
      category: 'Match Engagement',
      label: matchTitle,
      value: data?.duration || 1
    });
  }

  // Track user behavior
  trackUserBehavior(action: string, data?: any) {
    this.track({
      action,
      category: 'User Behavior',
      label: data?.source || 'unknown',
      value: data?.value || 1
    });
  }

  // Track search queries
  trackSearch(query: string, resultsCount: number) {
    this.track({
      action: 'search',
      category: 'Search',
      label: query,
      value: resultsCount
    });
  }

  // Track social sharing
  trackSocialShare(platform: string, content: string) {
    this.track({
      action: 'share',
      category: 'Social',
      label: `${platform}:${content}`,
    });
  }

  // Track performance metrics
  trackPerformance() {
    if (!this.isProduction || !window.performance) return;

    // Track page load time
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigation) {
          const loadTime = navigation.loadEventEnd - navigation.fetchStart;
          this.track({
            action: 'page_load_time',
            category: 'Performance',
            value: Math.round(loadTime)
          });
        }
      }, 1000);
    });
  }

  // Track errors with enhanced context
  trackError(error: Error, context?: string) {
    this.track({
      action: 'exception',
      category: 'Error',
      label: `${context || 'unknown'}: ${error.message}`,
      custom_parameters: {
        error_stack: error.stack?.substring(0, 500),
        user_agent: navigator.userAgent,
        page_url: window.location.href
      }
    });
  }

  // Track user engagement and session quality
  trackEngagement() {
    const sessionDuration = Date.now() - this.sessionStartTime;
    const pageEngagement = Date.now() - this.pageViewStartTime;
    
    this.track({
      action: 'engagement_time',
      category: 'User Engagement',
      value: Math.round(sessionDuration / 1000), // in seconds
      custom_parameters: {
        page_engagement_time: Math.round(pageEngagement / 1000),
        scroll_depth: this.getScrollDepth(),
        clicks_count: this.getClickCount()
      }
    });
  }

  // Helper methods for enhanced tracking
  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  }

  private getContentGroup(path: string): string {
    if (path.includes('/match/')) return 'Match Pages';
    if (path.includes('/live')) return 'Live Sports';
    if (path.includes('/channels')) return 'TV Channels';
    if (path.includes('/schedule')) return 'Schedule';
    if (path.includes('/news')) return 'News';
    return 'Other';
  }

  private getTrafficSource(): string {
    const referrer = document.referrer;
    if (referrer.includes('google.com')) return 'Google Search';
    if (referrer.includes('facebook.com')) return 'Facebook';
    if (referrer.includes('twitter.com')) return 'Twitter';
    if (referrer.includes('reddit.com')) return 'Reddit';
    if (!referrer) return 'Direct';
    return 'Other Referral';
  }

  private getScrollDepth(): number {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    return Math.round((scrollTop / docHeight) * 100);
  }

  private getClickCount(): number {
    return parseInt(sessionStorage.getItem('click_count') || '0');
  }

  // Initialize click tracking
  initClickTracking() {
    let clickCount = 0;
    document.addEventListener('click', () => {
      clickCount++;
      sessionStorage.setItem('click_count', clickCount.toString());
    });
  }
}

// Extend Window interface for gtag
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

export const analytics = new Analytics();

// Auto-initialize enhanced tracking
analytics.trackPerformance();
analytics.initClickTracking();

// Track engagement every 30 seconds
setInterval(() => {
  analytics.trackEngagement();
}, 30000);