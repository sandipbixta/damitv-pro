import React from 'react';
import { Link } from 'react-router-dom';
import SEOMetaTags from '@/components/SEOMetaTags';
import PageLayout from '@/components/PageLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import FAQSection from '@/components/FAQSection';
import InternalLinks from '@/components/InternalLinks';
import { Play, Shield, Tv, Clock } from 'lucide-react';

const UfcStreaming = () => {
  const faqs = [
    {
      question: "How can I watch UFC fights for free?",
      answer: "DamiTV offers free UFC live streams for all events including Fight Nights, PPV events, and UFC numbered events. Simply visit our live page during fight time and start watching instantly."
    },
    {
      question: "Can I watch UFC PPV events for free on DamiTV?",
      answer: "Yes! DamiTV streams all UFC PPV (Pay-Per-View) events completely free. Watch championship fights, title bouts, and main events without paying $70+ for PPV."
    },
    {
      question: "What UFC events do you stream?",
      answer: "We stream all UFC events: numbered UFC events (UFC 300, 301, etc.), UFC Fight Night, UFC on ESPN, preliminary cards, main cards, and all championship fights."
    },
    {
      question: "Is the stream quality good for UFC fights?",
      answer: "Yes, we provide HD quality streams for all UFC events. Multiple stream sources ensure you get the best possible viewing experience for every fight."
    }
  ];

  const internalLinks = [
    { text: 'Live UFC Fights', url: '/live', description: 'Watch UFC live now' },
    { text: 'Sports TV Channels', url: '/channels', description: '70+ sports channels' },
    { text: 'UFC Fight Schedule', url: '/schedule', description: 'Upcoming UFC events' }
  ];

  return (
    <PageLayout>
      <SEOMetaTags
        title="UFC Streaming Free - Watch UFC Fights Live & PPV Free | DamiTV"
        description="Watch UFC fights live for free including PPV events. Stream all UFC numbered events, Fight Nights, and championship bouts in HD. No subscription needed."
        keywords="ufc streaming free, watch ufc free, ufc live stream, free ufc ppv, watch ufc fights online, ufc fight night stream, mma streaming, ufc events today"
        canonicalUrl="https://damitv.pro/ufc-streaming-free"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "SportsOrganization",
          "name": "UFC Free Streaming - DamiTV",
          "description": "Watch all UFC fights live for free including PPV events",
          "url": "https://damitv.pro/ufc-streaming-free",
          "sport": "Mixed Martial Arts",
          "memberOf": {
            "@type": "SportsOrganization",
            "name": "Ultimate Fighting Championship"
          }
        }}
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'UFC Streaming Free', url: '/ufc-streaming-free' }
        ]}
      />

      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <header className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            UFC Streaming Free - Watch Live Fights & PPV Events
          </h1>
          <p className="text-xl text-muted-foreground mb-6 max-w-3xl mx-auto">
            Stream all UFC fights live in HD quality including PPV events. Free access to every 
            UFC numbered event, Fight Night, preliminary cards, and championship bouts. No subscription required.
          </p>
          <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
            <Link to="/live">
              <Play className="mr-2 h-5 w-5" />
              Watch UFC Live Now
            </Link>
          </Button>
        </header>

        {/* Features Grid */}
        <section className="mb-12">
          <div className="grid md:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <Tv className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">HD Quality</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Watch every UFC fight in high definition with crystal clear picture quality.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Play className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">All UFC Events</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Complete UFC coverage including numbered events, Fight Nights, and PPVs.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">Free PPV Access</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Watch expensive PPV events completely free. Save $70+ per event.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Clock className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">Prelims & Main Card</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Stream full events from early prelims to main card and championship fights.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Why Choose Section */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-6">Why Watch UFC on DamiTV?</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Free UFC PPV Alternative</h3>
                  <p className="text-muted-foreground">
                    DamiTV provides free access to all UFC PPV events that normally cost $69.99-$79.99. 
                    Watch championship fights, title defenses, and special events without paying premium prices. 
                    Best alternative to ESPN+ PPV and UFC Fight Pass.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Complete Fight Coverage</h3>
                  <p className="text-muted-foreground">
                    Watch the entire UFC event from start to finish. We stream early preliminary fights, 
                    preliminary card, and main card including all championship and main event fights.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Multiple Stream Sources</h3>
                  <p className="text-muted-foreground">
                    Each UFC event has multiple backup streams. If one stream has issues, instantly switch 
                    to another high-quality source. Never miss a knockout or submission finish.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Watch UFC on Any Device</h3>
                  <p className="text-muted-foreground">
                    DamiTV works perfectly on all devices. Watch UFC fights on your phone, tablet, laptop, 
                    desktop, or stream to your smart TV. Mobile-optimized for watching fights on the go.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">No Registration Required</h3>
                  <p className="text-muted-foreground">
                    Start watching immediately. No account creation, no credit card, no subscription. 
                    Just click and watch UFC fights live for free.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Popular Fighters */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-6">Watch Your Favorite UFC Fighters</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  'Conor McGregor', 'Jon Jones', 'Islam Makhachev',
                  'Israel Adesanya', 'Alexander Volkanovski', 'Charles Oliveira',
                  'Leon Edwards', 'Kamaru Usman', 'Francis Ngannou',
                  'Amanda Nunes', 'Valentina Shevchenko', 'Zhang Weili'
                ].map((fighter) => (
                  <div key={fighter} className="p-3 bg-secondary rounded-lg text-center hover:bg-secondary/80 transition-colors">
                    <span className="font-medium text-foreground">{fighter}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* FAQ Section */}
        <FAQSection faqs={faqs} />

        {/* Internal Links */}
        <InternalLinks links={internalLinks} title="Related Pages" />
      </div>
    </PageLayout>
  );
};

export default UfcStreaming;
