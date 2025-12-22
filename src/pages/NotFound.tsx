import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, Tv, Calendar, Newspaper } from 'lucide-react';

const NotFound = () => {
  useEffect(() => {
    document.title = '404 - Page Not Found | DamiTV';
  }, []);

  const quickLinks = [
    {
      title: 'Live Sports Streaming',
      description: 'Watch live matches now',
      url: '/live',
      icon: Tv
    },
    {
      title: 'TV Channels',
      description: '70+ sports channels',
      url: '/channels',
      icon: Tv
    },
    {
      title: 'Sports Schedule',
      description: 'Upcoming fixtures',
      url: '/schedule',
      icon: Calendar
    },
    {
      title: 'Sports News',
      description: 'Latest updates',
      url: '/news',
      icon: Newspaper
    }
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-background py-12">
      <Helmet>
        <title>404 - Page Not Found | DamiTV Sports Streaming</title>
        <link rel="canonical" href="https://damitv.pro/404" />
        <meta name="description" content="Page not found. The page you're looking for doesn't exist. Return to DamiTV homepage to watch free live sports streaming - football, basketball, tennis & more." />
        <meta name="robots" content="noindex, follow" />
        
        {/* Open Graph */}
        <meta property="og:title" content="404 - Page Not Found | DamiTV" />
        <meta property="og:description" content="Page not found. Return to DamiTV to watch free live sports streaming." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://damitv.pro/404" />
        
        {/* Schema.org */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "404 Not Found",
            "description": "This page could not be found",
            "url": "https://damitv.pro/404"
          })}
        </script>
      </Helmet>
      
      <div className="text-center max-w-4xl mx-auto">
        <h1 className="text-9xl font-bold text-primary mb-4" aria-label="Error 404">404</h1>
        <h2 className="text-3xl font-semibold text-foreground mb-4">Oops! Page Not Found</h2>
        <p className="text-muted-foreground mb-8 text-lg max-w-2xl mx-auto">
          The page you're looking for doesn't exist or has been moved. Don't worry, you can still watch 
          free live sports streaming on DamiTV.
        </p>
        
        <Button asChild size="lg" className="mb-12">
          <Link to="/">
            <Home className="mr-2 h-5 w-5" />
            Return to Homepage
          </Link>
        </Button>

        {/* Quick Links Section */}
        <section className="mt-12">
          <h3 className="text-2xl font-bold text-foreground mb-6">Popular Pages</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link key={link.url} to={link.url} className="group">
                  <Card className="h-full transition-all hover:border-primary hover:shadow-lg">
                    <CardHeader>
                      <Icon className="h-8 w-8 text-primary mb-2 group-hover:scale-110 transition-transform" />
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">
                        {link.title}
                      </CardTitle>
                      <CardDescription>{link.description}</CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Additional Help Section */}
        <section className="mt-12 p-6 bg-secondary/50 rounded-lg">
          <h3 className="text-xl font-semibold text-foreground mb-4">Need Help?</h3>
          <div className="flex flex-wrap gap-6 justify-center text-sm">
            <Link to="/about" className="text-primary hover:underline flex items-center gap-2">
              About DamiTV
            </Link>
            <Link to="/contact" className="text-primary hover:underline flex items-center gap-2">
              Contact Support
            </Link>
            <Link to="/daddylivehd-alternatives" className="text-primary hover:underline flex items-center gap-2">
              Streaming Alternatives
            </Link>
            <Link to="/install" className="text-primary hover:underline flex items-center gap-2">
              Install App
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default NotFound;
