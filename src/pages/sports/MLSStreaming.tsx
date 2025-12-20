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
    question: "Where can I watch MLS games for free?",
    answer: "DamiTV offers free MLS streaming with HD quality. Watch every regular season game, playoffs, and MLS Cup live without subscription."
  },
  {
    question: "What time do MLS games start?",
    answer: "MLS games typically kick off at 7:30 PM or 8:00 PM local time on weekdays, with weekend games at various times starting from 1:00 PM ET."
  },
  {
    question: "Can I watch the MLS Cup for free?",
    answer: "Yes! DamiTV provides free streaming of the MLS Cup Final and all playoff games."
  },
  {
    question: "Is MLS streaming available internationally?",
    answer: "DamiTV is accessible worldwide. Watch MLS from any country with an internet connection."
  }
];

const MLSStreaming = () => {
  return (
    <PageLayout>
      <Helmet>
        <title>Watch MLS Live Free | Soccer Streaming | DamiTV</title>
        <meta name="description" content="Stream MLS games live for free. Watch every Major League Soccer game, playoffs, and MLS Cup. HD quality, no registration required." />
        <meta name="keywords" content="mls streaming, watch mls free, soccer live stream, mls cup stream, american soccer free" />
        <link rel="canonical" href="https://damitv.pro/mls-streaming" />
        <meta property="og:title" content="Watch MLS Live Free | Soccer Streaming" />
        <meta property="og:description" content="Stream MLS games live for free including MLS Cup." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://damitv.pro/mls-streaming" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <section className="relative py-16 md:py-24 bg-gradient-to-br from-blue-600/20 via-red-500/20 to-background">
          <div className="container mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-400 px-4 py-2 rounded-full mb-6">
              <Trophy className="w-4 h-4" />
              <span className="text-sm font-medium">MLS - Major League Soccer</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              Watch MLS <span className="text-blue-500">Live Free</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Stream every MLS game in HD quality. Regular season, playoffs, and MLS Cup. American soccer at its best, completely free.
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

        <section className="py-16 bg-card/50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">About MLS</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <Globe className="w-10 h-10 text-blue-500 mx-auto mb-4" />
                <h3 className="font-bold text-foreground mb-2">Growing League</h3>
                <p className="text-muted-foreground text-sm">Fastest growing sports league in North America</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <Trophy className="w-10 h-10 text-blue-500 mx-auto mb-4" />
                <h3 className="font-bold text-foreground mb-2">29 Teams</h3>
                <p className="text-muted-foreground text-sm">US and Canada clubs competing</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <Calendar className="w-10 h-10 text-blue-500 mx-auto mb-4" />
                <h3 className="font-bold text-foreground mb-2">34-Game Season</h3>
                <p className="text-muted-foreground text-sm">February to December schedule</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <Star className="w-10 h-10 text-blue-500 mx-auto mb-4" />
                <h3 className="font-bold text-foreground mb-2">World Stars</h3>
                <p className="text-muted-foreground text-sm">Home to international superstars</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">Top MLS Teams</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {[
                { name: 'LA Galaxy', titles: '5 MLS Cups', color: 'bg-blue-600/10' },
                { name: 'D.C. United', titles: '4 MLS Cups', color: 'bg-red-600/10' },
                { name: 'Seattle Sounders', titles: '2 MLS Cups', color: 'bg-green-600/10' },
                { name: 'Columbus Crew', titles: '3 MLS Cups', color: 'bg-yellow-500/10' },
                { name: 'LAFC', titles: '1 MLS Cup', color: 'bg-black/10' },
                { name: 'Inter Miami', titles: '0 MLS Cups', color: 'bg-pink-500/10' },
              ].map((team) => (
                <div key={team.name} className={`${team.color} border border-border rounded-xl p-6`}>
                  <h3 className="font-bold text-foreground text-lg mb-2">{team.name}</h3>
                  <p className="text-muted-foreground text-sm">{team.titles}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 bg-gradient-to-r from-blue-600/20 to-red-500/20">
          <div className="container mx-auto px-4 text-center">
            <Tv className="w-16 h-16 text-blue-500 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-foreground mb-4">Ready for MLS Action?</h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Experience American soccer. Stream every MLS game live with DamiTV.
            </p>
            <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
              <Link to="/live"><Play className="w-5 h-5 mr-2" /> Start Watching Now</Link>
            </Button>
          </div>
        </section>

        <FAQSection faqs={faqs} />
        <InternalLinks links={[
          { text: 'Watch Premier League Free', url: '/watch-premier-league-free', description: 'Stream English Premier League' },
          { text: 'La Liga Streaming', url: '/la-liga-streaming', description: 'Watch Spanish football' },
          { text: 'All Live Sports', url: '/live', description: 'Browse all live matches' },
        ]} />
      </div>
    </PageLayout>
  );
};

export default MLSStreaming;
