import React from "react";
import { Helmet } from "react-helmet-async";
import PageLayout from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import FAQSection from "@/components/FAQSection";
import InternalLinks from "@/components/InternalLinks";
import { Link } from "react-router-dom";

const Sport365Live: React.FC = () => {
  const faqs = [
    { question: "What is Sport365 Live?", answer: "Sport365 Live is a sports streaming platform. DamiTV offers a safer, more reliable legal alternative for live sports." },
    { question: "Is Sport365 Live safe to use?", answer: "Free streaming sites may have security risks. DamiTV provides secure, legal streaming without malware concerns." },
    { question: "What sports can I watch?", answer: "DamiTV covers all major sports including football, basketball, tennis, baseball, hockey, and more in HD quality." }
  ];

  return (
    <PageLayout>
      <Helmet>
        <title>Sport365 Live - Safe Alternative for Live Sports Streaming</title>
        <meta name="description" content="Looking for Sport365 Live? Watch sports at DamiTV - safe, legal alternative. Stream football, basketball & more in HD. Free access, no registration." />
        <meta name="keywords" content="sport365 live, sport365 streaming, sport365 alternatives, live sports streaming, free sports streams" />
        <link rel="canonical" href="https://damitv.pro/sport365-live" />
      </Helmet>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Sport365 Live: Watch Sports Safely at DamiTV
          </h1>
          <p className="text-lg text-muted-foreground mb-6">Safe, legal alternative to Sport365 Live for sports streaming</p>
          <Button asChild size="lg"><Link to="/live">Watch Live Sports</Link></Button>
        </div>

        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">About Sport365 Live Streaming</h2>
          <p className="text-muted-foreground mb-4">
            Sport365 Live attracts sports fans seeking free streaming. However, DamiTV offers a superior alternative with legal compliance, better video quality, enhanced security, and comprehensive coverage of all major sports including football, basketball, tennis, and more.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">How to Watch Sport365 Live Matches</h2>
          <p className="text-muted-foreground mb-4">
            Instead of using Sport365 Live, visit DamiTV for instant access to live sports. Navigate to our live matches section, choose your sport or match, and start streaming in HD quality. No registration, no downloads, no security risks - just pure sports entertainment.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">DamiTV vs Sport365 Live</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-card border rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-3 text-green-600">✓ Legal & Secure</h3>
              <p className="text-muted-foreground">No legal risks or malware threats</p>
            </div>
            <div className="bg-card border rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-3 text-green-600">✓ HD Streaming</h3>
              <p className="text-muted-foreground">High-quality streams with reliability</p>
            </div>
            <div className="bg-card border rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-3 text-green-600">✓ All Sports</h3>
              <p className="text-muted-foreground">Comprehensive sports coverage</p>
            </div>
            <div className="bg-card border rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-3 text-green-600">✓ Mobile Friendly</h3>
              <p className="text-muted-foreground">Watch on any device</p>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Conclusion</h2>
          <p className="text-muted-foreground mb-6">
            For sports fans seeking Sport365 Live alternatives, DamiTV delivers legal, high-quality streaming with better reliability and safety. Experience sports streaming the right way - join DamiTV today for free, safe, and legal access to all your favorite sports.
          </p>
        </section>

        <FAQSection faqs={faqs} />
        <InternalLinks links={[{ text: "Live Matches", url: "/live" }, { text: "Sports Schedule", url: "/schedule" }]} />
      </div>
    </PageLayout>
  );
};

export default Sport365Live;