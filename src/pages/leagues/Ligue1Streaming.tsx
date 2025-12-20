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
    question: "Where can I watch Ligue 1 matches for free?",
    answer: "DamiTV offers free Ligue 1 streaming with HD quality. Watch PSG, Marseille, Lyon, Monaco and all French football matches live without any subscription."
  },
  {
    question: "What time do Ligue 1 matches start?",
    answer: "Ligue 1 matches are typically scheduled at 3:00 PM, 5:00 PM, and 9:00 PM CET on Saturdays, with Sunday fixtures at 1:00 PM, 3:00 PM, 5:05 PM, and 8:45 PM."
  },
  {
    question: "Can I watch Le Classique live for free?",
    answer: "Yes! DamiTV provides free streaming of Le Classique (PSG vs Marseille) and all major Ligue 1 fixtures including Derby du Rhône."
  },
  {
    question: "Is Ligue 1 streaming available globally?",
    answer: "DamiTV is accessible worldwide. Watch Ligue 1 from any country with an internet connection."
  }
];

const Ligue1Streaming = () => {
  return (
    <PageLayout>
      <Helmet>
        <title>Watch Ligue 1 Live Free | French Football Streaming | DamiTV</title>
        <meta name="description" content="Stream Ligue 1 matches live for free. Watch PSG, Marseille, Lyon, Monaco and all French football. HD quality, no registration required." />
        <meta name="keywords" content="ligue 1 streaming, watch ligue 1 free, psg live, marseille live stream, french football free, monaco stream" />
        <link rel="canonical" href="https://damitv.pro/ligue-1-streaming" />
        <meta property="og:title" content="Watch Ligue 1 Live Free | French Football Streaming" />
        <meta property="og:description" content="Stream Ligue 1 matches live for free. Watch PSG, Marseille, Lyon and all French football." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://damitv.pro/ligue-1-streaming" />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative py-16 md:py-24 bg-gradient-to-br from-blue-600/20 via-white/10 to-red-600/20">
          <div className="container mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-400 px-4 py-2 rounded-full mb-6">
              <Trophy className="w-4 h-4" />
              <span className="text-sm font-medium">Ligue 1 - French Football League</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              Watch Ligue 1 <span className="text-blue-500">Live Free</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Stream all Ligue 1 matches in HD quality. Paris Saint-Germain, Marseille, Lyon, Monaco, and every French club. No registration needed.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
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
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">About Ligue 1</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <Globe className="w-10 h-10 text-blue-500 mx-auto mb-4" />
                <h3 className="font-bold text-foreground mb-2">Top 5 League</h3>
                <p className="text-muted-foreground text-sm">One of Europe's elite top five leagues</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <Trophy className="w-10 h-10 text-blue-500 mx-auto mb-4" />
                <h3 className="font-bold text-foreground mb-2">18 Teams</h3>
                <p className="text-muted-foreground text-sm">Top French clubs competing for the title</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <Calendar className="w-10 h-10 text-blue-500 mx-auto mb-4" />
                <h3 className="font-bold text-foreground mb-2">34 Matchdays</h3>
                <p className="text-muted-foreground text-sm">Full season from August to May</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <Star className="w-10 h-10 text-blue-500 mx-auto mb-4" />
                <h3 className="font-bold text-foreground mb-2">Young Talent</h3>
                <p className="text-muted-foreground text-sm">Known for developing world-class players</p>
              </div>
            </div>
          </div>
        </section>

        {/* Top Clubs */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">Top Ligue 1 Clubs</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {[
                { name: 'Paris Saint-Germain', titles: '11 league titles', color: 'bg-blue-700/10' },
                { name: 'AS Monaco', titles: '8 league titles', color: 'bg-red-500/10' },
                { name: 'Olympique Marseille', titles: '9 league titles', color: 'bg-sky-400/10' },
                { name: 'Olympique Lyon', titles: '7 league titles', color: 'bg-blue-500/10' },
                { name: 'AS Saint-Étienne', titles: '10 league titles', color: 'bg-green-600/10' },
                { name: 'FC Nantes', titles: '8 league titles', color: 'bg-yellow-400/10' },
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
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">How to Watch Ligue 1 on DamiTV</h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-blue-500">1</span>
                </div>
                <h3 className="font-bold text-foreground mb-2">Go to DamiTV</h3>
                <p className="text-muted-foreground text-sm">Visit damitv.pro in your browser</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-blue-500">2</span>
                </div>
                <h3 className="font-bold text-foreground mb-2">Find Your Match</h3>
                <p className="text-muted-foreground text-sm">Browse Ligue 1 fixtures in live section</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-blue-500">3</span>
                </div>
                <h3 className="font-bold text-foreground mb-2">Enjoy Streaming</h3>
                <p className="text-muted-foreground text-sm">Watch French football in HD quality</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-r from-blue-600/20 to-red-600/20">
          <div className="container mx-auto px-4 text-center">
            <Tv className="w-16 h-16 text-blue-500 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-foreground mb-4">Ready to Watch Ligue 1?</h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Experience French football at its best. Stream every Ligue 1 match live with DamiTV.
            </p>
            <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
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

export default Ligue1Streaming;
