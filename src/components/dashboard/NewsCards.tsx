import { NewsArticle } from '@/hooks/useSportsDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Newspaper, ExternalLink, AlertCircle } from 'lucide-react';

interface NewsCardsProps {
  news: NewsArticle[];
  loading: boolean;
  error: string | null;
}

export function NewsCards({ news, loading, error }: NewsCardsProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Newspaper className="w-5 h-5 text-primary" />
          Latest Sports News
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="flex items-center gap-2 text-destructive p-4">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        ) : loading && news.length === 0 ? (
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        ) : news.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No news available</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {news.map((article, index) => (
              <a
                key={index}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group block p-4 rounded-lg border bg-card hover:bg-accent transition-colors"
              >
                <h4 className="font-semibold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                  {article.title}
                </h4>
                <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                  {article.summary}
                </p>
                <span className="inline-flex items-center gap-1 text-xs text-primary">
                  Read more
                  <ExternalLink className="w-3 h-3" />
                </span>
              </a>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
