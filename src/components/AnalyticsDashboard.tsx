// Analytics Dashboard - disabled (frontend only, no Supabase)
import React from 'react';
import { Card } from '@/components/ui/card';

const AnalyticsDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <p className="text-muted-foreground text-center">
          Analytics dashboard is disabled in frontend-only mode.
        </p>
      </Card>
    </div>
  );
};

export default AnalyticsDashboard;
