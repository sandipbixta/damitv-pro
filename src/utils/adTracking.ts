import { analytics } from './analytics';

/**
 * Centralized ad tracking utility for monitoring ad performance
 */

export type AdType = 'popup' | 'popunder' | 'stream_change' | 'adsense';
export type AdAction = 'impression' | 'click' | 'close' | 'load' | 'error';

interface AdEvent {
  adType: AdType;
  action: AdAction;
  adUnit?: string;
  revenue?: number;
  metadata?: Record<string, any>;
}

class AdTracking {
  /**
   * Track any ad event (impression, click, close, etc.)
   */
  trackAdEvent({ adType, action, adUnit, revenue, metadata }: AdEvent): void {
    const adUnitName = adUnit || adType;
    
    // Track in analytics (only for impression, click, revenue)
    if (action === 'impression' || action === 'click' || action === 'load') {
      const analyticsAction = action === 'load' ? 'impression' : action;
      analytics.trackAdEvent(analyticsAction as 'impression' | 'click' | 'revenue', adUnitName, revenue);
    }
    
    // Store in localStorage for dashboard
    this.updateLocalMetrics(adType, action, revenue);
    
    // Log for debugging
    console.log(`[Ad Tracking] ${adType} - ${action}`, {
      adUnit: adUnitName,
      revenue,
      ...metadata
    });
  }

  /**
   * Track popup ad impression (shown to user)
   */
  trackPopupImpression(): void {
    this.trackAdEvent({
      adType: 'popup',
      action: 'impression',
      adUnit: 'special_offer_popup'
    });
  }

  /**
   * Track popup ad click
   */
  trackPopupClick(): void {
    this.trackAdEvent({
      adType: 'popup',
      action: 'click',
      adUnit: 'special_offer_popup',
      revenue: 0.15 // Estimated CPC
    });
  }

  /**
   * Track popup ad close
   */
  trackPopupClose(): void {
    this.trackAdEvent({
      adType: 'popup',
      action: 'close',
      adUnit: 'special_offer_popup'
    });
  }

  /**
   * Track popunder ad load
   */
  trackPopunderLoad(): void {
    this.trackAdEvent({
      adType: 'popunder',
      action: 'load',
      adUnit: 'popunder_ad',
      revenue: 0.50 // Estimated CPM
    });
  }

  /**
   * Track popunder ad error
   */
  trackPopunderError(error: string): void {
    this.trackAdEvent({
      adType: 'popunder',
      action: 'error',
      adUnit: 'popunder_ad',
      metadata: { error }
    });
  }

  /**
   * Track stream change ad click
   */
  trackStreamChangeAd(): void {
    this.trackAdEvent({
      adType: 'stream_change',
      action: 'click',
      adUnit: 'stream_smartlink',
      revenue: 0.20 // Estimated CPC
    });
  }

  /**
   * Track AdSense impression
   */
  trackAdSenseImpression(adSlot: string): void {
    this.trackAdEvent({
      adType: 'adsense',
      action: 'impression',
      adUnit: adSlot
    });
  }

  /**
   * Track AdSense click
   */
  trackAdSenseClick(adSlot: string, revenue?: number): void {
    this.trackAdEvent({
      adType: 'adsense',
      action: 'click',
      adUnit: adSlot,
      revenue: revenue || 0.25 // Default estimated CPC
    });
  }

