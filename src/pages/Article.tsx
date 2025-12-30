import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ExternalLink, Clock, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface ArticleData {
  title: string;
  content: string;
  html: string;
  image: string;
  author: string;
  publishDate: string;
  sourceUrl: string;
  source: string;
}

const Article = () => {
  const [searchParams] = useSearchParams();
  const articleUrl = searchParams.get('url');
  const articleTitle = searchParams.get('title') || 'Article';
  
  const [article, setArticle] = useState<ArticleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArticle = async () => {
      if (!articleUrl) {
        setError('No article URL provided');
        setLoading(false);
        return;
      }

      try {
        console.log('Fetching article:', articleUrl);
        const { data, error: fetchError } = await supabase.functions.invoke('scrape-article', {
          body: { articleUrl }
        });

        if (fetchError) {
          console.error('Error fetching article:', fetchError);
          setError('Failed to load article. Please try again.');
          return;
        }

        if (data?.success && data?.article) {
          setArticle(data.article);
        } else {
          setError(data?.error || 'Failed to load article content');
        }
      } catch (err) {
        console.error('Failed to fetch article:', err);
        setError('Failed to load article. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [articleUrl]);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Convert markdown to simple HTML for display
  const renderContent = (content: string) => {
    if (!content) return null;
    
    // Split into paragraphs and render
    const paragraphs = content.split('\n\n').filter(p => p.trim());
    
    return paragraphs.map((paragraph, index) => {
      // Check for headers
      if (paragraph.startsWith('# ')) {
        return <h1 key={index} className="text-2xl font-bold text-white mt-6 mb-4">{paragraph.slice(2)}</h1>;
      }
      if (paragraph.startsWith('## ')) {
        return <h2 key={index} className="text-xl font-bold text-white mt-5 mb-3">{paragraph.slice(3)}</h2>;
      }
      if (paragraph.startsWith('### ')) {
        return <h3 key={index} className="text-lg font-bold text-white mt-4 mb-2">{paragraph.slice(4)}</h3>;
      }
      
      // Check for images
      const imgMatch = /!\[([^\]]*)\]\(([^)]+)\)/.exec(paragraph);
      if (imgMatch) {
        return (
          <figure key={index} className="my-6">
            <img 
              src={imgMatch[2]} 
              alt={imgMatch[1]} 
              className="w-full rounded-lg"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            {imgMatch[1] && (
              <figcaption className="text-sm text-gray-400 mt-2 text-center">{imgMatch[1]}</figcaption>
            )}
          </figure>
        );
      }
      
      // Check for blockquotes
      if (paragraph.startsWith('> ')) {
        return (
          <blockquote key={index} className="border-l-4 border-[#9b87f5] pl-4 my-4 italic text-gray-300">
            {paragraph.slice(2)}
          </blockquote>
        );
      }
      
      // Check for bold/italic text and links
      let text = paragraph
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/\*([^*]+)\*/g, '<em>$1</em>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-[#9b87f5] hover:underline" target="_blank" rel="noopener noreferrer">$1</a>');
      
      return (
        <p 
          key={index} 
          className="text-gray-200 leading-relaxed mb-4"
          dangerouslySetInnerHTML={{ __html: text }}
        />
      );
    });
  };

  return (
    <PageLayout>
      <Helmet>
        <title>{article?.title || articleTitle} | DamiTV Sports News</title>
        <meta name="description" content={article?.content?.slice(0, 160) || `Read ${articleTitle} on DamiTV`} />
        {article?.image && <meta property="og:image" content={article.image} />}
      </Helmet>

      <div className="max-w-4xl mx-auto py-6 px-4">
        {/* Back button */}
        <Link to="/news" className="inline-flex items-center text-gray-400 hover:text-white mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to News
        </Link>

        {loading && (
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4 bg-[#343a4d]" />
            <Skeleton className="h-64 w-full bg-[#343a4d]" />
            <Skeleton className="h-4 w-full bg-[#343a4d]" />
            <Skeleton className="h-4 w-full bg-[#343a4d]" />
            <Skeleton className="h-4 w-2/3 bg-[#343a4d]" />
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 text-center">
            <p className="text-red-400 mb-4">{error}</p>
            <Link to="/news">
              <Button variant="outline">Return to News</Button>
            </Link>
          </div>
        )}

        {article && !loading && (
          <article className="bg-[#1A1F2C] rounded-xl border border-[#343a4d] overflow-hidden">
            {/* Hero Image */}
            {article.image && (
              <div className="relative h-64 md:h-96 overflow-hidden">
                <img 
                  src={article.image} 
                  alt={article.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1A1F2C] to-transparent" />
              </div>
            )}

            <div className="p-6 md:p-8">
              {/* Source badge */}
              <Badge className="bg-red-600 text-white mb-4">
                {article.source}
              </Badge>

              {/* Title */}
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-4 leading-tight">
                {article.title}
              </h1>

              {/* Meta info */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-6 pb-6 border-b border-[#343a4d]">
                {article.author && (
                  <span className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {article.author}
                  </span>
                )}
                {article.publishDate && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {formatDate(article.publishDate)}
                  </span>
                )}
              </div>

              {/* Article content */}
              <div className="prose prose-invert max-w-none">
                {renderContent(article.content)}
              </div>

              {/* Source credit and link */}
              <div className="mt-8 pt-6 border-t border-[#343a4d]">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="text-sm text-gray-400">
                    This article was originally published on{' '}
                    <a 
                      href={article.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-red-500 hover:text-red-400 font-medium"
                    >
                      {article.source}
                    </a>
                  </div>
                  
                  <a
                    href={article.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                  >
                    Read on {article.source}
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
                
                {/* Marca footer credit */}
                <div className="mt-6 pt-4 border-t border-[#343a4d] text-center">
                  <span className="text-xs text-gray-500">
                    Content sourced from{' '}
                    <a 
                      href="https://www.marca.com/en/football.html"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-red-500 hover:text-red-400 font-medium"
                    >
                      MARCA.com
                    </a>
                    {' '}— All rights belong to the original publisher
                  </span>
                </div>
              </div>
            </div>
          </article>
        )}
      </div>
    </PageLayout>
  );
};

export default Article;
