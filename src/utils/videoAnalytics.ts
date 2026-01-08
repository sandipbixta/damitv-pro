/**
 * Video Analytics Tracking for DamiTV
 * Comprehensive GA4 tracking for video streaming events
 */

// GA4 Measurement ID
const GA_MEASUREMENT_ID = 'G-012D2PN0S2';

// Track viewing duration milestones
const MILESTONES = [30, 60, 300, 600]; // 30s, 1m, 5m, 10m in seconds
const reachedMilestones = new Set<string>();

/**
 * Initialize video analytics tracking
 */
export const initVideoAnalytics = () => {
  if (typeof window !== 'undefined' && !window.gtag) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function() {
      window.dataLayer.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', GA_MEASUREMENT_ID);
  }
};

/**
 * Track page view with custom parameters
 */
export const trackPageView = (pageTitle: string, pagePath: string, streamId?: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    const params: Record<string, any> = {
      page_title: pageTitle,
      page_location: window.location.href
    };
    
    if (streamId) {
      params.stream_id = streamId;
    }
    
    window.gtag('event', 'page_view', params);
    console.log('📊 GA4: Page view tracked -', pageTitle);
  }
};

/**
 * Track when video/stream starts playing
 */
export const trackVideoStart = (streamId: string, streamUrl: string, matchTitle?: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    // Reset milestones for new video
    reachedMilestones.clear();
    
    window.gtag('event', 'video_start', {
      event_category: 'video_engagement',
      event_label: 'stream_started',
      stream_id: streamId,
      stream_url: streamUrl,
      match_title: matchTitle || 'Unknown'
    });
    console.log('📊 GA4: Video start tracked -', streamId);
  }
};

/**
 * Track when video is paused
 */
export const trackVideoPause = (streamId: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'video_pause', {
      event_category: 'video_engagement',
      event_label: 'stream_paused',
      stream_id: streamId
    });
    console.log('📊 GA4: Video pause tracked');
  }
};

/**
 * Track when video is resumed
 */
export const trackVideoResume = (streamId: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'video_resume', {
      event_category: 'video_engagement',
      event_label: 'stream_resumed',
      stream_id: streamId
    });
    console.log('📊 GA4: Video resume tracked');
  }
};

/**
 * Track quality change
 */
export const trackQualityChange = (qualityLevel: string | number, streamId?: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'quality_change', {
      event_category: 'video_interaction',
      event_label: 'quality_adjusted',
      quality_level: qualityLevel,
      stream_id: streamId
    });
    console.log('📊 GA4: Quality change tracked -', qualityLevel);
  }
};

/**
 * Track fullscreen toggle
 */
export const trackFullscreen = (enabled: boolean, streamId?: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'fullscreen', {
      event_category: 'video_interaction',
      event_label: enabled ? 'fullscreen_enabled' : 'fullscreen_disabled',
      stream_id: streamId
    });
    console.log('📊 GA4: Fullscreen tracked -', enabled);
  }
};

/**
 * Track viewing duration milestones
 */
export const trackVideoProgress = (currentTimeSeconds: number, streamId: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    for (const milestone of MILESTONES) {
      const milestoneKey = `${streamId}_${milestone}`;
      if (currentTimeSeconds >= milestone && !reachedMilestones.has(milestoneKey)) {
        reachedMilestones.add(milestoneKey);
        
        let label = '';
        if (milestone === 30) label = '30_seconds';
        else if (milestone === 60) label = '1_minute';
        else if (milestone === 300) label = '5_minutes';
        else if (milestone === 600) label = '10_minutes';
        
        window.gtag('event', 'video_progress', {
          event_category: 'video_engagement',
          event_label: label,
          stream_id: streamId,
          watch_time_seconds: milestone
        });
        console.log('📊 GA4: Video progress milestone -', label);
      }
    }
  }
};

/**
 * Track buffering events
 */
export const trackVideoBuffering = (streamId?: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'video_buffering', {
      event_category: 'video_performance',
      event_label: 'buffering_occurred',
      stream_id: streamId
    });
    console.log('📊 GA4: Buffering tracked');
  }
};

/**
 * Track share events
 */
export const trackShare = (method: 'twitter' | 'facebook' | 'whatsapp' | 'telegram' | 'copy_link' | 'native', contentTitle?: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'share', {
      event_category: 'engagement',
      event_label: 'stream_shared',
      method: method,
      content_title: contentTitle
    });
    console.log('📊 GA4: Share tracked -', method);
  }
};

/**
 * Track video errors
 */
export const trackVideoError = (errorMessage: string, streamId?: string, errorType?: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'video_error', {
      event_category: 'video_performance',
      event_label: 'stream_error',
      error_message: errorMessage,
      error_type: errorType,
      stream_id: streamId
    });
    console.log('📊 GA4: Video error tracked -', errorMessage);
  }
};

/**
 * Track chat message sent
 */
export const trackChatMessage = (matchId?: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'chat_message', {
      event_category: 'engagement',
      event_label: 'chat_sent',
      match_id: matchId
    });
    console.log('📊 GA4: Chat message tracked');
  }
};

/**
 * Track subscription/email signup
 */
export const trackSubscription = (method: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'subscribe', {
      event_category: 'conversion',
      event_label: 'user_subscribed',
      method: method
    });
    console.log('📊 GA4: Subscription tracked -', method);
  }
};

/**
 * Track channel/stream source change
 */
export const trackSourceChange = (sourceName: string, streamId?: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'source_change', {
      event_category: 'video_interaction',
      event_label: 'stream_source_changed',
      source_name: sourceName,
      stream_id: streamId
    });
    console.log('📊 GA4: Source change tracked -', sourceName);
  }
};

/**
 * Track match/channel selection
 */
export const trackMatchSelect = (matchTitle: string, matchId: string, sport?: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'select_content', {
      event_category: 'engagement',
      event_label: 'match_selected',
      content_type: 'match',
      item_id: matchId,
      item_name: matchTitle,
      sport: sport
    });
    console.log('📊 GA4: Match select tracked -', matchTitle);
  }
};

/**
 * Create a video progress tracker that can be used with setInterval
 */
export const createProgressTracker = (streamId: string) => {
  let elapsedSeconds = 0;
  
  return {
    tick: () => {
      elapsedSeconds++;
      trackVideoProgress(elapsedSeconds, streamId);
    },
    reset: () => {
      elapsedSeconds = 0;
      // Clear milestones for this stream
      MILESTONES.forEach(m => reachedMilestones.delete(`${streamId}_${m}`));
    },
    getElapsed: () => elapsedSeconds
  };
};

// Extend Window interface for TypeScript
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}
