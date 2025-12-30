import React, { useState, useEffect, useCallback } from 'react';
import PageLayout from '../components/PageLayout';
import NewsSection from '../components/NewsSection';
import { useToast } from '../hooks/use-toast';
import { Helmet } from 'react-helmet-async';
import SocialBar from '../components/SocialBar';
import { Button } from '@/components/ui/button';
import { RefreshCw, Share, Newspaper, TrendingUp, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';

const News = () => {
  const { toast } = useToast();
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  
  const handleSubscribe = () => {
    toast({
      title: "Thanks for subscribing!",
      description: "You'll receive the latest sports news updates.",
    });
  };
  
  const handleManualRefresh = useCallback(() => {
    window.location.reload();
    toast({
      title: "Refreshing News",
      description: "Getting the latest sports updates...",
    });
  }, [toast]);
  
  useEffect(() => {
    const refreshIntervalId = setInterval(() => {
      console.log("News page auto-refresh triggered");
      setLastRefreshed(new Date());
      
      const newsComponents = document.querySelectorAll('.news-section-component button[aria-label="Refresh news"]');
      if (newsComponents.length > 0) {
        (newsComponents[0] as HTMLButtonElement).click();
      }
    }, 15 * 60 * 1000);
    
    return () => {
      clearInterval(refreshIntervalId);
    };
  }, []);

  // Generate comprehensive structured data for news hub
  const generateNewsHubSchema = () => {
    return {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebPage",
          "@id": "https://damitv.pro/news",
          "url": "https://damitv.pro/news",
          "name": "Football News - Latest Transfer Updates & Match Reports | DamiTV",
          "description": "Get the latest football news, transfer rumors, match reports, and breaking sports updates from Premier League, La Liga, Champions League and more.",
          "isPartOf": {
            "@type": "WebSite",
            "@id": "https://damitv.pro/#website",
            "name": "DamiTV",
            "url": "https://damitv.pro"
          },
          "breadcrumb": {
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://damitv.pro"
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Football News",
                "item": "https://damitv.pro/news"
              }
            ]
          }
        },
        {
          "@type": "CollectionPage",
          "name": "Football News Hub",
          "description": "Curated football news from top sources including Marca and Goal.com",
          "publisher": {
            "@type": "Organization",
            "name": "DamiTV",
            "logo": {
              "@type": "ImageObject",
              "url": "https://damitv.pro/favicon.png"
            }
          }
        }
      ]
    };
  };
  
  return (
    <PageLayout>
      <Helmet>
        <title>Football News - Latest Transfer Updates & Match Reports | DamiTV</title>
        <meta name="description" content="Get the latest football news, transfer rumors, match reports, and breaking sports updates from Premier League, La Liga, Champions League and more. Updated hourly." />
        <meta name="keywords" content="football news, soccer news, transfer news, premier league news, la liga news, champions league, match reports, football transfers, breaking football news, sports updates" />
        <link rel="canonical" href="https://damitv.pro/news" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Football News - Latest Transfer Updates & Match Reports | DamiTV" />
        <meta property="og:description" content="Get the latest football news, transfer rumors, match reports, and breaking sports updates. Updated hourly." />
        <meta property="og:url" content="https://damitv.pro/news" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://damitv.pro/favicon.png" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Football News - Latest Updates | DamiTV" />
        <meta name="twitter:description" content="Breaking football news, transfers, and match reports from around the world." />
        
        {/* Structured data */}
        <script type="application/ld+json">
          {JSON.stringify(generateNewsHubSchema())}
        </script>
      </Helmet>
      
      <div className="py-4">
        {/* Hero Section with SEO-optimized H1 */}
        <header className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-black dark:text-white mb-3">
                Football News & Transfer Updates
              </h1>
              <p className="text-lg text-black/80 dark:text-white/80 max-w-2xl">
                Stay updated with the latest football news, transfer rumors, match reports, and breaking updates from Premier League, La Liga, Champions League and leagues worldwide.
              </p>
            </div>
            <Button 
              onClick={handleManualRefresh} 
              variant="outline" 
              className="text-black dark:text-white border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black bg-transparent hidden sm:flex"
            >
              <RefreshCw className="h-4 w-4 mr-2" /> Refresh
            </Button>
          </div>
          
          {/* Quick stats/features */}
          <div className="flex flex-wrap gap-4 mt-4">
            <div className="flex items-center gap-2 text-sm text-black/70 dark:text-white/70">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span>Updated hourly</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-black/70 dark:text-white/70">
              <Globe className="h-4 w-4 text-blue-500" />
              <span>Multiple sources</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-black/70 dark:text-white/70">
              <Newspaper className="h-4 w-4 text-purple-500" />
              <span>Curated content</span>
            </div>
          </div>
        </header>
        
        {/* Email signup */}
        <div className="bg-white dark:bg-black rounded-xl p-4 sm:p-5 border border-black dark:border-white mb-6 sm:mb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-black dark:text-white">Get Daily Football Updates</h2>
            <p className="text-sm text-black dark:text-white">Breaking news delivered straight to your inbox</p>
          </div>
          <div className="flex gap-2">
            <input 
              type="email" 
              placeholder="Your email" 
              className="px-4 py-2 rounded bg-white dark:bg-black border border-black dark:border-white text-black dark:text-white"
              aria-label="Email address for newsletter"
            />
            <Button onClick={handleSubscribe} className="bg-[#fa2d04] hover:bg-[#e02700]">
              Subscribe
            </Button>
          </div>
        </div>
        
        {/* Mobile refresh button */}
        <div className="sm:hidden mb-4">
          <Button 
            onClick={handleManualRefresh} 
            variant="outline" 
            className="w-full text-black dark:text-white border-black dark:border-white"
          >
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh News
          </Button>
        </div>
        
        {/* Main news section */}
        <section className="mb-6 sm:mb-8 news-section-component" aria-label="Latest football news">
          <NewsSection />
        </section>
        
        {/* Categories section with internal links */}
        <section className="mb-8" aria-label="Sports categories">
          <h2 className="text-xl font-bold text-black dark:text-white mb-4">Browse by Sport</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link to="/live" className="bg-white dark:bg-black rounded-lg p-4 text-center border border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black cursor-pointer transition-all group">
              <h3 className="font-bold text-black dark:text-white group-hover:text-white dark:group-hover:text-black">Football/Soccer</h3>
              <p className="text-xs mt-1 text-black/70 dark:text-white/70 group-hover:text-white/70 dark:group-hover:text-black/70">Live matches & news</p>
            </Link>
            <Link to="/nba-streaming-free" className="bg-white dark:bg-black rounded-lg p-4 text-center border border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black cursor-pointer transition-all group">
              <h3 className="font-bold text-black dark:text-white group-hover:text-white dark:group-hover:text-black">Basketball</h3>
              <p className="text-xs mt-1 text-black/70 dark:text-white/70 group-hover:text-white/70 dark:group-hover:text-black/70">NBA streaming</p>
            </Link>
            <Link to="/ufc-streaming-free" className="bg-white dark:bg-black rounded-lg p-4 text-center border border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black cursor-pointer transition-all group">
              <h3 className="font-bold text-black dark:text-white group-hover:text-white dark:group-hover:text-black">UFC/MMA</h3>
              <p className="text-xs mt-1 text-black/70 dark:text-white/70 group-hover:text-white/70 dark:group-hover:text-black/70">Fight streaming</p>
            </Link>
            <Link to="/totalsportek-tennis" className="bg-white dark:bg-black rounded-lg p-4 text-center border border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black cursor-pointer transition-all group">
              <h3 className="font-bold text-black dark:text-white group-hover:text-white dark:group-hover:text-black">Tennis</h3>
              <p className="text-xs mt-1 text-black/70 dark:text-white/70 group-hover:text-white/70 dark:group-hover:text-black/70">Grand Slams & more</p>
            </Link>
          </div>
        </section>
        
        {/* Social sharing prompt */}
        <div className="bg-white dark:bg-black rounded-xl p-5 border border-black dark:border-white mb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h3 className="text-xl font-bold text-black dark:text-white">Share with fellow fans</h3>
            <p className="text-sm text-black dark:text-white">Help others discover DamiTV</p>
          </div>
          <Button className="bg-[#9b87f5] hover:bg-[#8a74e9]">
            <Share className="mr-2 h-4 w-4" /> Share DamiTV
          </Button>
        </div>
        
        {/* SEO content block */}
        <section className="bg-white/50 dark:bg-black/50 rounded-xl p-6 border border-black/20 dark:border-white/20 mb-8">
          <h2 className="text-lg font-bold text-black dark:text-white mb-3">About DamiTV Football News</h2>
          <p className="text-sm text-black/80 dark:text-white/80 leading-relaxed">
            DamiTV aggregates the latest football news from trusted sources including Marca and Goal.com, bringing you comprehensive coverage of transfers, match reports, and breaking stories. Whether you're following the Premier League, La Liga, Serie A, Bundesliga, or Champions League, our curated news feed keeps you informed with hourly updates. All content is sourced from original publishers with proper attribution.
          </p>
        </section>
      </div>
      
      <SocialBar />
    </PageLayout>
  );
};

export default News;