// Article page - redirects to external source (no Supabase scraping)
import React, { useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ExternalLink } from 'lucide-react';

const Article = () => {
  const [searchParams] = useSearchParams();
  const articleUrl = searchParams.get('url');
  const articleTitle = searchParams.get('title') || 'Article';

  // Auto-redirect to original source after 2 seconds
  useEffect(() => {
    if (articleUrl) {
      const timer = setTimeout(() => {
        window.location.href = articleUrl;
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [articleUrl]);

  if (!articleUrl) {
    return (
      <PageLayout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">No article URL provided</p>
            <Link to="/news">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to News
              </Button>
            </Link>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <h1 className="text-xl font-bold text-foreground mb-4">{decodeURIComponent(articleTitle)}</h1>
          <p className="text-muted-foreground mb-6">Redirecting you to the original article...</p>
          <a
            href={articleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg transition-colors font-medium"
          >
            Read Article Now
            <ExternalLink className="h-4 w-4" />
          </a>
          <div className="mt-6">
            <Link to="/news" className="text-sm text-muted-foreground hover:text-foreground">
              ← Back to News
            </Link>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default Article;
