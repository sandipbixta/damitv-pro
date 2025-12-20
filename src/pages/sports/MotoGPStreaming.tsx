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
    question: "Where can I watch MotoGP races for free?",
    answer: "DamiTV offers free MotoGP streaming with HD quality. Watch every race, qualifying, and practice session live without subscription."
  },
  {
    question: "What time do MotoGP races start?",
    answer: "MotoGP race times vary by circuit location. European races typically start at 2:00 PM CET, while Asian races start in the morning for European viewers."
  },
  {
    question: "Can I watch all MotoGP classes for free?",
    answer: "Yes! DamiTV provides free streaming of MotoGP, Moto2, and Moto3 races throughout the entire season."
  },
  {
    question: "Is MotoGP streaming available worldwide?",
    answer: "DamiTV is accessible globally. Watch MotoGP from any country with an internet connection."
  }
];

const MotoGPStreaming = () => {
  return (
    <PageLayout>
      <Helmet>
        <title>Watch MotoGP Live Free | Motorcycle Racing Streaming | DamiTV</title>
        <meta name="description" content="Stream MotoGP races live for free. Watch every Grand Prix, qualifying, and practice session. HD quality, no subscription required." />
        <meta name="keywords" content="motogp streaming, watch motogp free, motogp live stream, motorcycle racing free, grand prix stream" />
        <link rel="canonical" href="https://damitv.pro/motogp-streaming" />
        <meta property="og:title" content="Watch MotoGP Live Free | Motorcycle Racing Streaming" />
        <meta property="og:description" content="Stream MotoGP races live for free including all Grand Prix events." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://damitv.pro/motogp-streaming" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <section className="relative py-16 md:py-24 bg-gradient-to-br from-red-600/20 via-orange-500/20 to-background">
          <div className="container mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 bg-red-500/20 text-red-400 px-4 py-2 rounded-full mb-6">
              <Trophy className="w-4 h-4" />
              <span className="text-sm font-medium">MotoGP World Championship</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              Watch MotoGP <span className="text-red-500">Live Free</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Stream every MotoGP race in HD quality. Grand Prix events, qualifying, and practice sessions. Premier motorcycle racing, completely free.
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
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">About MotoGP</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <Globe className="w-10 h-10 text-red-500 mx-auto mb-4" />
                <h3 className="font-bold text-foreground mb-2">Global Championship</h3>
                <p className="text-muted-foreground text-sm">Races across 5 continents worldwide</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <Trophy className="w-10 h-10 text-red-500 mx-auto mb-4" />
                <h3 className="font-bold text-foreground mb-2">22 Riders</h3>
                <p className="text-muted-foreground text-sm">World's best motorcycle racers</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <Calendar className="w-10 h-10 text-red-500 mx-auto mb-4" />
                <h3 className="font-bold text-foreground mb-2">20+ Grand Prix</h3>
                <p className="text-muted-foreground text-sm">March to November season</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <Star className="w-10 h-10 text-red-500 mx-auto mb-4" />
                <h3 className="font-bold text-foreground mb-2">350+ km/h</h3>
                <p className="text-muted-foreground text-sm">Ultimate speed and precision</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">Top MotoGP Teams</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {[
                { name: 'Ducati Lenovo Team', desc: 'Dominant force since 2022', color: 'bg-red-600/10' },
                { name: 'Monster Yamaha', desc: 'Japanese engineering excellence', color: 'bg-blue-600/10' },
                { name: 'Repsol Honda', desc: 'Most successful MotoGP team', color: 'bg-orange-500/10' },
                { name: 'Aprilia Racing', desc: 'Italian innovation', color: 'bg-black/10' },
                { name: 'Red Bull KTM', desc: 'Austrian precision', color: 'bg-orange-600/10' },
                { name: 'Gresini Racing', desc: 'Independent team success', color: 'bg-blue-400/10' },
              ].map((team) => (
                <div key={team.name} className={`${team.color} border border-border rounded-xl p-6`}>
                  <h3 className="font-bold text-foreground text-lg mb-2">{team.name}</h3>
                  <p className="text-muted-foreground text-sm">{team.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 bg-gradient-to-r from-red-600/20 to-orange-500/20">
          <div className="container mx-auto px-4 text-center">
            <Tv className="w-16 h-16 text-red-500 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-foreground mb-4">Ready for MotoGP Action?</h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Experience the thrill of motorcycle racing. Stream every MotoGP race live with DamiTV.
            </p>
            <Button asChild size="lg" className="bg-red-600 hover:bg-red-700">
              <Link to="/live"><Play className="w-5 h-5 mr-2" /> Start Watching Now</Link>
            </Button>
          </div>
        </section>

        <FAQSection faqs={faqs} />
        <InternalLinks links={[
          { text: 'Formula 1 Streaming', url: '/totalsportek-formula-1', description: 'Watch F1 races live' },
          { text: 'UFC Streaming Free', url: '/ufc-streaming-free', description: 'Stream UFC fights' },
          { text: 'All Live Sports', url: '/live', description: 'Browse all live matches' },
        ]} />
      </div>
    </PageLayout>
  );
};

export default MotoGPStreaming;
