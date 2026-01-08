import React from "react";
import { Helmet } from "react-helmet-async";
import PageLayout from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import FAQSection from "@/components/FAQSection";
import InternalLinks from "@/components/InternalLinks";
import { Link } from "react-router-dom";

const HesgoalTV: React.FC = () => {
  const faqs = [
    { question: "What is Hesgoal TV?", answer: "Hesgoal TV is a sports streaming platform. DamiTV offers a safer, legal alternative with better quality and reliability." },
    { question: "Is Hesgoal TV legal?", answer: "Hesgoal TV operates in uncertain legal territory. DamiTV provides legal sports streaming without copyright concerns." },
    { question: "Can I watch football on DamiTV?", answer: "Yes! DamiTV streams all major football leagues and competitions in HD quality." }
  ];

  return (
    <PageLayout>
      <Helmet>
        <title>Hesgoal TV - Safe Alternative for Live Sports Streaming</title>
        <meta name="description" content="Looking for Hesgoal TV? Watch sports at DamiTV - safe, legal alternative. Stream football, basketball & more in HD quality. Free access." />
        <meta name="keywords" content="hesgoal tv, hesgoal live stream, hesgoal football, hesgoal alternatives, sports tv streaming" />
        <link rel="canonical" href="https://damitv.pro/hesgoal-tv" />
      </Helmet>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Hesgoal TV: Watch Live Sports Safely
          </h1>
          <p className="text-lg text-muted-foreground mb-6">Safe, legal alternative to Hesgoal TV for sports streaming</p>
          <Button asChild size="lg"><Link to="/live">Watch TV Live</Link></Button>
        </div>

        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">What is Hesgoal TV?</h2>
          <p className="text-muted-foreground mb-4">
            Hesgoal TV provides free sports streaming but comes with legal and security concerns. DamiTV offers a superior alternative with legal compliance, better quality, and comprehensive sports coverage including football, basketball, and tennis.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">How to Watch Hesgoal TV Sports</h2>
          <p className="text-muted-foreground mb-4">
            Skip Hesgoal TV's risks and visit DamiTV instead. Browse our channels and live matches, select your preferred sport, and start streaming in HD quality - completely free with no registration required.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Why Choose DamiTV Over Hesgoal TV?</h2>
          <div className="space-y-4">
            <div className="bg-card border-l-4 border-green-500 p-6 rounded">
              <h3 className="font-semibold mb-2">✓ Legal Protection</h3>
              <p className="text-muted-foreground">Watch without copyright concerns</p>
            </div>
            <div className="bg-card border-l-4 border-blue-500 p-6 rounded">
              <h3 className="font-semibold mb-2">✓ Superior Quality</h3>
              <p className="text-muted-foreground">HD streams with minimal buffering</p>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Conclusion</h2>
          <p className="text-muted-foreground mb-6">
            For sports fans seeking Hesgoal TV alternatives, DamiTV delivers legal, high-quality streaming with better reliability and safety. Watch sports the right way with DamiTV.
          </p>
        </section>

        <FAQSection faqs={faqs} />
        <InternalLinks links={[{ text: "Hesgoal Guide", url: "/hesgoal" }, { text: "Live Sports", url: "/live" }]} />
      </div>
    </PageLayout>
  );
};

export default HesgoalTV;