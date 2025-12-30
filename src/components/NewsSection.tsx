
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { useToast } from '../hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface NewsItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  category?: string;
  imageUrl?: string;
  source?: string;
}

const NewsSection = () => {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const { toast } = useToast();

  const sportCategories = [
    { name: "All", value: null },
    { name: "Football/Soccer", value: "football" },
    { name: "Basketball", value: "basketball" },
    { name: "Baseball", value: "baseball" },
    { name: "Tennis", value: "tennis" }
  ];

  // Fetch news from Marca via Firecrawl
  const fetchMarcaNews = useCallback(async (): Promise<NewsItem[]> => {
    try {
      console.log('Fetching Marca news via Firecrawl...');
      const { data, error } = await supabase.functions.invoke('scrape-news');
      
      if (error) {
        console.error('Error fetching Marca news:', error);
        return [];
      }
      
      if (data?.success && data?.articles) {
        return data.articles.map((article: any) => ({
          title: article.title,
          description: article.description || '',
          link: article.link,
          pubDate: new Date().toISOString(),
          category: 'football',
          imageUrl: article.image || '',
          source: 'Marca'
        }));
      }
      
      return [];
    } catch (err) {
      console.error('Failed to fetch Marca news:', err);
      return [];
    }
  }, []);
  
  const fetchNews = useCallback(async () => {
    console.log('Fetching news data at:', new Date().toLocaleTimeString());
    setLoading(true);
    setError(null);
    
    try {
      // Fetch from Marca and RSS feeds in parallel
      const [marcaNews, rssNews] = await Promise.all([
        fetchMarcaNews(),
        fetchRSSNews()
      ]);
      
      // Prioritize Marca news, then add RSS
      const allItems = [...marcaNews, ...rssNews];
      
      if (allItems.length === 0) {
        setError('No news items found. Please try again later.');
      } else {
        const diverseItems = getDiverseNewsSet(allItems);
        setNewsItems(diverseItems);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('Error fetching news:', err);
      setError('Failed to load news. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [fetchMarcaNews]);

  // Fetch RSS feeds
  const fetchRSSNews = async (): Promise<NewsItem[]> => {
    const feedUrls = [
      'https://api.allorigins.win/raw?url=https://www.espn.com/espn/rss/soccer/news',
      'https://api.allorigins.win/raw?url=https://www.goal.com/feeds/news?fmt=rss',
    ];
    
    const allItems: NewsItem[] = [];
    
    for (const url of feedUrls) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(url, { 
          signal: controller.signal,
          cache: 'no-store'
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) continue;
        
        const data = await response.text();
        const parser = new DOMParser();
        const xml = parser.parseFromString(data, 'application/xml');
        const items = xml.querySelectorAll('item');
        
        items.forEach((item) => {
          const title = item.querySelector('title')?.textContent || '';
          const description = item.querySelector('description')?.textContent || '';
          const link = item.querySelector('link')?.textContent || '';
          const pubDate = item.querySelector('pubDate')?.textContent || '';
          
          // Skip NFL news
          if (title.toLowerCase().includes('nfl') || description.toLowerCase().includes('nfl')) {
            return;
          }
          
          let imageUrl = '';
          const mediaContent = item.querySelector('media\\:content, content');
          const enclosure = item.querySelector('enclosure');
          
          if (mediaContent && mediaContent.getAttribute('url')) {
            imageUrl = mediaContent.getAttribute('url') || '';
          } else if (enclosure && enclosure.getAttribute('url') && enclosure.getAttribute('type')?.startsWith('image/')) {
            imageUrl = enclosure.getAttribute('url') || '';
          }
          
          let category = "other";
          const lowerTitle = title.toLowerCase();
          
          if (lowerTitle.includes('football') || lowerTitle.includes('soccer') || 
              lowerTitle.includes('premier league') || lowerTitle.includes('la liga')) {
            category = "football";
          } else if (lowerTitle.includes('basketball') || lowerTitle.includes('nba')) {
            category = "basketball";
          } else if (lowerTitle.includes('baseball') || lowerTitle.includes('mlb')) {
            category = "baseball";
          } else if (lowerTitle.includes('tennis')) {
            category = "tennis";
          }
          
          // Determine source from URL
          let source = 'Sports News';
          if (url.includes('espn')) source = 'ESPN';
          else if (url.includes('goal')) source = 'Goal.com';
          
          allItems.push({
            title,
            description,
            link,
            pubDate,
            category,
            imageUrl,
            source
          });
        });
      } catch (err) {
        console.error(`Error processing feed ${url}:`, err);
      }
    }
    
    return allItems;
  };

  useEffect(() => {
    fetchNews();
    
    const refreshIntervalId = setInterval(() => {
      console.log('Auto-refreshing news');
      fetchNews();
    }, 30 * 60 * 1000);
    
    return () => clearInterval(refreshIntervalId);
  }, [fetchNews]);

  const handleManualRefresh = () => {
    toast({
      title: "Refreshing News",
      description: "Fetching the latest sports updates...",
    });
    fetchNews();
  };

  const getDiverseNewsSet = (items: NewsItem[]): NewsItem[] => {
    // Prioritize Marca football news first
    const marcaNews = items.filter(item => item.source === 'Marca');
    const otherFootball = items.filter(item => item.category === 'football' && item.source !== 'Marca');
    const otherNews = items.filter(item => item.category !== 'football');
    
    const result: NewsItem[] = [];
    
    // Add Marca news first (up to 8)
    for (let i = 0; i < Math.min(8, marcaNews.length); i++) {
      result.push(marcaNews[i]);
    }
    
    // Add other football news
    for (let i = 0; i < Math.min(4, otherFootball.length); i++) {
      result.push(otherFootball[i]);
    }
    
    // Add some other sports
    for (let i = 0; i < Math.min(3, otherNews.length); i++) {
      result.push(otherNews[i]);
    }
    
    return result;
  };

  const filteredNews = activeCategory 
    ? newsItems.filter(item => item.category === activeCategory) 
    : newsItems;

  const stripHtml = (html: string) => {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const getCategoryColor = (category?: string) => {
    switch(category) {
      case 'football': return 'bg-green-600';
      case 'basketball': return 'bg-orange-600';
      case 'baseball': return 'bg-blue-600';
      case 'tennis': return 'bg-purple-600';
      default: return 'bg-gray-600';
    }
  };

  const getSourceColor = (source?: string) => {
    switch(source) {
      case 'Marca': return 'bg-red-600';
      case 'ESPN': return 'bg-red-500';
      case 'Goal.com': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="bg-[#242836] rounded-xl p-6 border border-[#343a4d]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          Football News
          <Link to="/news" className="text-sm text-[#9b87f5] font-normal ml-2 hover:underline">
            View All →
          </Link>
        </h2>
        <div className="flex items-center gap-3">
          <div className="text-xs text-gray-400">
            Updated: {lastUpdated.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-white border-[#343a4d] hover:bg-[#343a4d] bg-transparent"
            onClick={handleManualRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>
      
      {/* Category filters */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {sportCategories.map(category => (
          <button
            key={category.name}
            onClick={() => setActiveCategory(category.value)}
            className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
              activeCategory === category.value 
                ? 'bg-[#9b87f5] text-white' 
                : 'bg-[#1A1F2C] text-gray-300 hover:bg-[#343a4d]'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>
      
      {loading && (
        <div className="flex justify-center my-8">
          <div className="h-8 w-8 border-4 border-t-primary rounded-full animate-spin"></div>
        </div>
      )}
      
      {error && (
        <div className="text-red-500 text-center py-4">{error}</div>
      )}
      
      {/* Blog-style grid layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredNews.length === 0 && !loading && (
          <div className="col-span-full text-center py-4 text-gray-400">
            No news available for this category. Try another category or check back later.
          </div>
        )}
        
        {filteredNews.map((item, index) => (
          <Card key={index} className="bg-[#1A1F2C] border-[#343a4d] overflow-hidden hover:border-[#9b87f5] transition-colors group">
            {/* Article Image */}
            {item.imageUrl && (
              <div className="relative h-40 overflow-hidden">
                <img 
                  src={item.imageUrl} 
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                {/* Source badge on image */}
                {item.source && (
                  <Badge className={`absolute top-2 left-2 ${getSourceColor(item.source)} text-white text-xs`}>
                    {item.source}
                  </Badge>
                )}
              </div>
            )}
            
            <div className="p-4">
              <CardHeader className="pb-2 px-0 pt-0">
                <div className="flex justify-between items-start gap-2">
                  <CardTitle className="text-base font-semibold text-white line-clamp-2 leading-tight">
                    {item.title}
                  </CardTitle>
                  {item.category && !item.imageUrl && (
                    <Badge variant="source" className={`${getCategoryColor(item.category)} shrink-0`}>
                      {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-xs text-gray-400 mt-1">
                  {new Date(item.pubDate).toLocaleDateString(undefined, { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </CardDescription>
              </CardHeader>
              
              {item.description && (
                <CardContent className="text-sm text-gray-300 pb-2 px-0">
                  {stripHtml(item.description).slice(0, 100)}
                  {stripHtml(item.description).length > 100 ? '...' : ''}
                </CardContent>
              )}
              
              <CardFooter className="px-0 pt-2 flex items-center justify-between">
                <a 
                  href={item.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[#9b87f5] hover:text-[#b8a5ff] text-sm font-medium transition-colors"
                >
                  Read on {item.source || 'Source'} <ExternalLink className="h-3 w-3" />
                </a>
                
                {/* Marca credit link */}
                {item.source === 'Marca' && (
                  <a 
                    href="https://www.marca.com/en/football.html" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    via Marca
                  </a>
                )}
              </CardFooter>
            </div>
          </Card>
        ))}
      </div>
      
      {/* Marca credit footer */}
      <div className="mt-6 pt-4 border-t border-[#343a4d] flex items-center justify-center gap-2">
        <span className="text-xs text-gray-500">Football news powered by</span>
        <a 
          href="https://www.marca.com/en/football.html" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-xs text-red-500 hover:text-red-400 font-medium transition-colors"
        >
          MARCA.com
        </a>
      </div>
    </div>
  );
};

export default NewsSection;
