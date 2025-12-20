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
    question: "Where can I watch La Liga matches for free?",
    answer: "DamiTV offers free La Liga streaming with HD quality. Watch Real Madrid, Barcelona, Atletico Madrid, and all Spanish football matches live without any subscription required."
  },
  {
    question: "What time do La Liga matches start?",
    answer: "La Liga matches typically start between 1:00 PM and 9:00 PM CET (Central European Time). Weekend fixtures are spread throughout Saturday and Sunday for maximum viewing convenience."
  },
  {
    question: "Can I watch El Clasico live for free?",
    answer: "Yes! DamiTV provides free streaming of El Clasico (Real Madrid vs Barcelona) and all major La Liga fixtures. Simply visit our live section when the match starts."
  },
  {
    question: "Is La Liga streaming available on mobile?",
    answer: "Absolutely! DamiTV is fully optimized for mobile devices. Watch La Liga on your smartphone, tablet, or any device with a web browser."
  }
];

const LaLigaStreaming = () => {
  return (
    <PageLayout>
      <Helmet>
        <title>Watch La Liga Live Free | Spanish Football Streaming | DamiTV</title>
        <meta name="description" content="Stream La Liga matches live for free. Watch Real Madrid, Barcelona, Atletico Madrid and all Spanish football. HD quality, no registration required." />
        <meta name="keywords" content="la liga streaming, watch la liga free, real madrid live, barcelona live stream, spanish football free, el clasico stream" />
        <link rel="canonical" href="https://damitv.pro/la-liga-streaming" />
        <meta property="og:title" content="Watch La Liga Live Free | Spanish Football Streaming" />
        <meta property="og:description" content="Stream La Liga matches live for free. Watch Real Madrid, Barcelona, Atletico Madrid and all Spanish football." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://damitv.pro/la-liga-streaming" />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative py-16 md:py-24 bg-gradient-to-br from-yellow-600/20 via-red-600/20 to-background">
          <div className="container mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 bg-yellow-500/20 text-yellow-400 px-4 py-2 rounded-full mb-6">
              <Trophy className="w-4 h-4" />
              <span className="text-sm font-medium">La Liga - Spanish Primera División</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              Watch La Liga <span className="text-yellow-500">Live Free</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Stream all La Liga matches in HD quality. Real Madrid, Barcelona, Atletico Madrid, and every Spanish football club. No registration, no subscription.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild size="lg" className="bg-yellow-600 hover:bg-yellow-700">
                <Link to="/live"><Play className="w-5 h-5 mr-2" /> Watch Live Now</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/schedule"><Calendar className="w-5 h-5 mr-2" /> View Schedule</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* League Info */}
        <section className="py-16 bg-card/50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">About La Liga</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <Globe className="w-10 h-10 text-yellow-500 mx-auto mb-4" />
                <h3 className="font-bold text-foreground mb-2">Global Reach</h3>
                <p className="text-muted-foreground text-sm">Broadcast in 180+ countries with billions of viewers worldwide</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <Trophy className="w-10 h-10 text-yellow-500 mx-auto mb-4" />
                <h3 className="font-bold text-foreground mb-2">20 Elite Clubs</h3>
                <p className="text-muted-foreground text-sm">Including Real Madrid, Barcelona, and Atletico Madrid</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <Calendar className="w-10 h-10 text-yellow-500 mx-auto mb-4" />
                <h3 className="font-bold text-foreground mb-2">38 Matchdays</h3>
                <p className="text-muted-foreground text-sm">Full season from August to May with 380 matches</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <Star className="w-10 h-10 text-yellow-500 mx-auto mb-4" />
                <h3 className="font-bold text-foreground mb-2">World-Class Stars</h3>
                <p className="text-muted-foreground text-sm">Home to some of football's greatest talents</p>
              </div>
            </div>
          </div>
        </section>

        {/* Top Clubs */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">Top La Liga Clubs</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {[
                { name: 'Real Madrid', titles: '35 league titles', color: 'bg-white/10' },
                { name: 'Barcelona', titles: '27 league titles', color: 'bg-red-600/10' },
                { name: 'Atletico Madrid', titles: '11 league titles', color: 'bg-red-700/10' },
                { name: 'Athletic Bilbao', titles: '8 league titles', color: 'bg-red-500/10' },
                { name: 'Valencia', titles: '6 league titles', color: 'bg-orange-500/10' },
                { name: 'Real Sociedad', titles: '2 league titles', color: 'bg-blue-500/10' },
              ].map((club) => (
                <div key={club.name} className={`${club.color} border border-border rounded-xl p-6`}>
                  <h3 className="font-bold text-foreground text-lg mb-2">{club.name}</h3>
                  <p className="text-muted-foreground text-sm">{club.titles}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How to Watch */}
        <section className="py-16 bg-card/50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">How to Watch La Liga on DamiTV</h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="w-16 h-16 bg-yellow-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-yellow-500">1</span>
                </div>
                <h3 className="font-bold text-foreground mb-2">Visit DamiTV</h3>
                <p className="text-muted-foreground text-sm">Go to damitv.pro and browse the live or schedule sections</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-yellow-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-yellow-500">2</span>
                </div>
                <h3 className="font-bold text-foreground mb-2">Find Your Match</h3>
                <p className="text-muted-foreground text-sm">Select the La Liga match you want to watch</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-yellow-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-yellow-500">3</span>
                </div>
                <h3 className="font-bold text-foreground mb-2">Start Streaming</h3>
                <p className="text-muted-foreground text-sm">Click play and enjoy HD quality La Liga action</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-r from-yellow-600/20 to-red-600/20">
          <div className="container mx-auto px-4 text-center">
            <Tv className="w-16 h-16 text-yellow-500 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-foreground mb-4">Ready to Watch La Liga?</h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Don't miss any La Liga action. Stream every match live with DamiTV - completely free.
            </p>
            <Button asChild size="lg" className="bg-yellow-600 hover:bg-yellow-700">
              <Link to="/live"><Play className="w-5 h-5 mr-2" /> Start Watching Now</Link>
            </Button>
          </div>
        </section>

        <FAQSection faqs={faqs} />
        <InternalLinks links={[
          { text: 'Watch Premier League Free', url: '/watch-premier-league-free', description: 'Stream English Premier League' },
          { text: 'Champions League Streaming', url: '/champions-league-streaming', description: 'Watch UCL matches live' },
          { text: 'All Live Sports', url: '/live', description: 'Browse all live matches' },
        ]} />
      </div>
    </PageLayout>
  );
};

export default LaLigaStreaming;
