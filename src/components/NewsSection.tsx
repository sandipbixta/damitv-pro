// News section - simplified (uses RSS feeds only, no Supabase)
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { useToast } from '../hooks/use-toast';

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
  const { toast } = useToast();

  const sportCategories = [
    { name: "All", value: null },
    { name: "Football/Soccer", value: "football" },
  ];

  // Fetch RSS feeds only (no Supabase)
  const fetchRSSNews = async (): Promise<NewsItem[]> => {
    const feedUrls = [
      'https://api.allorigins.win/raw?url=https://www.espn.com/espn/rss/soccer/news',
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

          allItems.push({
            title,
            description,
            link,
            pubDate,
            category: 'football',
            source: 'ESPN'
          });
        });
      } catch (err) {
        console.error(`Error processing feed ${url}:`, err);
      }
    }

    return allItems.slice(0, 12);
  };

  const fetchNews = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const rssNews = await fetchRSSNews();

      if (rssNews.length === 0) {
        setError('No news items found.');
      } else {
        setNewsItems(rssNews);
      }
    } catch (err) {
      setError('Failed to load news.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  const handleManualRefresh = () => {
    toast({ title: "Refreshing News", description: "Fetching the latest sports updates..." });
    fetchNews();
  };

  const filteredNews = activeCategory
    ? newsItems.filter(item => item.category === activeCategory)
    : newsItems;

  const stripHtml = (html: string) => {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
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

      {loading && (
        <div className="flex justify-center my-8">
          <div className="h-8 w-8 border-4 border-t-primary rounded-full animate-spin"></div>
        </div>
      )}

      {error && <div className="text-red-500 text-center py-4">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredNews.map((item, index) => (
          <Card key={index} className="bg-[#1A1F2C] border-[#343a4d] overflow-hidden hover:border-[#9b87f5] transition-colors">
            <div className="p-4">
              <CardHeader className="pb-2 px-0 pt-0">
                <CardTitle className="text-base font-semibold text-white line-clamp-2 leading-tight">
                  {item.title}
                </CardTitle>
                <CardDescription className="text-xs text-gray-400 mt-1">
                  {new Date(item.pubDate).toLocaleDateString()}
                </CardDescription>
              </CardHeader>

              {item.description && (
                <CardContent className="text-sm text-gray-300 pb-2 px-0">
                  {stripHtml(item.description).slice(0, 100)}...
                </CardContent>
              )}

              <CardFooter className="px-0 pt-2">
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[#9b87f5] hover:text-[#b8a5ff] text-sm font-medium"
                >
                  Read on {item.source} <ExternalLink className="h-3 w-3" />
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
