import React from 'react';
import PageLayout from '@/components/PageLayout';
import { Helmet } from 'react-helmet-async';
import { Award, Users, Globe, Tv } from 'lucide-react';

const About = () => {
  return (
    <PageLayout>
      <Helmet>
        <title>About DamiTV - Free Live Sports Streaming Platform</title>
        <meta name="description" content="Learn about DamiTV, your premier destination for free live sports streaming. Watch football, basketball, tennis, and more in HD quality." />
        <meta name="keywords" content="about damitv, sports streaming platform, free sports, live football streaming, totalsportek alternative" />
        <link rel="canonical" href="https://damitv.pro/about" />
        <meta name="robots" content="index, follow" />
        
        <meta property="og:title" content="About DamiTV - Free Live Sports Streaming Platform" />
        <meta property="og:description" content="Premier destination for free live sports streaming. Watch football, basketball, tennis in HD quality." />
        <meta property="og:url" content="https://damitv.pro/about" />
        <meta property="og:type" content="website" />
        
        <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Home",
              "item": "https://damitv.pro/"
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": "About",
              "item": "https://damitv.pro/about"
            }
          ]
        })}
        </script>
      </Helmet>

      <div className="py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8">About DamiTV</h1>
          
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <section className="mb-12">
              <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
              <p className="text-lg leading-relaxed mb-4">
                DamiTV is dedicated to bringing sports fans around the world free access to live sports streaming. 
                We believe that everyone should have the opportunity to watch their favorite teams and athletes compete, 
                regardless of geographical location or subscription barriers.
              </p>
              <p className="text-lg leading-relaxed">
                Our platform provides high-quality streams of football, basketball, tennis, baseball, and many other sports, 
                ensuring that you never miss a moment of the action. From the Premier League to the Champions League, 
                from NBA to Grand Slam tennis tournaments, DamiTV has you covered.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold mb-6">What We Offer</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-black p-6 rounded-lg border border-gray-200 dark:border-gray-800">
                  <Tv className="h-10 w-10 mb-4 text-primary" />
                  <h3 className="text-xl font-bold mb-3">Multiple Sports Coverage</h3>
                  <p>Watch football, basketball, tennis, baseball, cricket, rugby, and more. We cover major leagues and tournaments worldwide.</p>
                </div>
                
                <div className="bg-white dark:bg-black p-6 rounded-lg border border-gray-200 dark:border-gray-800">
                  <Award className="h-10 w-10 mb-4 text-primary" />
                  <h3 className="text-xl font-bold mb-3">HD Quality Streams</h3>
                  <p>Enjoy high-definition streaming with minimal buffering. We provide multiple stream sources for the best viewing experience.</p>
                </div>
                
                <div className="bg-white dark:bg-black p-6 rounded-lg border border-gray-200 dark:border-gray-800">
                  <Users className="h-10 w-10 mb-4 text-primary" />
                  <h3 className="text-xl font-bold mb-3">Active Community</h3>
                  <p>Join thousands of sports fans who trust DamiTV for their live streaming needs. Chat and discuss matches in real-time.</p>
                </div>
                
                <div className="bg-white dark:bg-black p-6 rounded-lg border border-gray-200 dark:border-gray-800">
                  <Globe className="h-10 w-10 mb-4 text-primary" />
                  <h3 className="text-xl font-bold mb-3">Global Access</h3>
                  <p>Access DamiTV from anywhere in the world. Our platform works on desktop, mobile, and tablet devices.</p>
                </div>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold mb-4">Why Choose DamiTV?</h2>
              <ul className="space-y-4 text-lg">
                <li className="flex items-start">
                  <span className="mr-3 text-primary">✓</span>
                  <span><strong>Completely Free:</strong> No subscriptions, no hidden fees. Just pure sports entertainment.</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3 text-primary">✓</span>
                  <span><strong>Multiple Sources:</strong> We provide alternative streams so you always have options if one source isn't working.</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3 text-primary">✓</span>
                  <span><strong>Easy to Use:</strong> Simple, intuitive interface that makes finding and watching your favorite matches effortless.</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3 text-primary">✓</span>
                  <span><strong>Updated Schedule:</strong> Real-time updates of match schedules, scores, and upcoming fixtures.</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3 text-primary">✓</span>
                  <span><strong>Mobile Friendly:</strong> Watch on any device - desktop, smartphone, or tablet with responsive design.</span>
                </li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold mb-4">Our Commitment</h2>
              <p className="text-lg leading-relaxed mb-4">
                At DamiTV, we are committed to providing the best possible streaming experience. We continuously work 
                to improve our platform, add new features, and ensure reliable access to live sports content. 
              </p>
              <p className="text-lg leading-relaxed mb-4">
                We respect intellectual property rights and respond promptly to any DMCA notices. Our goal is to 
                operate transparently and within legal frameworks while serving the sports community.
              </p>
              <p className="text-lg leading-relaxed">
                Whether you're a die-hard football fan, basketball enthusiast, or tennis lover, DamiTV is here to 
                ensure you never miss a game. Join our growing community and experience sports streaming the way it should be.
              </p>
            </section>

            <section className="bg-gradient-to-r from-primary/10 to-primary/5 p-8 rounded-lg">
              <h2 className="text-3xl font-bold mb-4">Join Our Community</h2>
              <p className="text-lg leading-relaxed mb-4">
                Be part of the DamiTV family. Follow us on social media, join our Telegram channel for instant updates, 
                and share your favorite matches with fellow sports enthusiasts.
              </p>
              <p className="text-lg leading-relaxed">
                Have questions or feedback? Visit our <a href="/contact" className="text-primary hover:underline font-bold">Contact page</a> to get in touch with us.
              </p>
            </section>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default About;