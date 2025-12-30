
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
          imageUrl: article.image || 'https://loremflickr.com/480/240/soccer'
        }));
      }
      
      return [];
    } catch (err) {
      console.error('Failed to fetch Marca news:', err);
      return [];
    }
  }, []);
  
  // Move fetchNews to useCallback to prevent unnecessary re-creation
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
      
      // Combine and deduplicate
      const allItems = [...marcaNews, ...rssNews];
      
      if (allItems.length === 0) {
        setError('No news items found. Please try again later.');
      } else {
        // Ensure we have a diverse set of categories when possible
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
      'https://api.allorigins.win/raw?url=https://www.espn.com/espn/rss/news',
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
        
        if (!response.ok) {
          console.warn(`Failed to fetch from ${url}: ${response.status}`);
          continue;
        }
        
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
          if (
            title.toLowerCase().includes('nfl') || 
            description.toLowerCase().includes('nfl') ||
            title.toLowerCase().includes('american football') ||
            description.toLowerCase().includes('american football')
          ) {
            return;
          }
          
          // Find image in media:content or enclosure tags or within description
          let imageUrl = '';
          const mediaContent = item.querySelector('media\\:content, content');
          const enclosure = item.querySelector('enclosure');
          
          if (mediaContent && mediaContent.getAttribute('url')) {
            imageUrl = mediaContent.getAttribute('url') || '';
          } else if (enclosure && enclosure.getAttribute('url') && enclosure.getAttribute('type')?.startsWith('image/')) {
            imageUrl = enclosure.getAttribute('url') || '';
          } else {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = description;
            const img = tempDiv.querySelector('img');
            if (img && img.src) {
              imageUrl = img.src;
            }
          }
          
          if (!imageUrl) {
            imageUrl = 'https://loremflickr.com/480/240/' + 
              (title.toLowerCase().includes('soccer') || title.toLowerCase().includes('football') ? 'soccer' : 'sports');
          }
          
          // Categorize the news item
          let category = "other";
          const lowerTitle = title.toLowerCase();
          const lowerDesc = description.toLowerCase();
          
          if ((lowerTitle.includes('football') && !lowerTitle.includes('nfl')) || 
              lowerTitle.includes('soccer') || 
              lowerTitle.includes('premier league') || 
              lowerTitle.includes('uefa') || 
              lowerTitle.includes('la liga') || 
              (lowerDesc.includes('football') && !lowerDesc.includes('nfl')) || 
              lowerDesc.includes('soccer')) {
            category = "football";
          } else if (lowerTitle.includes('basketball') || 
                     lowerTitle.includes('nba') || 
                     lowerTitle.includes('ncaa') || 
                     lowerDesc.includes('basketball')) {
            category = "basketball";
          } else if (lowerTitle.includes('baseball') || 
                     lowerTitle.includes('mlb') || 
                     lowerDesc.includes('baseball')) {
            category = "baseball";
          } else if (lowerTitle.includes('tennis') || 
                     lowerDesc.includes('tennis')) {
            category = "tennis";
          }
          
          allItems.push({
            title,
            description,
            link,
            pubDate,
            category,
            imageUrl
          });
        });
      } catch (err) {
        console.error(`Error processing feed ${url}:`, err);
      }
    }
    
    return allItems;
  };

  useEffect(() => {
    // Initial fetch
    fetchNews();
    
    // Set up auto-refresh every 30 minutes
    const refreshIntervalId = setInterval(() => {
      console.log('Auto-refreshing news');
      fetchNews();
    }, 30 * 60 * 1000);
    
    // Cleanup function to clear interval when component unmounts
    return () => {
      console.log('Cleaning up news refresh interval');
      clearInterval(refreshIntervalId);
    };
  }, [fetchNews]);

  const handleManualRefresh = () => {
    toast({
      title: "Refreshing News",
      description: "Fetching the latest sports updates...",
    });
    fetchNews();
  };

  // Function to get a diverse set of news items across categories
  const getDiverseNewsSet = (items: NewsItem[]): NewsItem[] => {
    // Prioritize football/soccer news
    const footballNews = items.filter(item => item.category === 'football');
    const otherNews = items.filter(item => item.category !== 'football');
    
    // Create a map of category -> news items for other categories
    const categoryMap: Record<string, NewsItem[]> = {};
    otherNews.forEach(item => {
      if (!categoryMap[item.category || 'other']) {
        categoryMap[item.category || 'other'] = [];
      }
      categoryMap[item.category || 'other'].push(item);
    });
    
    // Result array will start with football news (at least 3 if available)
    const result: NewsItem[] = [];
    
    // Add football news (at least 3 if available)
    for (let i = 0; i < Math.min(3, footballNews.length); i++) {
      result.push(footballNews[i]);
    }
    
    // Then add one from each other main category if available
    const otherCategories = ['basketball', 'baseball', 'tennis', 'other'];
    otherCategories.forEach(category => {
      if (categoryMap[category] && categoryMap[category].length > 0) {
        result.push(categoryMap[category].shift()!);
      }
    });
    
    // If we still need more items to reach at least 5, add more football news
    if (result.length < 5 && footballNews.length > 3) {
      const additionalFootballCount = Math.min(5 - result.length, footballNews.length - 3);
      for (let i = 3; i < 3 + additionalFootballCount; i++) {
        result.push(footballNews[i]);
      }
    }
    
    // If we still don't have enough, add from other categories
    const remainingItems = Object.values(categoryMap).flat();
    while (result.length < 10 && remainingItems.length > 0) {
      result.push(remainingItems.shift()!);
    }
    
    return result;
  };

  // Filter news by active category
  const filteredNews = activeCategory 
    ? newsItems.filter(item => item.category === activeCategory) 
    : newsItems;

  // Strip HTML tags from description
  const stripHtml = (html: string) => {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  // Get category badge color
  const getCategoryColor = (category?: string) => {
    switch(category) {
      case 'football': return 'bg-green-600';
      case 'basketball': return 'bg-orange-600';
      case 'baseball': return 'bg-blue-600';
      case 'tennis': return 'bg-purple-600';
      default: return 'bg-gray-600';
    }
  };

  return (
    <div className="bg-[#242836] rounded-xl p-6 border border-[#343a4d]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          Sports News
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
      
      <div className="space-y-4">
        {filteredNews.length === 0 && !loading && (
          <div className="text-center py-4 text-gray-400">
            No news available for this category. Try another category or check back later.
          </div>
        )}
        
        {filteredNews.map((item, index) => (
          <Card key={index} className="bg-[#1A1F2C] border-[#343a4d]">
            <div className="p-4">
              <CardHeader className="pb-2 px-0 pt-0">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg font-semibold text-white">{item.title}</CardTitle>
                  {item.category && (
                    <Badge variant="source" className={`${getCategoryColor(item.category)} ml-2 whitespace-nowrap`}>
                      {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-xs text-gray-400">
                  {new Date(item.pubDate).toLocaleDateString(undefined, { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-gray-300 pb-2 px-0">
                {stripHtml(item.description).slice(0, 150)}
                {stripHtml(item.description).length > 150 ? '...' : ''}
              </CardContent>
              <CardFooter className="px-0">
                <a href={item.link} target="_blank" rel="noopener noreferrer">
                  <Button variant="link" className="px-0 text-[#9b87f5]" size="sm">
                    Read More <ExternalLink className="ml-1 h-3 w-3" />
                  </Button>
                </a>
              </CardFooter>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default NewsSection;
