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
    question: "Where can I watch WWE events for free?",
    answer: "DamiTV offers free WWE streaming with HD quality. Watch Raw, SmackDown, NXT, and premium live events including WrestleMania without subscription."
  },
  {
    question: "What time does WWE Raw start?",
    answer: "WWE Raw airs live every Monday at 8:00 PM ET, SmackDown is on Fridays at 8:00 PM ET, and NXT airs Tuesdays at 8:00 PM ET."
  },
  {
    question: "Can I watch WrestleMania for free?",
    answer: "Yes! DamiTV provides free streaming of WrestleMania and all WWE premium live events like Royal Rumble and SummerSlam."
  },
  {
    question: "Is WWE streaming available worldwide?",
    answer: "DamiTV is accessible globally. Watch WWE from any country with an internet connection."
  }
];

const WWEStreaming = () => {
  return (
    <PageLayout>
      <Helmet>
        <title>Watch WWE Live Free | Wrestling Streaming | DamiTV</title>
        <meta name="description" content="Stream WWE events live for free. Watch Raw, SmackDown, NXT, WrestleMania and all premium live events. HD quality, no subscription required." />
        <meta name="keywords" content="wwe streaming, watch wwe free, wwe live stream, wrestlemania stream, wrestling free" />
        <link rel="canonical" href="https://damitv.pro/wwe-streaming" />
        <meta property="og:title" content="Watch WWE Live Free | Wrestling Streaming" />
        <meta property="og:description" content="Stream WWE events live for free including WrestleMania." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://damitv.pro/wwe-streaming" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <section className="relative py-16 md:py-24 bg-gradient-to-br from-red-600/20 via-black/20 to-background">
          <div className="container mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 bg-red-500/20 text-red-400 px-4 py-2 rounded-full mb-6">
              <Trophy className="w-4 h-4" />
              <span className="text-sm font-medium">WWE - World Wrestling Entertainment</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              Watch WWE <span className="text-red-500">Live Free</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Stream every WWE event in HD quality. Raw, SmackDown, NXT, and premium live events. Sports entertainment at its best, completely free.
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
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">WWE Shows on DamiTV</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <div className="w-12 h-12 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold text-red-500">RAW</span>
                </div>
                <h3 className="font-bold text-foreground mb-2">Monday Night Raw</h3>
                <p className="text-muted-foreground text-sm">Every Monday at 8 PM ET</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <div className="w-12 h-12 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold text-blue-500">SD</span>
                </div>
                <h3 className="font-bold text-foreground mb-2">SmackDown</h3>
                <p className="text-muted-foreground text-sm">Every Friday at 8 PM ET</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold text-yellow-500">NXT</span>
                </div>
                <h3 className="font-bold text-foreground mb-2">NXT</h3>
                <p className="text-muted-foreground text-sm">Every Tuesday at 8 PM ET</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <div className="w-12 h-12 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="w-6 h-6 text-purple-500" />
                </div>
                <h3 className="font-bold text-foreground mb-2">Premium Events</h3>
                <p className="text-muted-foreground text-sm">WrestleMania, Royal Rumble & more</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">Major WWE Premium Events</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {[
                { name: 'WrestleMania', desc: "The Showcase of Immortals", color: 'bg-purple-600/10' },
                { name: 'Royal Rumble', desc: '30-Man Battle Royal', color: 'bg-blue-600/10' },
                { name: 'SummerSlam', desc: 'Biggest Party of Summer', color: 'bg-orange-500/10' },
                { name: 'Survivor Series', desc: 'Brand vs Brand Warfare', color: 'bg-gray-600/10' },
                { name: 'Money in the Bank', desc: 'Ladder Match Showdown', color: 'bg-green-600/10' },
                { name: 'Elimination Chamber', desc: 'Steel Structure Brutality', color: 'bg-red-600/10' },
              ].map((event) => (
                <div key={event.name} className={`${event.color} border border-border rounded-xl p-6`}>
                  <h3 className="font-bold text-foreground text-lg mb-2">{event.name}</h3>
                  <p className="text-muted-foreground text-sm">{event.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 bg-gradient-to-r from-red-600/20 to-black/20">
          <div className="container mx-auto px-4 text-center">
            <Tv className="w-16 h-16 text-red-500 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-foreground mb-4">Ready for WWE Action?</h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Experience sports entertainment. Stream every WWE event live with DamiTV.
            </p>
            <Button asChild size="lg" className="bg-red-600 hover:bg-red-700">
              <Link to="/live"><Play className="w-5 h-5 mr-2" /> Start Watching Now</Link>
            </Button>
          </div>
        </section>

        <FAQSection faqs={faqs} />
        <InternalLinks links={[
          { text: 'UFC Streaming Free', url: '/ufc-streaming-free', description: 'Watch UFC fights live' },
          { text: 'Boxing Streaming', url: '/boxing-streaming', description: 'Stream boxing fights' },
          { text: 'All Live Sports', url: '/live', description: 'Browse all live matches' },
        ]} />
      </div>
    </PageLayout>
  );
};

export default WWEStreaming;
