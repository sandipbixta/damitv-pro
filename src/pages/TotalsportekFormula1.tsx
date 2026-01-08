import React from "react";
import { Helmet } from "react-helmet-async";
import PageLayout from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import FAQSection from "@/components/FAQSection";
import InternalLinks from "@/components/InternalLinks";
import { Link } from "react-router-dom";

const TotalsportekFormula1: React.FC = () => {
  const faqs = [
    { question: "Can I watch Formula 1 on Totalsportek?", answer: "Totalsportek offers F1 streams, but DamiTV provides a legal, safer alternative with better quality and reliability." },
    { question: "Is Totalsportek Formula 1 legal?", answer: "Totalsportek operates in a gray area. DamiTV offers legal F1 streaming without copyright concerns." },
    { question: "What quality are F1 streams?", answer: "DamiTV provides HD and Full HD Formula 1 streams with minimal buffering for the best viewing experience." }
  ];

  return (
    <PageLayout>
      <Helmet>
        <title>Totalsportek Formula 1 - Watch F1 Live Streaming Free & Safe</title>
        <meta name="description" content="Looking for Totalsportek Formula 1? Watch F1 races live at DamiTV - safe, legal alternative with HD quality streams. No registration required." />
        <meta name="keywords" content="totalsportek formula 1, totalsportek f1, formula 1 live stream, totalsportek live, f1 streaming free" />
        <link rel="canonical" href="https://damitv.pro/totalsportek-formula-1" />
      </Helmet>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Totalsportek Formula 1: Watch F1 Races Live Free
          </h1>
          <p className="text-lg text-muted-foreground mb-6">Safe alternative to Totalsportek for Formula 1 live streaming</p>
          <Button asChild size="lg"><Link to="/live">Watch F1 Live</Link></Button>
        </div>

        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Watching Formula 1 on Totalsportek</h2>
          <p className="text-muted-foreground mb-4">
            Many F1 fans search for "Totalsportek Formula 1" to watch races live. While Totalsportek F1 streams exist, DamiTV offers a superior alternative with legal compliance, better quality, and enhanced reliability for all Formula 1 Grand Prix races.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">How to Watch Formula 1 Live</h2>
          <p className="text-muted-foreground mb-4">
            Visit DamiTV and navigate to the live section during race weekends. Select the Formula 1 race and start streaming in HD quality. DamiTV provides better coverage than Totalsportek live with no intrusive ads or security risks.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">DamiTV vs Totalsportek for F1</h2>
          <div className="space-y-4">
            <div className="bg-card border-l-4 border-green-500 p-6 rounded">
              <h3 className="font-semibold mb-2">✓ Better Quality</h3>
              <p className="text-muted-foreground">HD streams for every F1 race, practice, and qualifying session</p>
            </div>
            <div className="bg-card border-l-4 border-blue-500 p-6 rounded">
              <h3 className="font-semibold mb-2">✓ Legal & Safe</h3>
              <p className="text-muted-foreground">Watch F1 without copyright concerns or malware risks</p>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Conclusion</h2>
          <p className="text-muted-foreground mb-6">
            For Formula 1 fans seeking alternatives to Totalsportek F1 streams, DamiTV delivers superior quality, legal compliance, and reliable access to every Grand Prix. Watch F1 racing the right way with DamiTV.
          </p>
        </section>

        <FAQSection faqs={faqs} />
        <InternalLinks links={[
          { text: "Live Sports", url: "/live" },
          { text: "Sports Schedule", url: "/schedule" },
          { text: "All Channels", url: "/channels" }
        ]} />
      </div>
    </PageLayout>
  );
};

export default TotalsportekFormula1;