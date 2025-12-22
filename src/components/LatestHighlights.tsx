import React, { useState, useMemo } from 'react';
import { Play, Calendar, Filter } from 'lucide-react';
import { useHighlights } from '@/hooks/useHighlights';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

const LEAGUE_FILTERS = [
  { id: 'all', label: 'All Leagues' },
  { id: 'English Premier League', label: 'Premier League' },
  { id: 'Spanish La Liga', label: 'La Liga' },
  { id: 'UEFA Champions League', label: 'Champions League' },
  { id: 'German Bundesliga', label: 'Bundesliga' },
  { id: 'Italian Serie A', label: 'Serie A' },
  { id: 'French Ligue 1', label: 'Ligue 1' },
];

const HighlightCard: React.FC<{
  homeTeam: string;
  awayTeam: string;
  homeScore: string | null;
  awayScore: string | null;
  date: string;
  league: string;
  homeTeamBadge: string | null;
  awayTeamBadge: string | null;
  thumbnail: string | null;
  video: string;
}> = ({
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  date,
  league,
  homeTeamBadge,
  awayTeamBadge,
  thumbnail,
  video,
}) => {
  const handleClick = () => {
    window.open(video, '_blank', 'noopener,noreferrer');
  };

  const formattedDate = date ? format(new Date(date), 'MMM d, yyyy') : '';

  return (
    <Card
      className="group cursor-pointer bg-card hover:bg-accent/50 border-border transition-all duration-300 hover:scale-[1.02] hover:shadow-xl overflow-hidden"
      onClick={handleClick}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-muted overflow-hidden">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={`${homeTeam} vs ${awayTeam}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
            <div className="flex items-center gap-4">
              {homeTeamBadge && (
                <img src={homeTeamBadge} alt={homeTeam} className="w-12 h-12 object-contain" />
              )}
              <span className="text-2xl font-bold text-muted-foreground">VS</span>
              {awayTeamBadge && (
                <img src={awayTeamBadge} alt={awayTeam} className="w-12 h-12 object-contain" />
              )}
            </div>
          </div>
        )}
        
        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="bg-primary rounded-full p-4 shadow-lg">
            <Play className="h-8 w-8 text-primary-foreground fill-current" />
          </div>
        </div>

        {/* Score badge */}
        {homeScore !== null && awayScore !== null && (
          <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground font-bold text-sm px-2 py-1">
            {homeScore} - {awayScore}
          </Badge>
        )}
      </div>

      <CardContent className="p-4">
        {/* Teams */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {homeTeamBadge && (
              <img src={homeTeamBadge} alt={homeTeam} className="w-6 h-6 object-contain flex-shrink-0" />
            )}
            <span className="font-semibold text-foreground truncate text-sm">{homeTeam}</span>
          </div>
          <span className="text-muted-foreground text-xs font-medium">vs</span>
          <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
            <span className="font-semibold text-foreground truncate text-sm text-right">{awayTeam}</span>
            {awayTeamBadge && (
              <img src={awayTeamBadge} alt={awayTeam} className="w-6 h-6 object-contain flex-shrink-0" />
            )}
          </div>
        </div>

        {/* League and date */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="truncate">{league}</span>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Calendar className="h-3 w-3" />
            <span>{formattedDate}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const LoadingSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
    {[...Array(8)].map((_, i) => (
      <Card key={i} className="bg-card border-border overflow-hidden">
        <Skeleton className="aspect-video" />
        <CardContent className="p-4">
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-3 w-3/4" />
        </CardContent>
      </Card>
    ))}
  </div>
);

const LatestHighlights: React.FC = () => {
  const { highlights, loading, error } = useHighlights();
  const [selectedLeague, setSelectedLeague] = useState('all');

  const filteredHighlights = useMemo(() => {
    if (selectedLeague === 'all') return highlights;
    return highlights.filter((h) => h.league === selectedLeague);
  }, [highlights, selectedLeague]);

  // Get available leagues from the highlights
  const availableLeagues = useMemo(() => {
    const leagues = new Set(highlights.map((h) => h.league));
    return LEAGUE_FILTERS.filter((f) => f.id === 'all' || leagues.has(f.id));
  }, [highlights]);

  if (loading) {
    return (
      <section className="mb-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-extrabold text-foreground uppercase tracking-wider">
              Latest Highlights
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Watch the best moments from recent matches
            </p>
          </div>
        </div>
        <LoadingSkeleton />
      </section>
    );
  }

  if (error || highlights.length === 0) {
    return null; // Don't show section if no highlights
  }

  return (
    <section className="mb-10">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
          <h2 className="text-xl md:text-2xl font-extrabold text-foreground uppercase tracking-wider flex items-center gap-2">
            <Play className="h-6 w-6 text-primary" />
            Latest Highlights
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Watch the best moments from recent matches
          </p>
        </div>
          <Badge variant="secondary" className="hidden sm:flex">
            {filteredHighlights.length} Videos
          </Badge>
        </div>

        {/* League Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          {availableLeagues.map((league) => (
            <Button
              key={league.id}
              variant={selectedLeague === league.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedLeague(league.id)}
              className={`flex-shrink-0 text-xs font-semibold transition-all ${
                selectedLeague === league.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card hover:bg-accent border-border'
              }`}
            >
              {league.label}
            </Button>
          ))}
        </div>
      </div>

      {filteredHighlights.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No highlights available for this league
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredHighlights.map((highlight) => (
          <HighlightCard
            key={highlight.id}
            homeTeam={highlight.homeTeam}
            awayTeam={highlight.awayTeam}
            homeScore={highlight.homeScore}
            awayScore={highlight.awayScore}
            date={highlight.date}
            league={highlight.league}
            homeTeamBadge={highlight.homeTeamBadge}
            awayTeamBadge={highlight.awayTeamBadge}
            thumbnail={highlight.thumbnail}
            video={highlight.video}
          />
          ))}
        </div>
      )}
    </section>
  );
};

export default LatestHighlights;
