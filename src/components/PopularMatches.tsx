import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Flame } from 'lucide-react';
import { Match } from '../types/sports';
import MatchCard from './MatchCard';
import { isTrendingMatch } from '../utils/popularLeagues';
import { consolidateMatches, filterCleanMatches } from '../utils/matchUtils';
import { enrichMatchesWithViewers, isMatchLive } from '../services/viewerCountService';
import { cn } from '@/lib/utils';

interface PopularMatchesProps {
  popularMatches: Match[];
  selectedSport: string | null;
  excludeMatchIds?: string[];
}

const PopularMatches: React.FC<PopularMatchesProps> = ({
  popularMatches,
  selectedSport,
  excludeMatchIds = []
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [enrichedMatches, setEnrichedMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const checkScrollability = () => {
    const container = scrollContainerRef.current;
    if (container) {
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(
        container.scrollLeft < container.scrollWidth - container.clientWidth - 10
      );
    }
  };

  useEffect(() => {
    checkScrollability();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollability);
      window.addEventListener('resize', checkScrollability);
    }
    return () => {
      if (container) {
        container.removeEventListener('scroll', checkScrollability);
      }
      window.removeEventListener('resize', checkScrollability);
    };
  }, [enrichedMatches]);

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (container) {
      const cardWidth = 260;
      const scrollAmount = cardWidth * 2;
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Filter and consolidate matches
  const cleanMatches = filterCleanMatches(
    popularMatches
      .filter(match => match.sources && match.sources.length > 0)
      .filter(match => !excludeMatchIds.includes(match.id))
  );

  const consolidatedMatches = React.useMemo(
    () => consolidateMatches(cleanMatches),
    [cleanMatches.length, JSON.stringify(cleanMatches.map(m => m.id))]
  );

  // Enrich matches with viewer counts
  useEffect(() => {
    const enrichMatches = async () => {
      if (consolidatedMatches.length === 0) {
        setEnrichedMatches([]);
        return;
      }
      setIsLoading(true);

      const liveMatches = consolidatedMatches.filter(m => isMatchLive(m));
      const prioritizedMatches = liveMatches
        .map(match => {
          const trendingInfo = isTrendingMatch(match.title);
          const priorityScore = (match.popular ? 100 : 0) + trendingInfo.score * 10 + (match.poster ? 50 : 0);
          return { match, priorityScore };
        })
        .sort((a, b) => b.priorityScore - a.priorityScore)
        .map(item => item.match);

      const matchesToCheck = prioritizedMatches.slice(0, 25);

      try {
        const matchesWithViewers = await enrichMatchesWithViewers(matchesToCheck);
        const liveMatchesWithViewers = matchesWithViewers.filter(m => (m.viewerCount || 0) > 0);
        const sortedMatches = liveMatchesWithViewers.sort((a, b) => (b.viewerCount || 0) - (a.viewerCount || 0));
        setEnrichedMatches(sortedMatches);
      } catch (error) {
        console.error('Error enriching popular matches:', error);
        setEnrichedMatches(prioritizedMatches.slice(0, 10));
      } finally {
        setIsLoading(false);
      }
    };

    enrichMatches();
    const interval = setInterval(enrichMatches, 120000);
    return () => clearInterval(interval);
  }, [consolidatedMatches.length]);

  if (enrichedMatches.length === 0 && !isLoading) {
    return null;
  }

  const displayMatches = enrichedMatches.slice(0, 10);

  return (
    <div className="mb-8 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2 px-1">
        <Flame className="h-5 w-5 text-primary" />
        <h2 className="text-lg sm:text-xl font-bold text-foreground">Popular by Viewers</h2>
        <span className="text-xs px-2 py-0.5 rounded-full bg-destructive text-destructive-foreground font-semibold animate-pulse">
          LIVE
        </span>
      </div>

      {/* Carousel Container */}
      <div className="relative group">
        {/* Left Arrow */}
        <button
          onClick={() => scroll('left')}
          className={cn(
            "absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-background/90 hover:bg-background border border-border rounded-full p-2 shadow-lg transition-all duration-200",
            "opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0",
            !canScrollLeft && "hidden"
          )}
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-5 w-5 text-foreground" />
        </button>

        {/* Right Arrow */}
        <button
          onClick={() => scroll('right')}
          className={cn(
            "absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-background/90 hover:bg-background border border-border rounded-full p-2 shadow-lg transition-all duration-200",
            "opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0",
            !canScrollRight && "hidden"
          )}
          aria-label="Scroll right"
        >
          <ChevronRight className="h-5 w-5 text-foreground" />
        </button>

        {/* Scrollable Row */}
        <div
          ref={scrollContainerRef}
          className="flex gap-1 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
        >
          {isLoading && displayMatches.length === 0 ? (
            // Skeleton loaders
            Array.from({ length: 6 }).map((_, i) => (
              <div key={`skeleton-${i}`} className="flex-shrink-0" style={{ width: '240px' }}>
                <div className="flex items-end relative">
                  <div 
                    className="absolute left-0 bottom-0 text-[180px] font-black leading-[0.75] text-muted/20"
                    style={{ WebkitTextStroke: '3px hsl(var(--muted-foreground) / 0.2)' }}
                  >
                    {i + 1}
                  </div>
                  <div className="relative z-10 w-[160px] ml-[50px]">
                    <div className="bg-card rounded-lg animate-pulse h-[240px]" />
                  </div>
                </div>
              </div>
            ))
          ) : (
            displayMatches.map((match, index) => (
              <div
                key={`popular-${match.id}-${index}`}
                className="flex-shrink-0 flex items-end relative"
                style={{ width: '240px' }}
              >
                {/* Large Rank Number */}
                <div 
                  className="absolute left-0 bottom-0 z-0 select-none pointer-events-none"
                  style={{
                    fontSize: '180px',
                    fontWeight: 900,
                    lineHeight: '0.75',
                    color: 'transparent',
                    WebkitTextStroke: '3px hsl(var(--muted-foreground) / 0.3)',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  {index + 1}
                </div>
                
                {/* Match Card */}
                <div 
                  className="relative z-10 w-[160px] sm:w-[170px]"
                  style={{ marginLeft: index + 1 >= 10 ? '70px' : '50px' }}
                >
                  <MatchCard
                    match={match}
                    sportId={selectedSport || match.sportId || ''}
                    isPriority={true}
                    isCompact={true}
                  />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Gradient fades */}
        <div
          className={cn(
            "absolute left-0 top-0 bottom-2 w-12 bg-gradient-to-r from-background to-transparent pointer-events-none transition-opacity z-10",
            canScrollLeft ? "opacity-100" : "opacity-0"
          )}
        />
        <div
          className={cn(
            "absolute right-0 top-0 bottom-2 w-12 bg-gradient-to-l from-background to-transparent pointer-events-none transition-opacity z-10",
            canScrollRight ? "opacity-100" : "opacity-0"
          )}
        />
      </div>
    </div>
  );
};

export default PopularMatches;