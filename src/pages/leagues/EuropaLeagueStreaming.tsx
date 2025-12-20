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
    question: "Where can I watch Europa League matches for free?",
    answer: "DamiTV offers free UEFA Europa League streaming with HD quality. Watch every group stage, knockout round, and final match live without subscription."
  },
  {
    question: "What time do Europa League matches start?",
    answer: "UEFA Europa League matches typically kick off at 6:45 PM and 9:00 PM CET on Thursdays during the group and knockout stages."
  },
  {
    question: "Can I watch the Europa League Final for free?",
    answer: "Yes! DamiTV provides free streaming of the Europa League Final and all major UEL fixtures including semi-finals."
  },
  {
    question: "What's the difference between Europa League and Conference League?",
    answer: "Europa League is UEFA's second-tier competition featuring stronger clubs, while Conference League is the third tier designed for smaller nations' clubs."
  }
];

const EuropaLeagueStreaming = () => {
  return (
    <PageLayout>
      <Helmet>
        <title>Watch UEFA Europa League Live Free | UEL Streaming | DamiTV</title>
        <meta name="description" content="Stream UEFA Europa League matches live for free. Watch UEL group stage, knockouts, and finals. HD quality, no registration required." />
        <meta name="keywords" content="europa league streaming, watch uel free, uefa europa league live, uel final stream, europa league free" />
        <link rel="canonical" href="https://damitv.pro/europa-league-streaming" />
        <meta property="og:title" content="Watch UEFA Europa League Live Free | UEL Streaming" />
        <meta property="og:description" content="Stream UEFA Europa League matches live for free. Watch every UEL match in HD quality." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://damitv.pro/europa-league-streaming" />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative py-16 md:py-24 bg-gradient-to-br from-orange-600/20 via-yellow-500/20 to-background">
          <div className="container mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 bg-orange-500/20 text-orange-400 px-4 py-2 rounded-full mb-6">
              <Trophy className="w-4 h-4" />
              <span className="text-sm font-medium">UEFA Europa League</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              Watch Europa League <span className="text-orange-500">Live Free</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Stream every UEFA Europa League match in HD quality. From group stage to the final - Europe's exciting second-tier competition. No registration needed.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild size="lg" className="bg-orange-600 hover:bg-orange-700">
                <Link to="/live"><Play className="w-5 h-5 mr-2" /> Watch Live Now</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/schedule"><Calendar className="w-5 h-5 mr-2" /> View Schedule</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Tournament Info */}
        <section className="py-16 bg-card/50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">About Europa League</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <Globe className="w-10 h-10 text-orange-500 mx-auto mb-4" />
                <h3 className="font-bold text-foreground mb-2">Pan-European</h3>
                <p className="text-muted-foreground text-sm">Teams from across Europe competing</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <Trophy className="w-10 h-10 text-orange-500 mx-auto mb-4" />
                <h3 className="font-bold text-foreground mb-2">36 Teams</h3>
                <p className="text-muted-foreground text-sm">Competitive clubs from 20+ nations</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <Calendar className="w-10 h-10 text-orange-500 mx-auto mb-4" />
                <h3 className="font-bold text-foreground mb-2">Thursday Nights</h3>
                <p className="text-muted-foreground text-sm">Exciting midweek European action</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <Star className="w-10 h-10 text-orange-500 mx-auto mb-4" />
                <h3 className="font-bold text-foreground mb-2">UCL Pathway</h3>
                <p className="text-muted-foreground text-sm">Winner qualifies for Champions League</p>
              </div>
            </div>
          </div>
        </section>

        {/* Most Successful Clubs */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">Most Successful UEL Clubs</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {[
                { name: 'Sevilla', titles: '7 UEL titles', color: 'bg-red-600/10' },
                { name: 'Inter Milan', titles: '3 UEL titles', color: 'bg-blue-600/10' },
                { name: 'Atletico Madrid', titles: '3 UEL titles', color: 'bg-red-700/10' },
                { name: 'Juventus', titles: '3 UEL titles', color: 'bg-white/10' },
                { name: 'Liverpool', titles: '3 UEL titles', color: 'bg-red-500/10' },
                { name: 'Chelsea', titles: '2 UEL titles', color: 'bg-blue-700/10' },
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
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">How to Watch Europa League</h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-orange-500">1</span>
                </div>
                <h3 className="font-bold text-foreground mb-2">Visit DamiTV</h3>
                <p className="text-muted-foreground text-sm">Navigate to damitv.pro on any device</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-orange-500">2</span>
                </div>
                <h3 className="font-bold text-foreground mb-2">Find Match</h3>
                <p className="text-muted-foreground text-sm">Browse Europa League fixtures</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-orange-500">3</span>
                </div>
                <h3 className="font-bold text-foreground mb-2">Stream Live</h3>
                <p className="text-muted-foreground text-sm">Enjoy free HD streaming</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-r from-orange-600/20 to-yellow-500/20">
          <div className="container mx-auto px-4 text-center">
            <Tv className="w-16 h-16 text-orange-500 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-foreground mb-4">Ready for Europa League Action?</h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Experience Thursday night football at its finest. Stream every match live with DamiTV.
            </p>
            <Button asChild size="lg" className="bg-orange-600 hover:bg-orange-700">
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

export default EuropaLeagueStreaming;
