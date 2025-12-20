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
    question: "Where can I watch Champions League matches for free?",
    answer: "DamiTV offers free UEFA Champions League streaming with HD quality. Watch every group stage, knockout round, and final match live without any subscription."
  },
  {
    question: "What time do Champions League matches start?",
    answer: "UEFA Champions League matches typically kick off at 6:45 PM and 9:00 PM CET on Tuesdays and Wednesdays during the group and knockout stages."
  },
  {
    question: "Can I watch the Champions League Final for free?",
    answer: "Yes! DamiTV provides free streaming of the Champions League Final and all major UCL fixtures including semi-finals and quarter-finals."
  },
  {
    question: "Is Champions League streaming available on all devices?",
    answer: "DamiTV works on all devices including smartphones, tablets, laptops, desktop computers, and smart TVs with a web browser."
  }
];

const ChampionsLeagueStreaming = () => {
  return (
    <PageLayout>
      <Helmet>
        <title>Watch UEFA Champions League Live Free | UCL Streaming | DamiTV</title>
        <meta name="description" content="Stream UEFA Champions League matches live for free. Watch UCL group stage, knockouts, and finals. HD quality, no registration required." />
        <meta name="keywords" content="champions league streaming, watch ucl free, uefa champions league live, ucl final stream, champions league free" />
        <link rel="canonical" href="https://damitv.pro/champions-league-streaming" />
        <meta property="og:title" content="Watch UEFA Champions League Live Free | UCL Streaming" />
        <meta property="og:description" content="Stream UEFA Champions League matches live for free. Watch every UCL match in HD quality." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://damitv.pro/champions-league-streaming" />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative py-16 md:py-24 bg-gradient-to-br from-blue-900/30 via-indigo-600/20 to-background">
          <div className="container mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 bg-indigo-500/20 text-indigo-400 px-4 py-2 rounded-full mb-6">
              <Trophy className="w-4 h-4" />
              <span className="text-sm font-medium">UEFA Champions League</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              Watch Champions League <span className="text-indigo-400">Live Free</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Stream every UEFA Champions League match in HD quality. From group stage to the final - Europe's elite club competition. No registration, no subscription.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild size="lg" className="bg-indigo-600 hover:bg-indigo-700">
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
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">About Champions League</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <Globe className="w-10 h-10 text-indigo-500 mx-auto mb-4" />
                <h3 className="font-bold text-foreground mb-2">Global Event</h3>
                <p className="text-muted-foreground text-sm">Most watched annual sporting event in the world</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <Trophy className="w-10 h-10 text-indigo-500 mx-auto mb-4" />
                <h3 className="font-bold text-foreground mb-2">36 Elite Clubs</h3>
                <p className="text-muted-foreground text-sm">Europe's best teams compete for glory</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <Calendar className="w-10 h-10 text-indigo-500 mx-auto mb-4" />
                <h3 className="font-bold text-foreground mb-2">Sep to June</h3>
                <p className="text-muted-foreground text-sm">Full tournament from qualifiers to final</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <Star className="w-10 h-10 text-indigo-500 mx-auto mb-4" />
                <h3 className="font-bold text-foreground mb-2">Legendary Nights</h3>
                <p className="text-muted-foreground text-sm">Iconic matches and unforgettable moments</p>
              </div>
            </div>
          </div>
        </section>

        {/* Most Successful Clubs */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">Most Successful UCL Clubs</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {[
                { name: 'Real Madrid', titles: '15 UCL titles', color: 'bg-white/10' },
                { name: 'AC Milan', titles: '7 UCL titles', color: 'bg-red-600/10' },
                { name: 'Bayern Munich', titles: '6 UCL titles', color: 'bg-red-500/10' },
                { name: 'Liverpool', titles: '6 UCL titles', color: 'bg-red-700/10' },
                { name: 'Barcelona', titles: '5 UCL titles', color: 'bg-blue-700/10' },
                { name: 'Manchester City', titles: '1 UCL title', color: 'bg-sky-400/10' },
              ].map((club) => (
                <div key={club.name} className={`${club.color} border border-border rounded-xl p-6`}>
                  <h3 className="font-bold text-foreground text-lg mb-2">{club.name}</h3>
                  <p className="text-muted-foreground text-sm">{club.titles}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Tournament Format */}
        <section className="py-16 bg-card/50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">Tournament Format</h2>
            <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <div className="w-12 h-12 bg-indigo-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-lg font-bold text-indigo-500">1</span>
                </div>
                <h3 className="font-bold text-foreground mb-2">League Phase</h3>
                <p className="text-muted-foreground text-sm">36 teams, 8 matches each in new Swiss format</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <div className="w-12 h-12 bg-indigo-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-lg font-bold text-indigo-500">2</span>
                </div>
                <h3 className="font-bold text-foreground mb-2">Knockout Playoffs</h3>
                <p className="text-muted-foreground text-sm">Two-legged ties for positions 9-24</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <div className="w-12 h-12 bg-indigo-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-lg font-bold text-indigo-500">3</span>
                </div>
                <h3 className="font-bold text-foreground mb-2">Knockouts</h3>
                <p className="text-muted-foreground text-sm">R16 through semi-finals, two-legged ties</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <div className="w-12 h-12 bg-indigo-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-lg font-bold text-indigo-500">4</span>
                </div>
                <h3 className="font-bold text-foreground mb-2">Final</h3>
                <p className="text-muted-foreground text-sm">Single match at neutral venue</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-r from-blue-900/20 to-indigo-600/20">
          <div className="container mx-auto px-4 text-center">
            <Tv className="w-16 h-16 text-indigo-500 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-foreground mb-4">Ready for Champions League Nights?</h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Don't miss any Champions League action. Stream every match live with DamiTV - completely free.
            </p>
            <Button asChild size="lg" className="bg-indigo-600 hover:bg-indigo-700">
              <Link to="/live"><Play className="w-5 h-5 mr-2" /> Start Watching Now</Link>
            </Button>
          </div>
        </section>

        <FAQSection faqs={faqs} />
        <InternalLinks links={[
          { text: 'Watch Premier League Free', url: '/watch-premier-league-free', description: 'Stream English Premier League' },
          { text: 'Europa League Streaming', url: '/europa-league-streaming', description: 'Watch UEL matches live' },
          { text: 'All Live Sports', url: '/live', description: 'Browse all live matches' },
        ]} />
      </div>
    </PageLayout>
  );
};

export default ChampionsLeagueStreaming;
