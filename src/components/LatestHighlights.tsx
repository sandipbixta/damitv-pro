import React from 'react';
import { Play, ExternalLink, Calendar } from 'lucide-react';
import { useHighlights } from '@/hooks/useHighlights';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

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
      <div className="flex items-center justify-between mb-6">
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
          {highlights.length} Videos
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {highlights.map((highlight) => (
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
    </section>
  );
};

export default LatestHighlights;
