import React, { useState, useMemo } from 'react';
import { Play, X, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useHighlights, Highlight } from '@/hooks/useHighlights';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { format } from 'date-fns';
import PageLayout from '@/components/PageLayout';
import SEOMetaTags from '@/components/SEOMetaTags';

const HighlightCard: React.FC<{
  highlight: Highlight;
  onPlay: (highlight: Highlight) => void;
}> = ({ highlight, onPlay }) => {
  const formattedDate = highlight.date ? format(new Date(highlight.date), 'MMM d, yyyy') : '';

  return (
    <div
      className="group cursor-pointer h-full"
      onClick={() => onPlay(highlight)}
    >
      <div className="relative overflow-hidden rounded-lg bg-card border border-border/40 transition-all duration-300 hover:border-primary/50 hover:bg-card/90 h-full flex flex-col">
        <div className="relative aspect-video overflow-hidden flex-shrink-0">
          {highlight.thumbnail ? (
            <img
              src={highlight.thumbnail}
              alt={`${highlight.homeTeam} vs ${highlight.awayTeam}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-card via-muted to-card flex items-center justify-center gap-4">
              {highlight.homeTeamBadge && (
                <img src={highlight.homeTeamBadge} alt={highlight.homeTeam} className="w-12 h-12 object-contain" />
              )}
              <span className="text-muted-foreground font-bold">vs</span>
              {highlight.awayTeamBadge && (
                <img src={highlight.awayTeamBadge} alt={highlight.awayTeam} className="w-12 h-12 object-contain" />
              )}
            </div>
          )}

          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="bg-primary rounded-full p-4 shadow-lg">
              <Play className="h-6 w-6 text-primary-foreground fill-current" />
            </div>
          </div>

          {highlight.homeScore !== null && highlight.awayScore !== null && (
            <div className="absolute bottom-2 left-2 bg-primary text-primary-foreground text-xs font-bold px-2.5 py-1 rounded">
              {highlight.homeScore} - {highlight.awayScore}
            </div>
          )}

          <div className="absolute top-2 right-2 bg-destructive text-destructive-foreground text-[10px] font-bold uppercase px-2 py-1 rounded tracking-wide flex items-center gap-1">
            <Play className="h-3 w-3 fill-current" />
            Highlights
          </div>
        </div>

        <div className="p-4 flex flex-col flex-1 gap-2">
          <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-bold truncate">
            {highlight.sport} • {highlight.league}
          </p>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full overflow-hidden bg-muted/50 flex items-center justify-center flex-shrink-0">
                {highlight.homeTeamBadge ? (
                  <img src={highlight.homeTeamBadge} alt={highlight.homeTeam} className="w-full h-full object-contain" />
                ) : (
                  <span className="text-[9px] font-bold text-muted-foreground">{highlight.homeTeam?.substring(0, 2).toUpperCase()}</span>
                )}
              </div>
              <span className="text-foreground font-bold text-sm truncate">{highlight.homeTeam}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full overflow-hidden bg-muted/50 flex items-center justify-center flex-shrink-0">
                {highlight.awayTeamBadge ? (
                  <img src={highlight.awayTeamBadge} alt={highlight.awayTeam} className="w-full h-full object-contain" />
                ) : (
                  <span className="text-[9px] font-bold text-muted-foreground">{highlight.awayTeam?.substring(0, 2).toUpperCase()}</span>
                )}
              </div>
              <span className="text-foreground font-bold text-sm truncate">{highlight.awayTeam}</span>
            </div>
          </div>

          <div className="mt-auto pt-3 border-t border-border/40">
            <p className="text-xs text-muted-foreground font-medium">{formattedDate}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const LoadingSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
    {[...Array(12)].map((_, i) => (
      <div key={i} className="bg-card border border-border/40 rounded-lg overflow-hidden">
        <Skeleton className="aspect-video" />
        <div className="p-4">
          <Skeleton className="h-3 w-full mb-3" />
          <Skeleton className="h-4 w-3/4 mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    ))}
  </div>
);

const Highlights: React.FC = () => {
  const { highlights, sports, loading, error } = useHighlights();
  const [selectedSport, setSelectedSport] = useState('all');
  const [playingHighlight, setPlayingHighlight] = useState<Highlight | null>(null);

  const filteredHighlights = useMemo(() => {
    if (selectedSport === 'all') return highlights;
    return highlights.filter((h) => h.sport === selectedSport);
  }, [highlights, selectedSport]);

  return (
    <PageLayout>
      <SEOMetaTags
        title="Sports Highlights - Watch Latest Match Videos | DamiTV"
        description="Watch the latest sports highlights from football, basketball, tennis, and more. Free HD match videos and goals from top leagues worldwide."
        keywords="sports highlights, match highlights, football goals, basketball highlights, free sports videos"
      />

      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Back to Home</span>
          </Link>
          
          <div className="flex items-center justify-between">
            <h1 className="text-2xl md:text-3xl font-extrabold text-foreground uppercase tracking-wider flex items-center gap-3">
              <Play className="h-7 w-7 text-primary" />
              All Highlights
            </h1>
            {!loading && (
              <Badge variant="secondary" className="text-sm px-3 py-1">
                {filteredHighlights.length} Videos
              </Badge>
            )}
          </div>
        </div>

        {/* Sport Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
          <Button
            variant={selectedSport === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedSport('all')}
            className={`flex-shrink-0 font-semibold ${
              selectedSport === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-card hover:bg-accent border-border'
            }`}
          >
            All Sports
          </Button>
          {sports.map((sport) => (
            <Button
              key={sport}
              variant={selectedSport === sport ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedSport(sport)}
              className={`flex-shrink-0 font-semibold ${
                selectedSport === sport
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card hover:bg-accent border-border'
              }`}
            >
              {sport}
            </Button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <LoadingSkeleton />
        ) : error ? (
          <div className="text-center py-16 text-muted-foreground">
            Failed to load highlights. Please try again later.
          </div>
        ) : filteredHighlights.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            No highlights available for this sport
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredHighlights.map((highlight) => (
              <HighlightCard
                key={highlight.id}
                highlight={highlight}
                onPlay={setPlayingHighlight}
              />
            ))}
          </div>
        )}
      </div>

      {/* Video Player Modal */}
      <Dialog open={!!playingHighlight} onOpenChange={() => setPlayingHighlight(null)}>
        <DialogContent className="max-w-4xl w-full p-0 bg-black border-none overflow-hidden">
          <DialogTitle className="sr-only">
            {playingHighlight ? `${playingHighlight.homeTeam} vs ${playingHighlight.awayTeam} Highlights` : 'Match Highlights'}
          </DialogTitle>
          {playingHighlight && (
            <div className="relative">
              <button
                onClick={() => setPlayingHighlight(null)}
                className="absolute top-2 right-2 z-10 bg-black/70 hover:bg-black/90 rounded-full p-2 text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="bg-card p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {playingHighlight.homeTeamBadge && (
                    <img src={playingHighlight.homeTeamBadge} alt={playingHighlight.homeTeam} className="w-10 h-10 object-contain" />
                  )}
                  <span className="font-bold text-foreground">{playingHighlight.homeTeam}</span>
                  <span className="text-primary font-bold text-lg">
                    {playingHighlight.homeScore} - {playingHighlight.awayScore}
                  </span>
                  <span className="font-bold text-foreground">{playingHighlight.awayTeam}</span>
                  {playingHighlight.awayTeamBadge && (
                    <img src={playingHighlight.awayTeamBadge} alt={playingHighlight.awayTeam} className="w-10 h-10 object-contain" />
                  )}
                </div>
                <Badge variant="outline">{playingHighlight.league}</Badge>
              </div>

              <div className="aspect-video bg-black">
                {playingHighlight.embedUrl.includes('youtube.com/embed') ? (
                  <iframe
                    src={`${playingHighlight.embedUrl}?autoplay=1&rel=0`}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={`${playingHighlight.homeTeam} vs ${playingHighlight.awayTeam}`}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white">
                    <a
                      href={playingHighlight.video}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-primary hover:bg-primary/90 px-6 py-3 rounded-lg font-bold transition-colors"
                    >
                      <Play className="h-5 w-5" />
                      Watch on External Site
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
};

export default Highlights;
