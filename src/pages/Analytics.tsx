import React, { useEffect } from 'react';
import PageLayout from '@/components/PageLayout';
import PageHeader from '@/components/PageHeader';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';

import SEOMetaTags from '@/components/SEOMetaTags';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Analytics: React.FC = () => {
  // Mark this session as admin when viewing analytics
  useEffect(() => {
    localStorage.setItem('is_admin_session', 'true');
  }, []);

  return (
    <PageLayout>
      <SEOMetaTags
        title="Website Analytics | DamiTV"
        description="View website analytics and traffic statistics for DamiTV"
        canonicalUrl="/analytics"
      />
      <PageHeader title="Analytics Dashboard" subtitle="Track your website's performance, visitor statistics, and ad revenue" />
      <div className="container mx-auto px-4 py-8">
        <AnalyticsDashboard />
      </div>
    </PageLayout>
  );
};

export default Analytics;
