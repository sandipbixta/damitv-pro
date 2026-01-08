import React from 'react';
import { Link } from 'react-router-dom';
import SEOMetaTags from '@/components/SEOMetaTags';
import PageLayout from '@/components/PageLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import FAQSection from '@/components/FAQSection';
import InternalLinks from '@/components/InternalLinks';
import { Play, Shield, Tv, Clock } from 'lucide-react';

const NbaStreaming = () => {
  const faqs = [
    {
      question: "How can I watch NBA games for free?",
      answer: "DamiTV offers free NBA live streams in HD quality. Visit our live matches page, select the NBA game you want to watch, and start streaming instantly. No registration or payment required."
    },
    {
      question: "Can I watch NBA playoffs and finals for free?",
      answer: "Yes! DamiTV streams all NBA games including regular season, playoffs, and NBA Finals completely free. Watch every game from opening night to the championship."
    },
    {
      question: "What devices can I use to watch NBA streams?",
      answer: "DamiTV works on all devices - smartphones, tablets, laptops, desktops, and smart TVs. Our streams are mobile-optimized for watching NBA games on the go."
    },
    {
      question: "Do you stream all NBA teams?",
      answer: "Yes, we provide streams for all 30 NBA teams including Lakers, Warriors, Celtics, Heat, Nets, 76ers, and more. Watch your favorite team every game day."
    }
  ];

  const internalLinks = [
    { text: 'Live Sports Streams', url: '/live', description: 'Watch all sports live now' },
    { text: 'Sports Channels', url: '/channels', description: '70+ channels including ESPN, TNT' },
    { text: 'Sports Schedule', url: '/schedule', description: 'NBA fixtures and times' }
  ];

  return (
    <PageLayout>
      <SEOMetaTags
        title="NBA Streaming Free - Watch NBA Live Games Online 2024/25 | DamiTV"
        description="Watch NBA games live for free in HD. Stream all NBA matches, playoffs, finals online. No subscription required. Best free NBA streaming alternative."
        keywords="nba streaming free, watch nba online, nba live stream, free nba games, watch nba playoffs, nba finals stream, live basketball streaming, nba games today"
        canonicalUrl="https://damitv.pro/nba-streaming-free"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "SportsOrganization",
          "name": "NBA Free Streaming - DamiTV",
          "description": "Watch all NBA games live for free in HD quality",
          "url": "https://damitv.pro/nba-streaming-free",
          "sport": "Basketball",
          "memberOf": {
            "@type": "SportsOrganization",
            "name": "National Basketball Association"
          }
        }}
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'NBA Streaming Free', url: '/nba-streaming-free' }
        ]}
      />

      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <header className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            NBA Streaming Free - Watch Live Basketball Games
          </h1>
          <p className="text-xl text-muted-foreground mb-6 max-w-3xl mx-auto">
            Stream all NBA games live in HD quality. Free access to every basketball match, 
            playoffs, finals, and highlights. No subscription or registration needed.
          </p>
          <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
            <Link to="/live">
              <Play className="mr-2 h-5 w-5" />
              Watch NBA Live Now
            </Link>
          </Button>
        </header>

        {/* Features Grid */}
        <section className="mb-12">
          <div className="grid md:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <Tv className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">HD Streams</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Watch every NBA game in crystal clear HD quality with smooth streaming.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Play className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">All Games</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Complete NBA coverage - regular season, playoffs, and NBA Finals.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">100% Free</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  No subscription, no registration, no hidden fees. Completely free NBA streaming.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Clock className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">Live & On-Demand</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Watch games live or catch up with highlights and replays anytime.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Why Choose Section */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-6">Why Watch NBA on DamiTV?</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Free NBA Streaming Alternative</h3>
                  <p className="text-muted-foreground">
                    DamiTV is the best free alternative to NBA League Pass, ESPN+, and TNT subscriptions. 
                    Watch Lakers, Warriors, Celtics, Heat, Nets, Bucks, 76ers, and all 30 NBA teams without 
                    paying monthly fees.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Multiple Stream Options</h3>
                  <p className="text-muted-foreground">
                    Each NBA game has multiple streaming sources. If one stream buffers or lags, instantly 
                    switch to another backup stream for uninterrupted viewing.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Watch NBA on Mobile</h3>
                  <p className="text-muted-foreground">
                    Our mobile-optimized platform lets you watch NBA games anywhere. Stream live basketball 
                    on your phone during commute, lunch break, or while traveling.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">NBA Playoffs & Finals Coverage</h3>
                  <p className="text-muted-foreground">
                    Don't miss the most exciting basketball of the year. Watch every playoff game and NBA 
                    Finals match live and free on DamiTV.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Popular Teams */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-6">Watch Your Favorite NBA Team</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  'Los Angeles Lakers', 'Golden State Warriors', 'Boston Celtics',
                  'Miami Heat', 'Brooklyn Nets', 'Milwaukee Bucks',
                  'Philadelphia 76ers', 'Phoenix Suns', 'Dallas Mavericks',
                  'Denver Nuggets', 'LA Clippers', 'Chicago Bulls'
                ].map((team) => (
                  <div key={team} className="p-3 bg-secondary rounded-lg text-center hover:bg-secondary/80 transition-colors">
                    <span className="font-medium text-foreground">{team}</span>
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

export default NbaStreaming;
