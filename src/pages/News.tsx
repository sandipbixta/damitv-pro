
import React, { useState, useEffect, useCallback } from 'react';
import PageLayout from '../components/PageLayout';
import NewsSection from '../components/NewsSection';
import { useToast } from '../hooks/use-toast';
import { Helmet } from 'react-helmet-async';
// import Advertisement from '../components/Advertisement';
import SocialBar from '../components/SocialBar';
import { Button } from '@/components/ui/button';
import { RefreshCw, Share } from 'lucide-react';


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
    // Force page reload to refresh all content
    window.location.reload();
    toast({
      title: "Refreshing News",
      description: "Getting the latest sports updates...",
    });
  }, [toast]);
  
  // Set up regular page refresh in background
  useEffect(() => {
    const refreshIntervalId = setInterval(() => {
      console.log("News page auto-refresh triggered");
      setLastRefreshed(new Date());
      
      // Get any NewsSection components and trigger their refresh logic
      const newsComponents = document.querySelectorAll('.news-section-component button[aria-label="Refresh news"]');
      if (newsComponents.length > 0) {
        (newsComponents[0] as HTMLButtonElement).click();
      }
    }, 15 * 60 * 1000); // Every 15 minutes
    
    return () => {
      clearInterval(refreshIntervalId);
    };
  }, []);
  
  return (
    <PageLayout>
      <Helmet>
        <title>Football & Sports News | DamiTV - Latest Updates and Headlines</title>
        <meta name="description" content="Stay updated with the latest football/soccer news, transfers, match reports, and analysis from around the world. Get breaking news in football, basketball, tennis and more." />
        <meta name="keywords" content="football news, soccer news, premier league, la liga, champions league, basketball news, latest sports updates, sports headlines, match reports" />
        <meta name="canonical" content="https://damitv.pro/news" />
        <script type="application/ld+json">
        {`
          {
            "@context": "https://schema.org",
            "@type": "NewsMediaOrganization",
            "name": "DamiTV Sports News",
            "url": "https://damitv.pro/news",
            "logo": "https://i.imgur.com/m4nV9S8.png",
            "description": "Latest football, soccer and sports news from around the world"
          }
        `}
        </script>
      </Helmet>
      
      {/* Popunder Ad removed */}
      
      <div className="py-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-black dark:text-white mb-2">Football & Sports News</h1>
            <p className="text-black dark:text-white">
              The latest updates, transfers, and match reports from around the football world and beyond.
            </p>
          </div>
          <Button 
            onClick={handleManualRefresh} 
            variant="outline" 
            className="text-black dark:text-white border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black bg-transparent"
          >
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh News
          </Button>
        </div>
        
        {/* Email signup for returning visitors */}
        <div className="bg-white dark:bg-black rounded-xl p-4 sm:p-5 border border-black dark:border-white mb-6 sm:mb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h3 className="text-xl font-bold text-black dark:text-white">Get Daily Football Updates</h3>
            <p className="text-sm text-black dark:text-white">Delivered straight to your inbox</p>
          </div>
          <div className="flex gap-2">
            <input 
              type="email" 
              placeholder="Your email" 
              className="px-4 py-2 rounded bg-white dark:bg-black border border-black dark:border-white text-black dark:text-white"
            />
            <Button onClick={handleSubscribe} className="bg-[#fa2d04] hover:bg-[#e02700]">
              Subscribe
            </Button>
          </div>
        </div>
        
        {/* Featured news section with enhanced SEO */}
        <div className="mb-6 sm:mb-8 news-section-component">
          <NewsSection />
        </div>
        
        {/* Direct Link Advertisement removed */}
        {/* <div className="mb-4 sm:mb-6">
          <Advertisement type="direct-link" className="w-full" />
        </div> */}
        
        {/* Categories section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {['Football/Soccer', 'Basketball', 'Baseball', 'Tennis'].map((sport) => (
            <div key={sport} className="bg-white dark:bg-black rounded-lg p-4 text-center border border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black cursor-pointer transition-all">
              <h3 className="font-bold">{sport}</h3>
              <p className="text-xs mt-1">Latest news</p>
            </div>
          ))}
        </div>
        
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
      </div>
      
      <SocialBar />
    </PageLayout>
  );
};

export default News;

