import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Play, Calendar, Trophy, Star, Tv, Globe } from 'lucide-react';
import FAQSection from '@/components/FAQSection';
import InternalLinks from '@/components/InternalLinks';
import PageLayout from '@/components/PageLayout';

const faqs = [
  {
    question: "Where can I watch boxing fights for free?",
    answer: "DamiTV offers free boxing streaming with HD quality. Watch major title fights, undercards, and championship bouts live without pay-per-view fees."
  },
  {
    question: "What time do boxing fights start?",
    answer: "Main event boxing fights typically start between 10:00 PM and 12:00 AM ET on Saturday nights, with undercards beginning around 6:00 PM ET."
  },
  {
    question: "Can I watch PPV boxing fights for free?",
    answer: "Yes! DamiTV provides free streaming of major boxing events including championship fights that are usually pay-per-view."
  },
  {
    question: "Is boxing streaming available worldwide?",
    answer: "DamiTV is accessible globally. Watch boxing from any country with an internet connection."
  }
];

const BoxingStreaming = () => {
  return (
    <PageLayout>
      <Helmet>
        <title>Watch Boxing Live Free | Fight Streaming | DamiTV</title>
        <meta name="description" content="Stream boxing fights live for free. Watch championship bouts, title fights, and undercards. HD quality, no PPV fees required." />
        <meta name="keywords" content="boxing streaming, watch boxing free, boxing live stream, ppv boxing free, fight stream" />
        <link rel="canonical" href="https://damitv.pro/boxing-streaming" />
        <meta property="og:title" content="Watch Boxing Live Free | Fight Streaming" />
        <meta property="og:description" content="Stream boxing fights live for free including title fights." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://damitv.pro/boxing-streaming" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <section className="relative py-16 md:py-24 bg-gradient-to-br from-red-600/20 via-yellow-500/20 to-background">
          <div className="container mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 bg-red-500/20 text-red-400 px-4 py-2 rounded-full mb-6">
              <Trophy className="w-4 h-4" />
              <span className="text-sm font-medium">Professional Boxing</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              Watch Boxing <span className="text-red-500">Live Free</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Stream every major boxing fight in HD quality. Championship bouts, title fights, and undercards. No PPV fees, completely free.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild size="lg" className="bg-red-600 hover:bg-red-700">
                <Link to="/live"><Play className="w-5 h-5 mr-2" /> Watch Live Now</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/schedule"><Calendar className="w-5 h-5 mr-2" /> View Schedule</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="py-16 bg-card/50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">Boxing on DamiTV</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <Globe className="w-10 h-10 text-red-500 mx-auto mb-4" />
                <h3 className="font-bold text-foreground mb-2">Global Events</h3>
                <p className="text-muted-foreground text-sm">Major fights from Las Vegas to London</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <Trophy className="w-10 h-10 text-red-500 mx-auto mb-4" />
                <h3 className="font-bold text-foreground mb-2">All Weight Classes</h3>
                <p className="text-muted-foreground text-sm">Heavyweight to flyweight championship bouts</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <Calendar className="w-10 h-10 text-red-500 mx-auto mb-4" />
                <h3 className="font-bold text-foreground mb-2">Year-Round Action</h3>
                <p className="text-muted-foreground text-sm">Major fights every month</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <Star className="w-10 h-10 text-red-500 mx-auto mb-4" />
                <h3 className="font-bold text-foreground mb-2">No PPV Fees</h3>
                <p className="text-muted-foreground text-sm">Watch premium fights for free</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">Boxing Organizations</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {[
                { name: 'WBC', desc: 'World Boxing Council', color: 'bg-green-600/10' },
                { name: 'WBA', desc: 'World Boxing Association', color: 'bg-blue-600/10' },
                { name: 'IBF', desc: 'International Boxing Federation', color: 'bg-red-600/10' },
                { name: 'WBO', desc: 'World Boxing Organization', color: 'bg-yellow-500/10' },
              ].map((org) => (
                <div key={org.name} className={`${org.color} border border-border rounded-xl p-6 text-center`}>
                  <h3 className="font-bold text-foreground text-xl mb-2">{org.name}</h3>
                  <p className="text-muted-foreground text-sm">{org.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 bg-gradient-to-r from-red-600/20 to-yellow-500/20">
          <div className="container mx-auto px-4 text-center">
            <Tv className="w-16 h-16 text-red-500 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-foreground mb-4">Ready for Fight Night?</h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Watch every major boxing event live. No PPV fees with DamiTV.
            </p>
            <Button asChild size="lg" className="bg-red-600 hover:bg-red-700">
              <Link to="/live"><Play className="w-5 h-5 mr-2" /> Start Watching Now</Link>
            </Button>
          </div>
        </section>

        <FAQSection faqs={faqs} />
        <InternalLinks links={[
          { text: 'UFC Streaming Free', url: '/ufc-streaming-free', description: 'Watch UFC fights live' },
          { text: 'WWE Streaming', url: '/wwe-streaming', description: 'Stream wrestling events' },
          { text: 'All Live Sports', url: '/live', description: 'Browse all live matches' },
        ]} />
      </div>
    </PageLayout>
  );
};

export default BoxingStreaming;
