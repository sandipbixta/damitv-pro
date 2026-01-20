import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Newspaper, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

interface NewsArticle {
  title: string;
  summary: string;
  url: string;
  image: string;
  source: string;
  publishedAt?: string;
}

const getSourceColor = (source: string): string => {
  const lowerSource = source.toLowerCase();
  if (lowerSource.includes('espn')) return 'bg-red-600';
  if (lowerSource.includes('bbc')) return 'bg-amber-600';
  if (lowerSource.includes('sky')) return 'bg-blue-600';
  if (lowerSource.includes('goal')) return 'bg-purple-600';
  if (lowerSource.includes('athletic')) return 'bg-orange-600';
  if (lowerSource.includes('guardian')) return 'bg-blue-800';
  if (lowerSource.includes('fox')) return 'bg-sky-600';
  if (lowerSource.includes('reuters')) return 'bg-orange-500';
  if (lowerSource.includes('yahoo')) return 'bg-violet-600';
  return 'bg-primary';
};

const NewsArticleCard: React.FC<{ article: NewsArticle; index: number }> = ({ article, index }) => {
  const encodedUrl = encodeURIComponent(article.url);
  const encodedTitle = encodeURIComponent(article.title);
  const articleLink = `/article?url=${encodedUrl}&title=${encodedTitle}`;
  
  return (
    <Link 
      to={articleLink} 
      className="group cursor-pointer h-full block"
    >
      <div className="relative overflow-hidden rounded-lg bg-card border border-border/40 transition-all duration-300 hover:border-primary/50 hover:bg-card/90 h-full flex flex-col">
        {/* Thumbnail Section */}
        <div className="relative aspect-video overflow-hidden flex-shrink-0">
          {article.image ? (
            <img 
              src={article.image} 
              alt={article.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder.svg';
              }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-card via-muted to-card flex items-center justify-center">
              <Newspaper className="h-10 w-10 text-muted-foreground" />
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

          {/* Source badge */}
          <div className={`absolute top-2 right-2 ${getSourceColor(article.source)} text-white text-[9px] font-bold uppercase px-1.5 py-0.5 rounded tracking-wide`}>
            {article.source}
          </div>

          {/* Read indicator on hover */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="bg-primary rounded-full p-3 shadow-lg">
              <ArrowRight className="h-5 w-5 text-primary-foreground" />
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="p-3 flex flex-col flex-1 gap-2">
          {/* Category */}
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold truncate">
            Sports • News
          </p>

          {/* Title */}
          <h3 className="text-foreground font-bold text-xs line-clamp-2 group-hover:text-primary transition-colors">
            {article.title}
          </h3>

          {/* Summary */}
          <p className="text-[11px] text-muted-foreground line-clamp-2">
            {article.summary}
          </p>

          {/* Read more */}
          <div className="mt-auto pt-2 border-t border-border/40">
            <p className="text-[10px] text-primary font-medium flex items-center gap-1">
              Read Full Article <ArrowRight className="h-3 w-3" />
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
};

const PerplexityNews: React.FC = () => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchArticles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching sports news...');
      
      const { data, error: fetchError } = await supabase.functions.invoke('fetch-football-news');
      
      if (fetchError) {
        console.error('Error fetching news:', fetchError);
        // Don't show error to user - just hide section
        setArticles([]);
        return;
      }
      
      // Accept articles regardless of source (cached, fallback, or fresh)
      if (data?.articles && data.articles.length > 0) {
        console.log('Received articles:', data.articles.length, data.cached ? '(cached)' : '', data.fallback ? '(fallback)' : '');
        setArticles(data.articles);
      } else {
        // Just hide the section if no articles
        setArticles([]);
      }
    } catch (err) {
      console.error('Failed to fetch news:', err);
      // Don't show error - just hide section
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  // Hide section if no articles and not loading
  if (!loading && articles.length === 0) {
    return null;
  }

  return (
    <section className="mb-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Newspaper className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-extrabold tracking-tight text-foreground uppercase">
            Sports News
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={fetchArticles} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Link to="/news">
            <Button variant="outline" size="sm" className="text-xs">
              View All <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Articles Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-video w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Newspaper className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No news articles available at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {articles.map((article, index) => (
            <NewsArticleCard key={index} article={article} index={index} />
          ))}
        </div>
      )}

      {/* Footer Credit */}
      <div className="mt-4 text-center">
        <p className="text-xs text-muted-foreground">
          Powered by NewsAPI • Real-time sports news
        </p>
      </div>
    </section>
  );
};

export default PerplexityNews;
