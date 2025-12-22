import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { analytics } from '@/utils/analytics';
import { adTracking } from '@/utils/adTracking';

interface MetricData {
  pageViews: number;
  adImpressions: number;
  adClicks: number;
  avgEngagement: number;
  topPages: { path: string; views: number }[];
  revenueEstimate: number;
}

const MonetizationDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<MetricData>({
    pageViews: 0,
    adImpressions: 0,
    adClicks: 0,
    avgEngagement: 0,
    topPages: [],
    revenueEstimate: 0
  });

  useEffect(() => {
    // Fetch real ad metrics using adTracking
    const fetchMetrics = () => {
      const adMetrics = adTracking.getAdMetrics();
      const storedViews = parseInt(localStorage.getItem('total_page_views') || '0');
      
      setMetrics({
        pageViews: storedViews,
        adImpressions: adMetrics.totalImpressions,
        adClicks: adMetrics.totalClicks,
        avgEngagement: 45, // seconds - could be enhanced with real data
        topPages: [
          { path: '/live', views: Math.floor(storedViews * 0.3) },
          { path: '/match/*', views: Math.floor(storedViews * 0.25) },
          { path: '/', views: Math.floor(storedViews * 0.2) },
          { path: '/channels', views: Math.floor(storedViews * 0.15) },
          { path: '/schedule', views: Math.floor(storedViews * 0.1) }
        ],
        revenueEstimate: adMetrics.totalRevenue
      });
    };

    fetchMetrics();
    
    // Update metrics every 30 seconds for real-time tracking
    const interval = setInterval(fetchMetrics, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Track dashboard view
  useEffect(() => {
    analytics.track({
      action: 'monetization_dashboard_view',
      category: 'Admin',
      label: 'revenue_tracking'
    });
  }, []);

  const ctr = metrics.adImpressions > 0 ? ((metrics.adClicks / metrics.adImpressions) * 100).toFixed(2) : '0.00';
  const rpm = metrics.pageViews > 0 ? ((metrics.revenueEstimate / metrics.pageViews) * 1000).toFixed(2) : '0.00';

  // Get detailed metrics by ad type
  const adMetrics = adTracking.getAdMetrics();

  return (
    <div className="space-y-6">
      {/* Main Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Page Views</CardTitle>
            <Badge variant="secondary">24h</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.pageViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Avg engagement: {metrics.avgEngagement}s
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ad Revenue</CardTitle>
            <Badge variant="secondary">${rpm} RPM</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.revenueEstimate.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.adClicks} clicks • {ctr}% CTR
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ad Performance</CardTitle>
            <Badge variant="secondary">{ctr}% CTR</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.adImpressions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Impressions • {metrics.adClicks} clicks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Content</CardTitle>
            <Badge variant="secondary">Revenue</Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {metrics.topPages.slice(0, 3).map((page, index) => (
                <div key={page.path} className="flex justify-between text-sm">
                  <span className="truncate">{page.path}</span>
                  <span className="font-medium">{page.views}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ad Type Performance Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Performance by Ad Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Popup Ad */}
            <div className="space-y-2 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">Popup Ad</h4>
                <Badge variant="outline">{adMetrics.byAdType.popup.ctr.toFixed(1)}% CTR</Badge>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Impressions:</span>
                  <span className="font-medium">{adMetrics.byAdType.popup.impressions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Clicks:</span>
                  <span className="font-medium">{adMetrics.byAdType.popup.clicks}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Revenue:</span>
                  <span className="font-medium text-green-600">${adMetrics.byAdType.popup.revenue.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Popunder Ad */}
            <div className="space-y-2 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">Popunder Ad</h4>
                <Badge variant="outline">{adMetrics.byAdType.popunder.ctr.toFixed(1)}% CTR</Badge>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Impressions:</span>
                  <span className="font-medium">{adMetrics.byAdType.popunder.impressions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Clicks:</span>
                  <span className="font-medium">{adMetrics.byAdType.popunder.clicks}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Revenue:</span>
                  <span className="font-medium text-green-600">${adMetrics.byAdType.popunder.revenue.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Stream Change Ad */}
            <div className="space-y-2 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">Stream Change</h4>
                <Badge variant="outline">{adMetrics.byAdType.stream_change.ctr.toFixed(1)}% CTR</Badge>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Impressions:</span>
                  <span className="font-medium">{adMetrics.byAdType.stream_change.impressions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Clicks:</span>
                  <span className="font-medium">{adMetrics.byAdType.stream_change.clicks}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Revenue:</span>
                  <span className="font-medium text-green-600">${adMetrics.byAdType.stream_change.revenue.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* AdSense */}
            <div className="space-y-2 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">AdSense</h4>
                <Badge variant="outline">{adMetrics.byAdType.adsense.ctr.toFixed(1)}% CTR</Badge>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Impressions:</span>
                  <span className="font-medium">{adMetrics.byAdType.adsense.impressions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Clicks:</span>
                  <span className="font-medium">{adMetrics.byAdType.adsense.clicks}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Revenue:</span>
                  <span className="font-medium text-green-600">${adMetrics.byAdType.adsense.revenue.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Key Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Badge variant="secondary">💡</Badge>
              <div>
                <p className="font-medium">Total Ad Impressions</p>
                <p className="text-sm text-muted-foreground">
                  {adMetrics.totalImpressions.toLocaleString()} impressions across all ad types
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="secondary">📊</Badge>
              <div>
                <p className="font-medium">Average CTR</p>
                <p className="text-sm text-muted-foreground">
                  {adMetrics.ctr.toFixed(2)}% click-through rate across all ads
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="secondary">💰</Badge>
              <div>
                <p className="font-medium">RPM (Revenue per 1000 views)</p>
                <p className="text-sm text-muted-foreground">
                  ${adMetrics.rpm.toFixed(2)} per thousand page views
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MonetizationDashboard;