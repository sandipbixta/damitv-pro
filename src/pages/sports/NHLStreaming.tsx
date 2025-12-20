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
    question: "Where can I watch NHL games for free?",
    answer: "DamiTV offers free NHL streaming with HD quality. Watch every regular season game, playoffs, and Stanley Cup Finals live without subscription."
  },
  {
    question: "What time do NHL games start?",
    answer: "NHL games typically start at 7:00 PM or 7:30 PM local time, with some afternoon games on weekends at 1:00 PM or 3:00 PM ET."
  },
  {
    question: "Can I watch the Stanley Cup for free?",
    answer: "Yes! DamiTV provides free streaming of the Stanley Cup Finals and all NHL playoff games."
  },
  {
    question: "Is NHL streaming available internationally?",
    answer: "DamiTV is accessible worldwide. Watch NHL from any country with an internet connection."
  }
];

const NHLStreaming = () => {
  return (
    <PageLayout>
      <Helmet>
        <title>Watch NHL Live Free | Hockey Streaming | DamiTV</title>
        <meta name="description" content="Stream NHL games live for free. Watch every hockey game, playoffs, and Stanley Cup. HD quality, no registration required." />
        <meta name="keywords" content="nhl streaming, watch nhl free, hockey live stream, stanley cup stream, hockey free" />
        <link rel="canonical" href="https://damitv.pro/nhl-streaming" />
        <meta property="og:title" content="Watch NHL Live Free | Hockey Streaming" />
        <meta property="og:description" content="Stream NHL games live for free including Stanley Cup." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://damitv.pro/nhl-streaming" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <section className="relative py-16 md:py-24 bg-gradient-to-br from-blue-600/20 via-white/10 to-background">
          <div className="container mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-400 px-4 py-2 rounded-full mb-6">
              <Trophy className="w-4 h-4" />
              <span className="text-sm font-medium">NHL - National Hockey League</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              Watch NHL <span className="text-blue-400">Live Free</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Stream every NHL game in HD quality. Regular season, playoffs, and Stanley Cup. The fastest game on ice, completely free.
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
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">About the NHL</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <Globe className="w-10 h-10 text-blue-400 mx-auto mb-4" />
                <h3 className="font-bold text-foreground mb-2">Premier Hockey</h3>
                <p className="text-muted-foreground text-sm">World's top professional hockey league</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <Trophy className="w-10 h-10 text-blue-400 mx-auto mb-4" />
                <h3 className="font-bold text-foreground mb-2">32 Teams</h3>
                <p className="text-muted-foreground text-sm">US and Canada competing for the Cup</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <Calendar className="w-10 h-10 text-blue-400 mx-auto mb-4" />
                <h3 className="font-bold text-foreground mb-2">82-Game Season</h3>
                <p className="text-muted-foreground text-sm">October to June including playoffs</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <Star className="w-10 h-10 text-blue-400 mx-auto mb-4" />
                <h3 className="font-bold text-foreground mb-2">Stanley Cup</h3>
                <p className="text-muted-foreground text-sm">Oldest professional sports trophy</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">Top NHL Teams</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {[
                { name: 'Montreal Canadiens', titles: '24 Stanley Cups', color: 'bg-red-600/10' },
                { name: 'Toronto Maple Leafs', titles: '13 Stanley Cups', color: 'bg-blue-600/10' },
                { name: 'Detroit Red Wings', titles: '11 Stanley Cups', color: 'bg-red-700/10' },
                { name: 'Boston Bruins', titles: '6 Stanley Cups', color: 'bg-yellow-500/10' },
                { name: 'Chicago Blackhawks', titles: '6 Stanley Cups', color: 'bg-red-500/10' },
                { name: 'Edmonton Oilers', titles: '5 Stanley Cups', color: 'bg-orange-500/10' },
              ].map((team) => (
                <div key={team.name} className={`${team.color} border border-border rounded-xl p-6`}>
                  <h3 className="font-bold text-foreground text-lg mb-2">{team.name}</h3>
                  <p className="text-muted-foreground text-sm">{team.titles}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 bg-gradient-to-r from-blue-600/20 to-white/10">
          <div className="container mx-auto px-4 text-center">
            <Tv className="w-16 h-16 text-blue-400 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-foreground mb-4">Ready for NHL Action?</h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Experience the fastest game on ice. Stream every NHL game live with DamiTV.
            </p>
            <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
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

export default NHLStreaming;
