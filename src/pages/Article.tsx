import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ExternalLink, Clock, User, Loader2, Share2, Bookmark } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

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

  const getSourceColor = (source: string): string => {
    const lowerSource = source?.toLowerCase() || '';
    if (lowerSource.includes('espn')) return 'bg-red-600';
    if (lowerSource.includes('bbc')) return 'bg-amber-600';
    if (lowerSource.includes('sky')) return 'bg-blue-600';
    if (lowerSource.includes('goal')) return 'bg-purple-600';
    if (lowerSource.includes('athletic')) return 'bg-orange-600';
    if (lowerSource.includes('guardian')) return 'bg-blue-800';
    if (lowerSource.includes('fox')) return 'bg-sky-600';
    if (lowerSource.includes('reuters')) return 'bg-orange-500';
    if (lowerSource.includes('yahoo')) return 'bg-violet-600';
    if (lowerSource.includes('deseret')) return 'bg-emerald-600';
    return 'bg-primary';
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article?.title || articleTitle,
          url: window.location.href
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  // Generate NewsArticle structured data
  const generateArticleSchema = () => {
    if (!article) return null;
    
    return {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      "headline": article.title,
      "image": article.image ? [article.image] : [],
      "datePublished": article.publishDate || new Date().toISOString(),
      "dateModified": article.publishDate || new Date().toISOString(),
      "author": {
        "@type": "Person",
        "name": article.author || article.source
      },
      "publisher": {
        "@type": "Organization",
        "name": "DamiTV",
        "logo": {
          "@type": "ImageObject",
          "url": "https://damitv.pro/favicon.png"
        }
      },
      "description": article.content?.slice(0, 160) || '',
      "isBasedOn": article.sourceUrl,
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": `https://damitv.pro/article?url=${encodeURIComponent(articleUrl || '')}`
      }
    };
  };

  // Convert markdown to simple HTML for display
  const renderContent = (content: string) => {
    if (!content) return null;
    
    // Split into paragraphs and render
    const paragraphs = content.split('\n\n').filter(p => p.trim());
    
    return paragraphs.map((paragraph, index) => {
      // Check for headers
      if (paragraph.startsWith('# ')) {
        return <h2 key={index} className="text-2xl font-bold text-foreground mt-8 mb-4">{paragraph.slice(2)}</h2>;
      }
      if (paragraph.startsWith('## ')) {
        return <h2 key={index} className="text-xl font-bold text-foreground mt-6 mb-3">{paragraph.slice(3)}</h2>;
      }
      if (paragraph.startsWith('### ')) {
        return <h3 key={index} className="text-lg font-semibold text-foreground mt-5 mb-2">{paragraph.slice(4)}</h3>;
      }
      
      // Check for images
      const imgMatch = /!\[([^\]]*)\]\(([^)]+)\)/.exec(paragraph);
      if (imgMatch) {
        return (
          <figure key={index} className="my-8">
            <img 
              src={imgMatch[2]} 
              alt={imgMatch[1]} 
              className="w-full rounded-xl shadow-lg"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            {imgMatch[1] && (
              <figcaption className="text-sm text-muted-foreground mt-3 text-center italic">{imgMatch[1]}</figcaption>
            )}
          </figure>
        );
      }
      
      // Check for blockquotes
      if (paragraph.startsWith('> ')) {
        return (
          <blockquote key={index} className="border-l-4 border-primary pl-6 my-6 italic text-muted-foreground bg-muted/30 py-4 pr-4 rounded-r-lg">
            {paragraph.slice(2)}
          </blockquote>
        );
      }
      
      // Check for bold/italic text and links - add nofollow to external links
      let text = paragraph
        .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>')
        .replace(/\*([^*]+)\*/g, '<em>$1</em>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary hover:underline" target="_blank" rel="noopener noreferrer nofollow">$1</a>');
      
      return (
        <p 
          key={index} 
          className="text-muted-foreground leading-relaxed mb-5 text-base"
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
        <meta name="robots" content="noindex, follow" />
        
        {/* Canonical tag pointing to original source */}
        {articleUrl && <link rel="canonical" href={articleUrl} />}
        
        {/* Open Graph */}
        {article?.image && <meta property="og:image" content={article.image} />}
        <meta property="og:title" content={article?.title || articleTitle} />
        <meta property="og:description" content={article?.content?.slice(0, 160) || `Read ${articleTitle} on DamiTV`} />
        <meta property="og:type" content="article" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={article?.title || articleTitle} />
        <meta name="twitter:description" content={article?.content?.slice(0, 160) || `Read ${articleTitle} on DamiTV`} />
        {article?.image && <meta name="twitter:image" content={article.image} />}
        
        {/* Article structured data */}
        {article && (
          <script type="application/ld+json">
            {JSON.stringify(generateArticleSchema())}
          </script>
        )}
      </Helmet>

      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto py-6 px-4 sm:px-6">
          {/* Back button */}
          <Link to="/news" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6 transition-colors text-sm font-medium">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to News
          </Link>

          {loading && (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-muted rounded-full"></div>
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
              </div>
              <p className="text-muted-foreground mt-6 text-sm">Loading article...</p>
            </div>
          )}

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-8 text-center">
              <p className="text-destructive mb-6">{error}</p>
              <Link to="/news">
                <Button variant="outline" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Return to News
                </Button>
              </Link>
            </div>
          )}

          {article && !loading && (
            <article className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
              {/* Hero Image */}
              {article.image && (
                <div className="relative aspect-video overflow-hidden">
                  <img 
                    src={article.image} 
                    alt={article.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).parentElement!.style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                  
                  {/* Source badge on image */}
                  <Badge className={`absolute top-4 left-4 ${getSourceColor(article.source)} text-white border-0`}>
                    {article.source}
                  </Badge>
                </div>
              )}

              <div className="p-6 sm:p-8">
                {/* Source badge if no image */}
                {!article.image && (
                  <Badge className={`${getSourceColor(article.source)} text-white border-0 mb-4`}>
                    {article.source}
                  </Badge>
                )}

                {/* Title */}
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-5 leading-tight">
                  {article.title}
                </h1>

                {/* Meta info */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
                  {article.author && (
                    <span className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {article.author}
                    </span>
                  )}
                  {article.publishDate && (
                    <span className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <time dateTime={article.publishDate}>{formatDate(article.publishDate)}</time>
                    </span>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-3 mb-6">
                  <Button variant="outline" size="sm" onClick={handleShare} className="gap-2">
                    <Share2 className="h-4 w-4" />
                    Share
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Bookmark className="h-4 w-4" />
                    Save
                  </Button>
                </div>

                <Separator className="mb-8" />

                {/* Article content */}
                <div className="prose prose-lg max-w-none">
                  {renderContent(article.content)}
                </div>

                <Separator className="my-8" />

                {/* Source credit and link */}
                <div className="bg-muted/50 rounded-xl p-6">
                  <p className="text-sm text-muted-foreground mb-4">
                    This article was originally published on{' '}
                    <a 
                      href={article.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="text-primary hover:underline font-medium"
                    >
                      {article.source}
                    </a>
                  </p>
                  
                  <a
                    href={article.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-lg transition-colors text-sm font-medium"
                  >
                    Read Original Article
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
                
                {/* Footer credit */}
                <div className="mt-8 text-center">
                  <p className="text-xs text-muted-foreground">
                    Content sourced from original publishers — All rights reserved
                  </p>
                </div>
              </div>
            </article>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default Article;
