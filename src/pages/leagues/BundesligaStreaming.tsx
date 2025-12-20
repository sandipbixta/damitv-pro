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
    question: "Where can I watch Bundesliga matches for free?",
    answer: "DamiTV offers free Bundesliga streaming with HD quality. Watch Bayern Munich, Borussia Dortmund, RB Leipzig, and all German football matches live without any subscription."
  },
  {
    question: "What time do Bundesliga matches start?",
    answer: "Bundesliga matches typically kick off on Saturdays at 3:30 PM CET, with Topspiele (top matches) at 6:30 PM CET. Sunday fixtures are at 3:30 PM, 5:30 PM, or 7:30 PM CET."
  },
  {
    question: "Can I watch Der Klassiker live for free?",
    answer: "Yes! DamiTV provides free streaming of Der Klassiker (Bayern Munich vs Borussia Dortmund) and all major Bundesliga fixtures."
  },
  {
    question: "Is Bundesliga streaming available worldwide?",
    answer: "DamiTV is accessible globally. Watch Bundesliga from anywhere in the world with just an internet connection and a web browser."
  }
];

const BundesligaStreaming = () => {
  return (
    <PageLayout>
      <Helmet>
        <title>Watch Bundesliga Live Free | German Football Streaming | DamiTV</title>
        <meta name="description" content="Stream Bundesliga matches live for free. Watch Bayern Munich, Borussia Dortmund, RB Leipzig and all German football. HD quality, no registration required." />
        <meta name="keywords" content="bundesliga streaming, watch bundesliga free, bayern munich live, dortmund live stream, german football free, der klassiker stream" />
        <link rel="canonical" href="https://damitv.pro/bundesliga-streaming" />
        <meta property="og:title" content="Watch Bundesliga Live Free | German Football Streaming" />
        <meta property="og:description" content="Stream Bundesliga matches live for free. Watch Bayern Munich, Borussia Dortmund and all German football." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://damitv.pro/bundesliga-streaming" />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative py-16 md:py-24 bg-gradient-to-br from-red-600/20 via-black/20 to-background">
          <div className="container mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 bg-red-500/20 text-red-400 px-4 py-2 rounded-full mb-6">
              <Trophy className="w-4 h-4" />
              <span className="text-sm font-medium">Bundesliga - German Football League</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              Watch Bundesliga <span className="text-red-500">Live Free</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Stream all Bundesliga matches in HD quality. Bayern Munich, Borussia Dortmund, RB Leipzig, and every German club. No registration needed.
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

        {/* League Info */}
        <section className="py-16 bg-card/50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">About Bundesliga</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <Globe className="w-10 h-10 text-red-500 mx-auto mb-4" />
                <h3 className="font-bold text-foreground mb-2">Highest Attendance</h3>
                <p className="text-muted-foreground text-sm">World's highest average stadium attendance in football</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <Trophy className="w-10 h-10 text-red-500 mx-auto mb-4" />
                <h3 className="font-bold text-foreground mb-2">18 Teams</h3>
                <p className="text-muted-foreground text-sm">Top German clubs competing for the Meisterschale</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <Calendar className="w-10 h-10 text-red-500 mx-auto mb-4" />
                <h3 className="font-bold text-foreground mb-2">34 Matchdays</h3>
                <p className="text-muted-foreground text-sm">Full season from August to May with 306 matches</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <Star className="w-10 h-10 text-red-500 mx-auto mb-4" />
                <h3 className="font-bold text-foreground mb-2">50+1 Rule</h3>
                <p className="text-muted-foreground text-sm">Fan-owned clubs ensuring supporter involvement</p>
              </div>
            </div>
          </div>
        </section>

        {/* Top Clubs */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">Top Bundesliga Clubs</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {[
                { name: 'Bayern Munich', titles: '33 league titles', color: 'bg-red-600/10' },
                { name: 'Borussia Dortmund', titles: '8 league titles', color: 'bg-yellow-500/10' },
                { name: 'Borussia M\'gladbach', titles: '5 league titles', color: 'bg-green-500/10' },
                { name: 'Werder Bremen', titles: '4 league titles', color: 'bg-green-600/10' },
                { name: 'Hamburg SV', titles: '6 league titles', color: 'bg-blue-600/10' },
                { name: 'RB Leipzig', titles: '0 league titles', color: 'bg-red-500/10' },
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
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">How to Watch Bundesliga on DamiTV</h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-red-500">1</span>
                </div>
                <h3 className="font-bold text-foreground mb-2">Visit DamiTV</h3>
                <p className="text-muted-foreground text-sm">Go to damitv.pro and check our live section</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-red-500">2</span>
                </div>
                <h3 className="font-bold text-foreground mb-2">Select Match</h3>
                <p className="text-muted-foreground text-sm">Find the Bundesliga match you want to watch</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-red-500">3</span>
                </div>
                <h3 className="font-bold text-foreground mb-2">Enjoy Live</h3>
                <p className="text-muted-foreground text-sm">Click play and watch in HD quality</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-r from-red-600/20 to-black/20">
          <div className="container mx-auto px-4 text-center">
            <Tv className="w-16 h-16 text-red-500 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-foreground mb-4">Ready to Watch Bundesliga?</h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Experience German football at its finest. Stream every Bundesliga match live with DamiTV.
            </p>
            <Button asChild size="lg" className="bg-red-600 hover:bg-red-700">
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

export default BundesligaStreaming;
