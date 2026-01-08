import React from 'react';
import { Link } from 'react-router-dom';
import SEOMetaTags from '@/components/SEOMetaTags';
import PageLayout from '@/components/PageLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import FAQSection from '@/components/FAQSection';
import InternalLinks from '@/components/InternalLinks';
import { Play, Shield, Tv, Clock } from 'lucide-react';

const WatchPremierLeague = () => {
  const faqs = [
    {
      question: "How can I watch Premier League matches for free?",
      answer: "DamiTV offers free Premier League live streams in HD quality. Simply visit our live matches page, find the Premier League game you want to watch, and click to start streaming. No registration or subscription required."
    },
    {
      question: "What time do Premier League matches start?",
      answer: "Premier League matches typically kick off on Saturdays at 12:30 PM, 3:00 PM, and 5:30 PM GMT. Sunday matches are usually at 2:00 PM and 4:30 PM GMT. Midweek fixtures vary. Check our schedule page for exact times."
    },
    {
      question: "Can I watch Premier League on mobile?",
      answer: "Yes! DamiTV is fully mobile-responsive. You can watch Premier League matches on any device - smartphone, tablet, laptop, or desktop. Our streams work seamlessly across all platforms."
    },
    {
      question: "Is it legal to watch Premier League streams on DamiTV?",
      answer: "DamiTV aggregates publicly available streams. We recommend checking your local laws regarding streaming. For official broadcasts, consider subscribing to legitimate providers in your region."
    }
  ];

  const internalLinks = [
    { text: 'Live Football Matches', url: '/live', description: 'Watch all live football now' },
    { text: 'TV Channels', url: '/channels', description: '70+ sports channels' },
    { text: 'Sports Schedule', url: '/schedule', description: 'Upcoming fixtures' }
  ];

  const premierLeagueTeams = [
    'Arsenal', 'Aston Villa', 'Bournemouth', 'Brentford', 'Brighton', 'Burnley',
    'Chelsea', 'Crystal Palace', 'Everton', 'Fulham', 'Liverpool', 'Luton Town',
    'Manchester City', 'Manchester United', 'Newcastle', 'Nottingham Forest',
    'Sheffield United', 'Tottenham', 'West Ham', 'Wolves'
  ];

  return (
    <PageLayout>
      <SEOMetaTags
        title="Watch Premier League Free - Live EPL Streams 2024/25 | DamiTV"
        description="Watch Premier League live streams for free in HD. All EPL matches, goals, highlights. No subscription needed. Best alternative to paid Premier League streaming."
        keywords="watch premier league free, premier league streaming, epl live stream, premier league online, free football streaming, watch epl online, premier league matches today"
        canonicalUrl="https://damitv.pro/watch-premier-league-free"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "SportsOrganization",
          "name": "Premier League Free Streaming - DamiTV",
          "description": "Watch all Premier League matches live for free in HD quality",
          "url": "https://damitv.pro/watch-premier-league-free",
          "sport": "Football/Soccer",
          "memberOf": {
            "@type": "SportsOrganization",
            "name": "English Premier League"
          }
        }}
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Watch Premier League Free', url: '/watch-premier-league-free' }
        ]}
      />

      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <header className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Watch Premier League Free - Live EPL Streaming
          </h1>
          <p className="text-xl text-muted-foreground mb-6 max-w-3xl mx-auto">
            Stream all Premier League matches live in HD quality. Free access to every EPL game, 
            goals, highlights, and analysis. No subscription or registration required.
          </p>
          <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
            <Link to="/live">
              <Play className="mr-2 h-5 w-5" />
              Watch Premier League Now
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
                  Watch every Premier League match in high definition with multiple stream quality options.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Play className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">All Matches</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Complete coverage of every Premier League fixture - never miss a game.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">No Registration</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Start watching immediately. No sign-up, no subscription, completely free.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Clock className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">24/7 Access</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Access live matches and highlights anytime on any device - mobile, tablet, or desktop.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Premier League Teams */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-6">Premier League Teams 2024/25</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {premierLeagueTeams.map((team) => (
                  <div key={team} className="p-3 bg-secondary rounded-lg text-center hover:bg-secondary/80 transition-colors">
                    <span className="font-medium text-foreground">{team}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Why Choose DamiTV */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-6">Why Watch Premier League on DamiTV?</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Free Premier League Streaming</h3>
                  <p className="text-muted-foreground">
                    DamiTV provides completely free access to all Premier League matches. Watch Arsenal, 
                    Liverpool, Manchester City, Chelsea, Tottenham, Manchester United, and all other EPL teams 
                    without paying for expensive subscriptions.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Multiple Stream Sources</h3>
                  <p className="text-muted-foreground">
                    We offer multiple streaming links for each match, ensuring you always have a working stream. 
                    If one source has issues, simply switch to another instantly.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Mobile-Friendly Experience</h3>
                  <p className="text-muted-foreground">
                    Watch Premier League matches on the go. Our responsive design works perfectly on smartphones 
                    and tablets, so you never miss a goal wherever you are.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Best Alternative to Paid Services</h3>
                  <p className="text-muted-foreground">
                    DamiTV is the top free alternative to Sky Sports, BT Sport, and other paid Premier League 
                    streaming services. Get the same quality without the subscription fees.
                  </p>
                </div>
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

export default WatchPremierLeague;
