import React, { useEffect } from 'react';
import PageLayout from '@/components/PageLayout';
import PageHeader from '@/components/PageHeader';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import MonetizationDashboard from '@/components/MonetizationDashboard';
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
        <Tabs defaultValue="traffic" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="traffic">Traffic Analytics</TabsTrigger>
            <TabsTrigger value="monetization">Ad Performance</TabsTrigger>
          </TabsList>
          
          <TabsContent value="traffic" className="space-y-4">
            <AnalyticsDashboard />
          </TabsContent>
          
          <TabsContent value="monetization" className="space-y-4">
            <MonetizationDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
};

export default Analytics;
