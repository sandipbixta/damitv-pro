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
    question: "Where can I watch Serie A matches for free?",
    answer: "DamiTV offers free Serie A streaming with HD quality. Watch Juventus, Inter Milan, AC Milan, Napoli and all Italian football matches live without subscription."
  },
  {
    question: "What time do Serie A matches start?",
    answer: "Serie A matches are typically scheduled at 12:30 PM, 3:00 PM, 6:00 PM, and 8:45 PM CET on weekends, with midweek fixtures at 6:30 PM and 8:45 PM."
  },
  {
    question: "Can I watch Derby della Madonnina live for free?",
    answer: "Yes! DamiTV provides free streaming of the Milan Derby (Inter vs AC Milan) and all major Serie A fixtures including Derby d'Italia."
  },
  {
    question: "Is Serie A streaming available on mobile?",
    answer: "DamiTV works on all devices. Watch Serie A on your phone, tablet, laptop, or smart TV with any modern web browser."
  }
];

const SerieAStreaming = () => {
  return (
    <PageLayout>
      <Helmet>
        <title>Watch Serie A Live Free | Italian Football Streaming | DamiTV</title>
        <meta name="description" content="Stream Serie A matches live for free. Watch Juventus, Inter Milan, AC Milan, Napoli and all Italian football. HD quality, no registration required." />
        <meta name="keywords" content="serie a streaming, watch serie a free, juventus live, inter milan live stream, italian football free, ac milan stream" />
        <link rel="canonical" href="https://damitv.pro/serie-a-streaming" />
        <meta property="og:title" content="Watch Serie A Live Free | Italian Football Streaming" />
        <meta property="og:description" content="Stream Serie A matches live for free. Watch Juventus, Inter Milan, AC Milan and all Italian football." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://damitv.pro/serie-a-streaming" />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative py-16 md:py-24 bg-gradient-to-br from-green-600/20 via-white/10 to-red-600/20">
          <div className="container mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 bg-green-500/20 text-green-400 px-4 py-2 rounded-full mb-6">
              <Trophy className="w-4 h-4" />
              <span className="text-sm font-medium">Serie A - Italian Football League</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              Watch Serie A <span className="text-green-500">Live Free</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Stream all Serie A matches in HD quality. Juventus, Inter Milan, AC Milan, Napoli, and every Italian club. No registration, completely free.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild size="lg" className="bg-green-600 hover:bg-green-700">
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
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">About Serie A</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <Globe className="w-10 h-10 text-green-500 mx-auto mb-4" />
                <h3 className="font-bold text-foreground mb-2">Historic League</h3>
                <p className="text-muted-foreground text-sm">Founded in 1898, one of Europe's oldest top leagues</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <Trophy className="w-10 h-10 text-green-500 mx-auto mb-4" />
                <h3 className="font-bold text-foreground mb-2">20 Top Clubs</h3>
                <p className="text-muted-foreground text-sm">Including legendary clubs with rich European history</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <Calendar className="w-10 h-10 text-green-500 mx-auto mb-4" />
                <h3 className="font-bold text-foreground mb-2">38 Matchdays</h3>
                <p className="text-muted-foreground text-sm">Full season from August to May with 380 matches</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <Star className="w-10 h-10 text-green-500 mx-auto mb-4" />
                <h3 className="font-bold text-foreground mb-2">Tactical Excellence</h3>
                <p className="text-muted-foreground text-sm">Known for world-class defensive tactics</p>
              </div>
            </div>
          </div>
        </section>

        {/* Top Clubs */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">Top Serie A Clubs</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {[
                { name: 'Juventus', titles: '36 league titles', color: 'bg-white/10' },
                { name: 'Inter Milan', titles: '20 league titles', color: 'bg-blue-600/10' },
                { name: 'AC Milan', titles: '19 league titles', color: 'bg-red-600/10' },
                { name: 'Napoli', titles: '3 league titles', color: 'bg-blue-400/10' },
                { name: 'AS Roma', titles: '3 league titles', color: 'bg-yellow-600/10' },
                { name: 'Lazio', titles: '2 league titles', color: 'bg-sky-400/10' },
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
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">How to Watch Serie A on DamiTV</h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-green-500">1</span>
                </div>
                <h3 className="font-bold text-foreground mb-2">Open DamiTV</h3>
                <p className="text-muted-foreground text-sm">Navigate to damitv.pro on any browser</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-green-500">2</span>
                </div>
                <h3 className="font-bold text-foreground mb-2">Choose Match</h3>
                <p className="text-muted-foreground text-sm">Browse Serie A fixtures in our schedule</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-green-500">3</span>
                </div>
                <h3 className="font-bold text-foreground mb-2">Watch Free</h3>
                <p className="text-muted-foreground text-sm">Enjoy Italian football in HD quality</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-r from-green-600/20 to-red-600/20">
          <div className="container mx-auto px-4 text-center">
            <Tv className="w-16 h-16 text-green-500 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-foreground mb-4">Ready to Watch Serie A?</h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Experience the passion of Italian football. Stream every Serie A match live with DamiTV.
            </p>
            <Button asChild size="lg" className="bg-green-600 hover:bg-green-700">
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

export default SerieAStreaming;
