import { Helmet } from 'react-helmet-async';
import { SportsDashboard } from '@/components/dashboard/SportsDashboard';
import ThemeToggle from '@/components/ThemeToggle';

export default function Dashboard() {
  return (
    <>
      <Helmet>
        <title>Melbourne Sports Dashboard | Live Scores, Fixtures & Standings</title>
        <meta 
          name="description" 
          content="Live sports dashboard for Melbourne. Real-time scores, fixtures, and standings for A-League, AFL, EPL, and cricket. Powered by AI." 
        />
      </Helmet>
      
      <div className="min-h-screen bg-background text-foreground">
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          <div className="flex justify-end mb-4">
            <ThemeToggle />
          </div>
          <SportsDashboard />
        </div>
      </div>
    </>
  );
}
