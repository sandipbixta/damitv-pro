import React, { useState, useMemo } from 'react';
import { Play, X, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useHighlights, Highlight } from '@/hooks/useHighlights';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { format } from 'date-fns';
const HighlightCard: React.FC<{
  highlight: Highlight;
  onPlay: (highlight: Highlight) => void;
}> = ({
  highlight,
  onPlay
}) => {
  const formattedDate = highlight.date ? format(new Date(highlight.date), 'MMM d') : '';
  return <div className="group cursor-pointer h-full" onClick={() => onPlay(highlight)}>
      <div className="relative overflow-hidden rounded-lg bg-card border border-border/40 transition-all duration-300 hover:border-primary/50 hover:bg-card/90 h-full flex flex-col">
        {/* Thumbnail Section */}
        <div className="relative aspect-video overflow-hidden flex-shrink-0">
          {highlight.thumbnail ? <img src={highlight.thumbnail} alt={`${highlight.homeTeam} vs ${highlight.awayTeam}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" /> : <div className="w-full h-full bg-gradient-to-br from-card via-muted to-card flex items-center justify-center gap-4">
              {highlight.homeTeamBadge && <img src={highlight.homeTeamBadge} alt={highlight.homeTeam} className="w-10 h-10 object-contain" />}
              <span className="text-muted-foreground font-bold text-sm">vs</span>
              {highlight.awayTeamBadge && <img src={highlight.awayTeamBadge} alt={highlight.awayTeam} className="w-10 h-10 object-contain" />}
            </div>}

          {/* Gradient overlay */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

          {/* Play button overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="bg-primary rounded-full p-3 shadow-lg">
              <Play className="h-5 w-5 text-primary-foreground fill-current" />
            </div>
          </div>

          {/* Score badge */}
          {highlight.homeScore !== null && highlight.awayScore !== null && <div className="absolute bottom-2 left-2 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded">
              {highlight.homeScore} - {highlight.awayScore}
            </div>}

          {/* Highlight badge */}
          <div className="absolute top-2 right-2 bg-destructive text-destructive-foreground text-[9px] font-bold uppercase px-1.5 py-0.5 rounded tracking-wide flex items-center gap-1">
            <Play className="h-2.5 w-2.5 fill-current" />
            Highlights
          </div>
        </div>

        {/* Info Section */}
        <div className="p-3 flex flex-col flex-1 gap-2">
          {/* Sport & League */}
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold truncate">
            {highlight.sport} • {highlight.league}
          </p>

          {/* Teams */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full overflow-hidden bg-muted/50 flex items-center justify-center flex-shrink-0">
                {highlight.homeTeamBadge ? <img src={highlight.homeTeamBadge} alt={highlight.homeTeam} className="w-full h-full object-contain" /> : <span className="text-[8px] font-bold text-muted-foreground">{highlight.homeTeam?.substring(0, 2).toUpperCase()}</span>}
              </div>
              <span className="text-foreground font-bold text-xs truncate">{highlight.homeTeam}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full overflow-hidden bg-muted/50 flex items-center justify-center flex-shrink-0">
                {highlight.awayTeamBadge ? <img src={highlight.awayTeamBadge} alt={highlight.awayTeam} className="w-full h-full object-contain" /> : <span className="text-[8px] font-bold text-muted-foreground">{highlight.awayTeam?.substring(0, 2).toUpperCase()}</span>}
              </div>
              <span className="text-foreground font-bold text-xs truncate">{highlight.awayTeam}</span>
            </div>
          </div>

          {/* Date */}
          <div className="mt-auto pt-2 border-t border-border/40">
            <p className="text-[10px] text-muted-foreground font-medium">{formattedDate}</p>
          </div>
        </div>
      </div>
    </div>;
};
const LoadingSkeleton = () => <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
    {[...Array(6)].map((_, i) => <div key={i} className="bg-card border border-border/40 rounded-lg overflow-hidden">
        <Skeleton className="aspect-video" />
        <div className="p-3">
          <Skeleton className="h-3 w-full mb-2" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      </div>)}
  </div>;
const LatestHighlights: React.FC = () => {
  const {
    highlights,
    sports,
    loading,
    error
  } = useHighlights();
  const [selectedSport, setSelectedSport] = useState('all');
  const [playingHighlight, setPlayingHighlight] = useState<Highlight | null>(null);
  const filteredHighlights = useMemo(() => {
    if (selectedSport === 'all') return highlights;
    return highlights.filter(h => h.sport === selectedSport);
  }, [highlights, selectedSport]);
  if (loading) {
    return <section className="mb-10">
        <div className="flex flex-col gap-4 mb-4">
          <h2 className="text-xl md:text-2xl font-extrabold text-foreground uppercase tracking-wider flex items-center gap-2">
            <Play className="h-5 w-5 text-primary" />
            Latest Highlights
          </h2>
        </div>
        <LoadingSkeleton />
      </section>;
  }
  if (error || highlights.length === 0) {
    return null;
  }
  return <>
      <section className="mb-10">
        <div className="flex flex-col gap-4 mb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl md:text-2xl font-extrabold text-foreground uppercase tracking-wider flex items-center gap-2">
              
              Latest Highlights
            </h2>
            <Badge variant="secondary" className="hidden sm:flex text-xs">
              {filteredHighlights.length} Videos
            </Badge>
          </div>

          {/* Sport Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <Button variant={selectedSport === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setSelectedSport('all')} className={`flex-shrink-0 text-xs font-semibold h-7 px-3 ${selectedSport === 'all' ? 'bg-primary text-primary-foreground' : 'bg-card hover:bg-accent border-border'}`}>
              All Sports
            </Button>
            {sports.map(sport => <Button key={sport} variant={selectedSport === sport ? 'default' : 'outline'} size="sm" onClick={() => setSelectedSport(sport)} className={`flex-shrink-0 text-xs font-semibold h-7 px-3 ${selectedSport === sport ? 'bg-primary text-primary-foreground' : 'bg-card hover:bg-accent border-border'}`}>
                {sport}
              </Button>)}
          </div>
        </div>

        {filteredHighlights.length === 0 ? <div className="text-center py-8 text-muted-foreground">
            No highlights available for this sport
          </div> : <>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
              {filteredHighlights.slice(0, 12).map(highlight => <HighlightCard key={highlight.id} highlight={highlight} onPlay={setPlayingHighlight} />)}
            </div>
            
            {/* See All Highlights Button */}
            <div className="flex justify-center mt-6">
              <Link to="/highlights">
                <Button variant="outline" className="gap-2 font-semibold border-primary/50 hover:bg-primary hover:text-primary-foreground transition-all">
                  See All Highlights
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </>}
      </section>

      {/* Video Player Modal */}
      <Dialog open={!!playingHighlight} onOpenChange={() => setPlayingHighlight(null)}>
        <DialogContent className="max-w-4xl w-full p-0 bg-black border-none overflow-hidden">
          <DialogTitle className="sr-only">
            {playingHighlight ? `${playingHighlight.homeTeam} vs ${playingHighlight.awayTeam} Highlights` : 'Match Highlights'}
          </DialogTitle>
          {playingHighlight && <div className="relative">
              {/* Close button */}
              <button onClick={() => setPlayingHighlight(null)} className="absolute top-2 right-2 z-10 bg-black/70 hover:bg-black/90 rounded-full p-2 text-white transition-colors">
                <X className="h-5 w-5" />
              </button>

              {/* Match info header */}
              <div className="bg-card p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {playingHighlight.homeTeamBadge && <img src={playingHighlight.homeTeamBadge} alt={playingHighlight.homeTeam} className="w-8 h-8 object-contain" />}
                  <span className="font-bold text-foreground text-sm">{playingHighlight.homeTeam}</span>
                  <span className="text-primary font-bold">
                    {playingHighlight.homeScore} - {playingHighlight.awayScore}
                  </span>
                  <span className="font-bold text-foreground text-sm">{playingHighlight.awayTeam}</span>
                  {playingHighlight.awayTeamBadge && <img src={playingHighlight.awayTeamBadge} alt={playingHighlight.awayTeam} className="w-8 h-8 object-contain" />}
                </div>
                <Badge variant="outline" className="text-xs">{playingHighlight.league}</Badge>
              </div>

              {/* Video Player */}
              <div className="aspect-video bg-black">
                {playingHighlight.embedUrl.includes('youtube.com/embed') ? <iframe src={`${playingHighlight.embedUrl}?autoplay=1&rel=0`} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title={`${playingHighlight.homeTeam} vs ${playingHighlight.awayTeam}`} /> : <div className="w-full h-full flex items-center justify-center text-white">
                    <a href={playingHighlight.video} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-primary hover:bg-primary/90 px-6 py-3 rounded-lg font-bold transition-colors">
                      <Play className="h-5 w-5" />
                      Watch on External Site
                    </a>
                  </div>}
              </div>
            </div>}
        </DialogContent>
      </Dialog>
    </>;
};
export default LatestHighlights;