  /**
   * Update local storage metrics for dashboard
   */
  private updateLocalMetrics(adType: AdType, action: AdAction, revenue?: number): void {
    try {
      // Update impressions
      if (action === 'impression' || action === 'load') {
        const currentImpressions = parseInt(localStorage.getItem('total_ad_impressions') || '0');
        localStorage.setItem('total_ad_impressions', (currentImpressions + 1).toString());
        
        // Track by ad type
        const typeKey = `${adType}_impressions`;
        const typeImpressions = parseInt(localStorage.getItem(typeKey) || '0');
        localStorage.setItem(typeKey, (typeImpressions + 1).toString());
      }

      // Update clicks
      if (action === 'click') {
        const currentClicks = parseInt(localStorage.getItem('total_ad_clicks') || '0');
        localStorage.setItem('total_ad_clicks', (currentClicks + 1).toString());
        
        // Track by ad type
        const typeKey = `${adType}_clicks`;
        const typeClicks = parseInt(localStorage.getItem(typeKey) || '0');
        localStorage.setItem(typeKey, (typeClicks + 1).toString());
      }

      // Update revenue
      if (revenue) {
        const currentRevenue = parseFloat(localStorage.getItem('total_ad_revenue') || '0');
        localStorage.setItem('total_ad_revenue', (currentRevenue + revenue).toFixed(2));
        
        // Track by ad type
        const typeKey = `${adType}_revenue`;
        const typeRevenue = parseFloat(localStorage.getItem(typeKey) || '0');
        localStorage.setItem(typeKey, (typeRevenue + revenue).toFixed(2));
      }

      // Update close events
      if (action === 'close') {
        const typeKey = `${adType}_closes`;
        const typeCloses = parseInt(localStorage.getItem(typeKey) || '0');
        localStorage.setItem(typeKey, (typeCloses + 1).toString());
      }

      // Update timestamp for tracking period
      localStorage.setItem('ad_tracking_last_updated', Date.now().toString());
      
    } catch (error) {
      console.error('Error updating ad metrics:', error);
    }
  }

  /**
   * Get ad performance metrics from localStorage
   */
  getAdMetrics(): {
    totalImpressions: number;
    totalClicks: number;
    totalRevenue: number;
    ctr: number;
    rpm: number;
    byAdType: Record<AdType, {
      impressions: number;
      clicks: number;
      revenue: number;
      ctr: number;
    }>;
  } {
    const totalImpressions = parseInt(localStorage.getItem('total_ad_impressions') || '0');
    const totalClicks = parseInt(localStorage.getItem('total_ad_clicks') || '0');
    const totalRevenue = parseFloat(localStorage.getItem('total_ad_revenue') || '0');
    const totalPageViews = parseInt(localStorage.getItem('total_page_views') || '1');
    
    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const rpm = totalPageViews > 0 ? (totalRevenue / totalPageViews) * 1000 : 0;

    // Get metrics by ad type
    const adTypes: AdType[] = ['popup', 'popunder', 'stream_change', 'adsense'];
    const byAdType = {} as Record<AdType, {
      impressions: number;
      clicks: number;
      revenue: number;
      ctr: number;
    }>;

    adTypes.forEach(type => {
      const impressions = parseInt(localStorage.getItem(`${type}_impressions`) || '0');
      const clicks = parseInt(localStorage.getItem(`${type}_clicks`) || '0');
      const revenue = parseFloat(localStorage.getItem(`${type}_revenue`) || '0');
      const typeCtr = impressions > 0 ? (clicks / impressions) * 100 : 0;

      byAdType[type] = {
        impressions,
        clicks,
        revenue,
        ctr: typeCtr
      };
    });

    return {
      totalImpressions,
      totalClicks,
      totalRevenue,
      ctr,
      rpm,
      byAdType
    };
  }

  /**
   * Reset ad metrics (useful for testing)
   */
  resetMetrics(): void {
    const keys = [
      'total_ad_impressions',
      'total_ad_clicks',
      'total_ad_revenue',
      'popup_impressions',
      'popup_clicks',
      'popup_revenue',
      'popup_closes',
      'popunder_impressions',
      'popunder_clicks',
      'popunder_revenue',
      'stream_change_impressions',
      'stream_change_clicks',
      'stream_change_revenue',
      'adsense_impressions',
      'adsense_clicks',
      'adsense_revenue',
    ];

    keys.forEach(key => localStorage.removeItem(key));
    console.log('[Ad Tracking] Metrics reset');
  }
}

export const adTracking = new AdTracking();
