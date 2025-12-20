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
    question: "Where can I watch NFL games for free?",
    answer: "DamiTV offers free NFL streaming with HD quality. Watch every regular season game, playoffs, and Super Bowl live without any subscription required."
  },
  {
    question: "What time do NFL games start?",
    answer: "NFL games typically kick off at 1:00 PM ET and 4:25 PM ET on Sundays, with Sunday Night Football at 8:20 PM ET and Monday Night Football at 8:15 PM ET."
  },
  {
    question: "Can I watch the Super Bowl for free?",
    answer: "Yes! DamiTV provides free streaming of the Super Bowl and all NFL playoff games including conference championships."
  },
  {
    question: "Is NFL streaming available on mobile?",
    answer: "Absolutely! DamiTV works on all devices. Watch NFL on your smartphone, tablet, or any device with a web browser."
  }
];

const NFLStreaming = () => {
  return (
    <PageLayout>
      <Helmet>
        <title>Watch NFL Live Free | American Football Streaming | DamiTV</title>
        <meta name="description" content="Stream NFL games live for free. Watch every NFL regular season, playoffs, and Super Bowl. HD quality, no registration required." />
        <meta name="keywords" content="nfl streaming, watch nfl free, nfl live stream, super bowl stream, american football free, monday night football" />
        <link rel="canonical" href="https://damitv.pro/nfl-streaming" />
        <meta property="og:title" content="Watch NFL Live Free | American Football Streaming" />
        <meta property="og:description" content="Stream NFL games live for free. Watch every game including Super Bowl." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://damitv.pro/nfl-streaming" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <section className="relative py-16 md:py-24 bg-gradient-to-br from-blue-900/30 via-red-600/20 to-background">
          <div className="container mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-400 px-4 py-2 rounded-full mb-6">
              <Trophy className="w-4 h-4" />
              <span className="text-sm font-medium">NFL - National Football League</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              Watch NFL <span className="text-blue-500">Live Free</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Stream every NFL game in HD quality. Regular season, playoffs, and Super Bowl. No registration, no subscription needed.
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
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">About the NFL</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <Globe className="w-10 h-10 text-blue-500 mx-auto mb-4" />
                <h3 className="font-bold text-foreground mb-2">Most Popular Sport</h3>
                <p className="text-muted-foreground text-sm">America's #1 watched sport with billions of fans</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <Trophy className="w-10 h-10 text-blue-500 mx-auto mb-4" />
                <h3 className="font-bold text-foreground mb-2">32 Teams</h3>
                <p className="text-muted-foreground text-sm">AFC and NFC conferences competing for glory</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <Calendar className="w-10 h-10 text-blue-500 mx-auto mb-4" />
                <h3 className="font-bold text-foreground mb-2">18-Week Season</h3>
                <p className="text-muted-foreground text-sm">September to February including playoffs</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <Star className="w-10 h-10 text-blue-500 mx-auto mb-4" />
                <h3 className="font-bold text-foreground mb-2">Super Bowl</h3>
                <p className="text-muted-foreground text-sm">World's most watched annual sporting event</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">Top NFL Teams</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {[
                { name: 'Kansas City Chiefs', titles: '4 Super Bowl wins', color: 'bg-red-600/10' },
                { name: 'New England Patriots', titles: '6 Super Bowl wins', color: 'bg-blue-900/10' },
                { name: 'Dallas Cowboys', titles: '5 Super Bowl wins', color: 'bg-blue-600/10' },
                { name: 'San Francisco 49ers', titles: '5 Super Bowl wins', color: 'bg-red-700/10' },
                { name: 'Green Bay Packers', titles: '4 Super Bowl wins', color: 'bg-green-600/10' },
                { name: 'Pittsburgh Steelers', titles: '6 Super Bowl wins', color: 'bg-yellow-500/10' },
              ].map((team) => (
                <div key={team.name} className={`${team.color} border border-border rounded-xl p-6`}>
                  <h3 className="font-bold text-foreground text-lg mb-2">{team.name}</h3>
                  <p className="text-muted-foreground text-sm">{team.titles}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 bg-gradient-to-r from-blue-900/20 to-red-600/20">
          <div className="container mx-auto px-4 text-center">
            <Tv className="w-16 h-16 text-blue-500 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-foreground mb-4">Ready for NFL Action?</h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Don't miss any NFL action. Stream every game live with DamiTV - completely free.
            </p>
            <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
              <Link to="/live"><Play className="w-5 h-5 mr-2" /> Start Watching Now</Link>
            </Button>
          </div>
        </section>

        <FAQSection faqs={faqs} />
        <InternalLinks links={[
          { text: 'NBA Streaming Free', url: '/nba-streaming-free', description: 'Watch NBA games live' },
          { text: 'MLB Streaming', url: '/mlb-streaming', description: 'Stream baseball games' },
          { text: 'All Live Sports', url: '/live', description: 'Browse all live matches' },
        ]} />
      </div>
    </PageLayout>
  );
};

export default NFLStreaming;
