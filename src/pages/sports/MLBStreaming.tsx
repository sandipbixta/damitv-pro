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
    question: "Where can I watch MLB games for free?",
    answer: "DamiTV offers free MLB streaming with HD quality. Watch every regular season game, playoffs, and World Series live without subscription."
  },
  {
    question: "What time do MLB games start?",
    answer: "MLB games typically start at 7:00 PM local time on weekdays, with afternoon games on weekends at 1:00 PM or 4:00 PM ET."
  },
  {
    question: "Can I watch the World Series for free?",
    answer: "Yes! DamiTV provides free streaming of the World Series and all MLB playoff games including ALCS and NLCS."
  },
  {
    question: "Is MLB streaming available worldwide?",
    answer: "DamiTV is accessible globally. Watch MLB from anywhere in the world with just an internet connection."
  }
];

const MLBStreaming = () => {
  return (
    <PageLayout>
      <Helmet>
        <title>Watch MLB Live Free | Baseball Streaming | DamiTV</title>
        <meta name="description" content="Stream MLB games live for free. Watch every baseball game, playoffs, and World Series. HD quality, no registration required." />
        <meta name="keywords" content="mlb streaming, watch mlb free, baseball live stream, world series stream, baseball free" />
        <link rel="canonical" href="https://damitv.pro/mlb-streaming" />
        <meta property="og:title" content="Watch MLB Live Free | Baseball Streaming" />
        <meta property="og:description" content="Stream MLB games live for free including World Series." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://damitv.pro/mlb-streaming" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <section className="relative py-16 md:py-24 bg-gradient-to-br from-red-600/20 via-blue-600/20 to-background">
          <div className="container mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 bg-red-500/20 text-red-400 px-4 py-2 rounded-full mb-6">
              <Trophy className="w-4 h-4" />
              <span className="text-sm font-medium">MLB - Major League Baseball</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              Watch MLB <span className="text-red-500">Live Free</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Stream every MLB game in HD quality. Regular season, playoffs, and World Series. America's pastime, completely free.
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
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">About MLB</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <Globe className="w-10 h-10 text-red-500 mx-auto mb-4" />
                <h3 className="font-bold text-foreground mb-2">America's Pastime</h3>
                <p className="text-muted-foreground text-sm">Over 150 years of baseball history</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <Trophy className="w-10 h-10 text-red-500 mx-auto mb-4" />
                <h3 className="font-bold text-foreground mb-2">30 Teams</h3>
                <p className="text-muted-foreground text-sm">American and National League competition</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <Calendar className="w-10 h-10 text-red-500 mx-auto mb-4" />
                <h3 className="font-bold text-foreground mb-2">162-Game Season</h3>
                <p className="text-muted-foreground text-sm">April to October baseball action</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <Star className="w-10 h-10 text-red-500 mx-auto mb-4" />
                <h3 className="font-bold text-foreground mb-2">World Series</h3>
                <p className="text-muted-foreground text-sm">Championship tradition since 1903</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">Top MLB Teams</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {[
                { name: 'New York Yankees', titles: '27 World Series', color: 'bg-blue-900/10' },
                { name: 'St. Louis Cardinals', titles: '11 World Series', color: 'bg-red-600/10' },
                { name: 'Boston Red Sox', titles: '9 World Series', color: 'bg-red-700/10' },
                { name: 'Los Angeles Dodgers', titles: '7 World Series', color: 'bg-blue-600/10' },
                { name: 'San Francisco Giants', titles: '8 World Series', color: 'bg-orange-500/10' },
                { name: 'Oakland Athletics', titles: '9 World Series', color: 'bg-green-600/10' },
              ].map((team) => (
                <div key={team.name} className={`${team.color} border border-border rounded-xl p-6`}>
                  <h3 className="font-bold text-foreground text-lg mb-2">{team.name}</h3>
                  <p className="text-muted-foreground text-sm">{team.titles}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 bg-gradient-to-r from-red-600/20 to-blue-600/20">
          <div className="container mx-auto px-4 text-center">
            <Tv className="w-16 h-16 text-red-500 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-foreground mb-4">Ready for MLB Action?</h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Experience America's pastime. Stream every MLB game live with DamiTV.
            </p>
            <Button asChild size="lg" className="bg-red-600 hover:bg-red-700">
              <Link to="/live"><Play className="w-5 h-5 mr-2" /> Start Watching Now</Link>
            </Button>
          </div>
        </section>

        <FAQSection faqs={faqs} />
        <InternalLinks links={[
          { text: 'NFL Streaming', url: '/nfl-streaming', description: 'Watch NFL games live' },
          { text: 'NBA Streaming Free', url: '/nba-streaming-free', description: 'Stream NBA games' },
          { text: 'All Live Sports', url: '/live', description: 'Browse all live matches' },
        ]} />
      </div>
    </PageLayout>
  );
};

export default MLBStreaming;
