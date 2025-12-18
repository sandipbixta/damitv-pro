import React from 'react';
import { Trophy, Globe, Tv, Shield, Clock, Users } from 'lucide-react';

const HomepageContent = () => {
  return (
    <div className="space-y-12 my-12">
      {/* Main Content Section */}
      <section className="prose prose-lg dark:prose-invert max-w-none">
        <h2 className="text-3xl font-bold mb-6">Best Sports Streaming Site Alternatives - Free HD Access</h2>
        <p className="text-lg leading-relaxed">
          Looking for reliable <strong>vipleague alternative</strong> or <strong>totalsportek similar sites</strong>? 
          Welcome to DamiTV, the premier sports streaming platform offering free HD streams for football, basketball, 
          tennis, and all major sports worldwide. As a trusted <strong>stream2watch alternative</strong> and{' '}
          <strong>hesgoal alternative</strong>, we provide high-quality streams with multiple sources for every match.
        </p>
        <p className="leading-relaxed">
          Our platform aggregates the best sports streams from reliable sources, ensuring you never miss 
          a moment of your favorite matches. Whether you're following the Premier League, Champions League, 
          NBA, or UFC, DamiTV delivers uninterrupted HD streaming with multiple backup sources - making us 
          one of the best sports streaming site alternatives available today.
        </p>
      </section>

      {/* Features Grid */}
      <section>
        <h2 className="text-3xl font-bold mb-8 text-center">Why DamiTV is the Best Sports Streaming Alternative</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-800">
            <Trophy className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-xl font-bold mb-3">All Major Sports</h3>
            <p className="text-sm leading-relaxed">
              Access live streams of football, basketball, baseball, cricket, rugby, 
              and more. We cover major leagues including Premier League, La Liga, Serie A, Bundesliga, 
              NBA, NFL, UFC, and international tournaments. Superior to other streaming alternatives.
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-800">
            <Tv className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-xl font-bold mb-3">HD Quality Streams</h3>
            <p className="text-sm leading-relaxed">
              Enjoy high-definition streaming with minimal buffering. Our platform provides multiple 
              stream sources for each match, allowing you to switch if one source experiences issues. 
              Adaptive streaming ensures the best quality for your connection speed.
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-800">
            <Globe className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-xl font-bold mb-3">Global Access</h3>
            <p className="text-sm leading-relaxed">
              Watch sports from anywhere in the world. DamiTV is accessible globally, bringing you 
              international football, European leagues, American sports, and Asian competitions. 
              No geographical restrictions - just pure sports entertainment.
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-800">
            <Shield className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-xl font-bold mb-3">Safe & Secure</h3>
            <p className="text-sm leading-relaxed">
              We prioritize your security and privacy. No registration or personal information required 
              to watch streams. Browse and stream safely with our secure platform. We don't store any 
              user data or require downloads.
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-800">
            <Clock className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-xl font-bold mb-3">24/7 Availability</h3>
            <p className="text-sm leading-relaxed">
              Sports never sleep, and neither do we. Our platform operates 24/7, providing round-the-clock 
              access to live sports events from different time zones. Early morning match or late-night game? 
              We've got you covered anytime, anywhere.
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-800">
            <Users className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-xl font-bold mb-3">Active Community</h3>
            <p className="text-sm leading-relaxed">
              Join thousands of sports fans worldwide who use DamiTV daily. Share your passion, discuss 
              matches, and connect with fellow enthusiasts. Follow us on social media and join our Telegram 
              channel for instant updates and community discussions.
            </p>
          </div>
        </div>
      </section>

      {/* Sports Coverage Section */}
      <section className="bg-gradient-to-r from-primary/10 to-primary/5 p-8 rounded-lg">
        <h2 className="text-3xl font-bold mb-6">Comprehensive Sports Coverage</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-xl font-bold mb-3">Football / Soccer</h3>
            <p className="text-sm leading-relaxed mb-3">
              Watch live football streams from the world's top leagues and tournaments. Our coverage includes:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>English Premier League - Watch all EPL matches live</li>
              <li>UEFA Champions League - Europe's premier club competition</li>
              <li>La Liga - Spanish football's top division</li>
              <li>Serie A - Italian football excellence</li>
              <li>Bundesliga - German football powerhouse</li>
              <li>Ligue 1 - French top-flight football</li>
              <li>International matches - World Cup, Euro, Copa America</li>
              <li>FA Cup, Copa del Rey, and domestic cup competitions</li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-xl font-bold mb-3">Basketball</h3>
            <p className="text-sm leading-relaxed mb-3">
              Stream live NBA games, EuroLeague, and international basketball:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>NBA - All regular season and playoff games</li>
              <li>EuroLeague - Top European club basketball</li>
              <li>NCAA College Basketball - March Madness and more</li>
              <li>FIBA competitions - World Cup and Olympic basketball</li>
            </ul>

            <h3 className="text-xl font-bold mb-3 mt-6">Other Sports</h3>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>American Football - NFL, NCAA Football</li>
              <li>Baseball - MLB, World Series</li>
              <li>Cricket - IPL, Test matches, ODI, T20</li>
              <li>Rugby - Six Nations, Rugby World Cup</li>
              <li>Combat Sports - UFC, Boxing, MMA</li>
              <li>Motorsports - Formula 1, MotoGP, NASCAR</li>
            </ul>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section>
        <h2 className="text-3xl font-bold mb-6">How to Watch Live Sports on DamiTV</h2>
        <div className="grid md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
            <div className="bg-primary text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3 text-xl font-bold">1</div>
            <h3 className="font-bold mb-2">Visit DamiTV</h3>
            <p className="text-sm">Navigate to damitv.pro from any device - desktop, mobile, or tablet.</p>
          </div>
          
          <div className="text-center p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
            <div className="bg-primary text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3 text-xl font-bold">2</div>
            <h3 className="font-bold mb-2">Find Your Match</h3>
            <p className="text-sm">Browse live matches, check the schedule, or use the search function to find specific games.</p>
          </div>
          
          <div className="text-center p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
            <div className="bg-primary text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3 text-xl font-bold">3</div>
            <h3 className="font-bold mb-2">Select a Stream</h3>
            <p className="text-sm">Choose from multiple stream sources. Try different sources if you experience buffering.</p>
          </div>
          
          <div className="text-center p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
            <div className="bg-primary text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3 text-xl font-bold">4</div>
            <h3 className="font-bold mb-2">Enjoy the Game</h3>
            <p className="text-sm">Sit back and enjoy high-quality sports streaming. No registration or payment required!</p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-white dark:bg-gray-900 p-8 rounded-lg border border-gray-200 dark:border-gray-800">
        <h2 className="text-3xl font-bold mb-6">Frequently Asked Questions</h2>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold mb-2">Is DamiTV really free to use?</h3>
            <p className="text-sm leading-relaxed">
              Yes, DamiTV is completely free. We don't charge any subscription fees, and you don't need 
              to create an account or provide payment information. Simply visit our website and start 
              watching your favorite sports.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-2">What sports can I watch on DamiTV?</h3>
            <p className="text-sm leading-relaxed">
              We offer a wide variety of sports including football (Premier League, Champions League, La Liga), 
              basketball (NBA), tennis (Grand Slams), American football (NFL), baseball (MLB), cricket, 
              rugby, ice hockey (NHL), combat sports (UFC, boxing), and motorsports (Formula 1, MotoGP). 
              Our coverage includes both live matches and sports news.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-2">Do I need to register or create an account?</h3>
            <p className="text-sm leading-relaxed">
              No registration is required. You can start watching immediately without creating an account, 
              providing an email, or sharing any personal information. This makes DamiTV the easiest way 
              to access live sports streaming.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-2">Can I watch on mobile devices?</h3>
            <p className="text-sm leading-relaxed">
              Absolutely! DamiTV is fully optimized for mobile devices. Whether you're using an Android 
              phone, iPhone, iPad, or Android tablet, you can enjoy seamless streaming. Our responsive 
              design adapts to your screen size for the best viewing experience.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-2">What should I do if a stream isn't working?</h3>
            <p className="text-sm leading-relaxed">
              We provide multiple stream sources for most matches. If one source isn't working, simply 
              click on an alternative source. Also, try refreshing the page, checking your internet 
              connection, or disabling ad blockers, as these can sometimes interfere with streaming.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-2">Is streaming legal on DamiTV?</h3>
            <p className="text-sm leading-relaxed">
              DamiTV aggregates and provides links to streams hosted by third parties. We do not host 
              or upload any content ourselves. We comply with DMCA regulations and respond promptly to 
              any takedown requests. Users should be aware of their local laws regarding streaming.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="text-center bg-gradient-to-r from-primary to-primary/80 text-white p-8 rounded-lg">
        <h2 className="text-3xl font-bold mb-4">Ready to Start Watching?</h2>
        <p className="text-lg mb-6">
          Join thousands of sports fans who trust DamiTV for free, high-quality live sports streaming. 
          No registration, no fees, just pure sports entertainment.
        </p>
        <p className="text-sm opacity-90">
          Browse our live matches, check today's schedule, or explore our sports channels to find your favorite content.
        </p>
      </section>
    </div>
  );
};

export default HomepageContent;