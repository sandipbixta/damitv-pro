// Match Detail page - redirects to live page (no Supabase database)
import React from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '@/components/PageLayout';

const MatchDetail: React.FC = () => {
  const navigate = useNavigate();

  React.useEffect(() => {
    // Redirect to live matches since we don't have database
    navigate('/live');
  }, [navigate]);

  return (
    <PageLayout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Redirecting to live matches...</p>
      </div>
    </PageLayout>
  );
};

export default MatchDetail;
