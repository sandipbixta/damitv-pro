import React from "react";
import { Helmet } from "react-helmet-async";
import PageLayout from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import FAQSection from "@/components/FAQSection";
import InternalLinks from "@/components/InternalLinks";
import { Link } from "react-router-dom";

const TotalsportekTennis: React.FC = () => {
  const faqs = [
    { question: "Can I watch tennis on Totalsportek?", answer: "Yes, but DamiTV offers better quality, legal tennis streams for all major tournaments including Grand Slams." },
    { question: "What tennis tournaments are available?", answer: "DamiTV streams Wimbledon, US Open, French Open, Australian Open, ATP, WTA, and more." },
    { question: "Is tennis streaming legal on DamiTV?", answer: "Yes, DamiTV provides legal tennis streaming with proper licensing and no copyright issues." }
  ];

  return (
    <PageLayout>
      <Helmet>
        <title>Totalsportek Tennis - Watch Tennis Live Streaming Free</title>
        <meta name="description" content="Watch tennis live at DamiTV - safe alternative to Totalsportek tennis. Stream Grand Slams, ATP, WTA tournaments in HD quality. Free & legal." />
        <meta name="keywords" content="totalsportek tennis, tennis live stream, totalsportek live, streaming tennis, wimbledon live stream" />
        <link rel="canonical" href="https://damitv.pro/totalsportek-tennis" />
      </Helmet>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Totalsportek Tennis: Watch Live Tennis Streaming
          </h1>
          <p className="text-lg text-muted-foreground mb-6">Safe, legal alternative for tennis live streaming</p>
          <Button asChild size="lg"><Link to="/live">Watch Tennis Live</Link></Button>
        </div>

        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Tennis Streaming on Totalsportek</h2>
          <p className="text-muted-foreground mb-4">
            Tennis fans often search for Totalsportek tennis streams to watch Grand Slams and major tournaments. DamiTV provides a superior alternative with legal tennis live streams, better quality, and comprehensive coverage of ATP, WTA, and all major tennis events.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">How to Watch Tennis Live</h2>
          <p className="text-muted-foreground mb-4">
            Simply visit DamiTV during any tennis tournament, navigate to the tennis section, and select your match. Stream in HD quality without the security risks or legal concerns associated with Totalsportek live tennis streams.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Why Choose DamiTV for Tennis?</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-card border rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-3 text-green-600">✓ All Tournaments</h3>
              <p className="text-muted-foreground">Grand Slams, ATP, WTA, and more</p>
            </div>
            <div className="bg-card border rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-3 text-green-600">✓ HD Quality</h3>
              <p className="text-muted-foreground">Crystal clear tennis streaming</p>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Conclusion</h2>
          <p className="text-muted-foreground mb-6">
            For tennis fans seeking alternatives to Totalsportek tennis streams, DamiTV delivers legal, high-quality coverage of all major tournaments. Watch tennis the right way with DamiTV.
          </p>
        </section>

        <FAQSection faqs={faqs} />
        <InternalLinks links={[{ text: "Live Sports", url: "/live" }, { text: "Schedule", url: "/schedule" }]} />
      </div>
    </PageLayout>
  );
};

export default TotalsportekTennis;