import { useSportsDashboard } from '@/hooks/useSportsDashboard';
import { HeroCarouselDashboard } from './HeroCarouselDashboard';
import { LiveScoresTable } from './LiveScoresTable';
import { FixturesTable } from './FixturesTable';
import { StandingsTable } from './StandingsTable';
import { NewsCards } from './NewsCards';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Zap } from 'lucide-react';
import { format } from 'date-fns';

export function SportsDashboard() {
  const {
    liveMatches,
    fixtures,
    standings,
    news,
    loading,
    error,
    lastUpdated,
    refreshAll,
    isAnyLoading
  } = useSportsDashboard();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Zap className="w-7 h-7 text-primary" />
            Melbourne Sports Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Live scores, fixtures & standings • A-League, AFL, EPL, Cricket
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-muted-foreground">
              Updated: {format(lastUpdated, 'HH:mm:ss')}
            </span>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshAll}
            disabled={isAnyLoading}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isAnyLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Auto-refresh indicator */}
      <Badge variant="secondary" className="text-xs">
        <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" />
        Auto-refreshes every 60 seconds
      </Badge>

      {/* Hero Carousel */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Live & Recent Matches</h2>
        <HeroCarouselDashboard matches={liveMatches} loading={loading.live} />
      </section>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Live Scores */}
        <LiveScoresTable 
          matches={liveMatches} 
          loading={loading.live} 
          error={error.live} 
        />

        {/* Fixtures */}
        <FixturesTable 
          fixtures={fixtures} 
          loading={loading.fixtures} 
          error={error.fixtures} 
        />
      </div>

      {/* Standings */}
      <StandingsTable 
        standings={standings} 
        loading={loading.standings} 
        error={error.standings} 
      />

      {/* News */}
      <NewsCards 
        news={news} 
        loading={loading.news} 
        error={error.news} 
      />

      {/* Footer */}
      <footer className="text-center py-6 border-t">
        <p className="text-sm text-muted-foreground">
          Powered by{' '}
          <a 
            href="https://perplexity.ai" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Perplexity AI
          </a>
        </p>
      </footer>
    </div>
  );
}
