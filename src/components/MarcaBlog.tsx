import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Loader2, Newspaper } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface NewsArticle {
  title: string;
  description: string;
  link: string;
  image: string;
  source: string;
}

const getSourceColor = (source: string) => {
  switch (source.toLowerCase()) {
    case 'marca':
      return 'bg-red-600';
    case 'goal':
      return 'bg-blue-600';
    default:
      return 'bg-primary';
  }
};

const NewsArticleCard: React.FC<{ article: NewsArticle; index: number }> = ({ article, index }) => {
  const encodedUrl = encodeURIComponent(article.link);
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
            Football • News
          </p>

          {/* Title */}
          <h3 className="text-foreground font-bold text-xs line-clamp-2 group-hover:text-primary transition-colors">
            {article.title}
          </h3>

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

const MarcaBlog: React.FC = () => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchArticles = useCallback(async () => {
    try {
      console.log('Fetching news articles...');
      const { data, error: fetchError } = await supabase.functions.invoke('scrape-news');
      
      if (fetchError) {
        console.error('Error fetching articles:', fetchError);
        setError('Failed to load articles');
        return;
      }
      
      if (data?.success && data?.articles) {
        console.log('Received articles:', data.articles.length);
        setArticles(data.articles.slice(0, 6));
      }
    } catch (err) {
      console.error('Failed to fetch articles:', err);
      setError('Failed to load articles');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  if (loading) {
    return (
      <section className="mb-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl md:text-2xl font-extrabold text-foreground uppercase tracking-wider">
            Football News
          </h2>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </section>
    );
  }

  if (error || articles.length === 0) {
    return null;
  }

  return (
    <section className="mb-10">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-xl md:text-2xl font-extrabold text-foreground uppercase tracking-wider">
            Football News
          </h2>
          <div className="flex gap-1">
            <span className="text-xs text-white font-medium bg-red-600 px-2 py-0.5 rounded">
              Marca
            </span>
            <span className="text-xs text-white font-medium bg-blue-600 px-2 py-0.5 rounded">
              Goal
            </span>
          </div>
        </div>
        <Link 
          to="/news" 
          className="text-sm text-primary hover:text-primary/80 font-bold uppercase flex items-center gap-1"
        >
          View All <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {articles.map((article, index) => (
          <NewsArticleCard key={`${article.link}-${index}`} article={article} index={index} />
        ))}
      </div>

      {/* Credits */}
      <div className="mt-4 text-center">
        <span className="text-xs text-muted-foreground">
          News sourced from{' '}
          <a 
            href="https://www.marca.com/en/football.html"
            target="_blank"
            rel="noopener noreferrer"
            className="text-red-500 hover:text-red-400 font-medium"
          >
            MARCA.com
          </a>
          {' & '}
          <a 
            href="https://www.goal.com/en-au"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-400 font-medium"
          >
            Goal.com
          </a>
        </span>
      </div>
    </section>
  );
};

export default MarcaBlog;
