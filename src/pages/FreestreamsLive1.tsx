import React from "react";
import { Helmet } from "react-helmet-async";
import PageLayout from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Star, Shield } from "lucide-react";
import FAQSection from "@/components/FAQSection";
import InternalLinks from "@/components/InternalLinks";
import { Link } from "react-router-dom";

const FreestreamsLive1: React.FC = () => {
  const faqs = [
    {
      question: "What is Freestreams Live1?",
      answer: "Freestreams Live1 is a sports streaming platform. DamiTV offers a safer, more reliable alternative with legal streams and better quality."
    },
    {
      question: "Is Freestreams Live1 safe?",
      answer: "Free streaming sites may pose security risks. DamiTV provides a secure, legal alternative without malware or legal concerns."
    },
    {
      question: "What sports are available?",
      answer: "DamiTV covers all major sports including football, basketball, tennis, baseball, hockey, and more in HD quality."
    }
  ];

  return (
    <PageLayout>
      <Helmet>
        <title>Freestreams Live1 - Safe Alternative for Free Sports Streaming</title>
        <meta name="description" content="Looking for Freestreams Live1? Discover DamiTV - safe, legal alternative for free live sports streaming. Watch football, basketball, tennis & more in HD." />
        <meta name="keywords" content="freestreams live1, freestreams live, freestreams live alternatives, sports live stream, free sports streaming" />
        <link rel="canonical" href="https://damitv.pro/freestreams-live1" />
      </Helmet>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Freestreams Live1: Watch Sports Safely with DamiTV
          </h1>
          <p className="text-lg text-muted-foreground mb-6">
            Discover the safe, legal alternative to Freestreams Live1 for free sports streaming
          </p>
          <Button asChild size="lg"><Link to="/live">Watch Live Now</Link></Button>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mb-8">
          <div className="flex items-start gap-3">
            <Shield className="w-6 h-6 text-yellow-600 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">Safety Notice</h3>
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Free streaming sites may expose users to security risks. DamiTV provides legal, safe sports streaming.
              </p>
            </div>
          </div>
        </div>

        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">What is Freestreams Live1?</h2>
          <p className="text-muted-foreground mb-4">
            Freestreams Live1 is among the free sports streaming platforms that users search for. However, concerns about legality, security, and reliability make alternatives like DamiTV a smarter choice for sports fans.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">How to Watch Freestreams Live1 Sports</h2>
          <p className="text-muted-foreground mb-4">
            Instead of risking security issues with Freestreams Live1, visit DamiTV for instant access to live sports. Simply navigate to our live section, select your match, and start streaming in HD quality - no registration required.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Why Choose DamiTV Over Freestreams Live1?</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-card border rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-3 text-green-600">✓ Legal & Safe</h3>
              <p className="text-muted-foreground">DamiTV operates legally with no security risks</p>
            </div>
            <div className="bg-card border rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-3 text-green-600">✓ HD Quality</h3>
              <p className="text-muted-foreground">Consistent high-quality streams without buffering</p>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Conclusion</h2>
          <p className="text-muted-foreground mb-6">
            While Freestreams Live1 offers free sports streams, DamiTV provides a superior alternative with legal compliance, better quality, and enhanced security. Make the switch today for safer sports streaming.
          </p>
          <div className="text-center bg-primary/5 border border-primary/20 rounded-lg p-8">
            <Button asChild size="lg"><Link to="/live">Watch Sports Now</Link></Button>
          </div>
        </section>

        <FAQSection faqs={faqs} />
        <InternalLinks links={[
          { text: "Live Sports", url: "/live", description: "Watch live now" },
          { text: "Schedule", url: "/schedule", description: "Upcoming matches" },
          { text: "Channels", url: "/channels", description: "Browse channels" }
        ]} />
      </div>
    </PageLayout>
  );
};

export default FreestreamsLive1;