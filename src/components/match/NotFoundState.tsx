import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const NotFoundState = () => {
  return (
    <div className="min-h-screen bg-sports-dark text-sports-light">
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <title>Match Not Found | DamiTV</title>
      </Helmet>
      <div className="container mx-auto px-4 py-16">
        <Card className="bg-sports-card border-sports">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-bold text-gray-300">Match Not Found</h2>
            <p className="mt-2 text-gray-400">The match you're looking for doesn't exist or has ended.</p>
            <Button className="mt-6 bg-[#9b87f5] hover:bg-[#8a75e8]" asChild>
              <Link to="/">Return to Homepage</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NotFoundState;
