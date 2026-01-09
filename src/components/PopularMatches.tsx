import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Match } from '../types/sports';
import MatchCard from './MatchCard';
import { isTrendingMatch } from '../utils/popularLeagues';
import { consolidateMatches, filterCleanMatches } from '../utils/matchUtils';
import { enrichMatchesWithViewers, isMatchLive } from '../services/viewerCountService';
import { ChevronLeft, ChevronRight, Flame } from 'lucide-react';

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
  const [isEnriching, setIsEnriching] = useState(false);

  // Filter and consolidate matches
  const cleanMatches = filterCleanMatches(
    popularMatches
      .filter(match => match.sources && match.sources.length > 0)
      .filter(match => !excludeMatchIds.includes(match.id))
  );

  const consolidatedMatches = useMemo(
    () => consolidateMatches(cleanMatches),
    [cleanMatches.length, JSON.stringify(cleanMatches.map(m => m.id))]
  );

  // Get prioritized matches IMMEDIATELY (no async) for instant display
  const prioritizedMatches = useMemo(() => {
    const liveMatches = consolidatedMatches.filter(m => isMatchLive(m));
    return liveMatches
      .map(match => {
        const trendingInfo = isTrendingMatch(match.title);
        const priorityScore = (match.popular ? 100 : 0) + trendingInfo.score * 10 + (match.poster ? 50 : 0);
        return { match, priorityScore };
      })
      .sort((a, b) => b.priorityScore - a.priorityScore)
      .slice(0, 15)
      .map(item => item.match);
  }, [consolidatedMatches]);

  // Enrich with viewer counts in BACKGROUND
  useEffect(() => {
    if (prioritizedMatches.length === 0) {
      setEnrichedMatches([]);
      return;
    }

    // Show prioritized matches immediately
    setEnrichedMatches(prioritizedMatches);

    const enrichInBackground = async () => {
      setIsEnriching(true);
      try {
        const matchesWithViewers = await enrichMatchesWithViewers(prioritizedMatches.slice(0, 12));
        const sorted = matchesWithViewers
          .filter(m => (m.viewerCount || 0) > 0)
          .sort((a, b) => (b.viewerCount || 0) - (a.viewerCount || 0));
        
        if (sorted.length > 0) {
          setEnrichedMatches(sorted);
        }
      } catch (error) {
        console.error('Error enriching popular matches:', error);
      } finally {
        setIsEnriching(false);
      }
    };

    enrichInBackground();
    const interval = setInterval(enrichInBackground, 120000);
    return () => clearInterval(interval);
  }, [prioritizedMatches.length]);

  // Scroll handling
  const checkScrollability = () => {
    const container = scrollContainerRef.current;
    if (container) {
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(container.scrollLeft < container.scrollWidth - container.clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScrollability();
    window.addEventListener('resize', checkScrollability);
    return () => window.removeEventListener('resize', checkScrollability);
  }, [enrichedMatches]);

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = container.clientWidth * 0.8;
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
      setTimeout(checkScrollability, 300);
    }
  };

  if (enrichedMatches.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 group/carousel relative">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3 px-1">
        <Flame className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-bold text-foreground">Popular by Viewers</h2>
        <span className="text-xs px-2 py-0.5 rounded-full bg-destructive text-destructive-foreground font-semibold animate-pulse">
          LIVE
        </span>
        {isEnriching && (
          <span className="text-xs text-muted-foreground">updating...</span>
        )}
      </div>

      {/* Carousel Container */}
      <div className="relative">
        {/* Left Arrow */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/90 hover:bg-background p-2 rounded-full shadow-lg opacity-0 group-hover/carousel:opacity-100 transition-opacity"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
        )}

        {/* Right Arrow */}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/90 hover:bg-background p-2 rounded-full shadow-lg opacity-0 group-hover/carousel:opacity-100 transition-opacity"
          >
            <ChevronRight className="w-5 h-5 text-foreground" />
          </button>
        )}

        {/* Left Gradient */}
        {canScrollLeft && (
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-[5] pointer-events-none" />
        )}

        {/* Right Gradient */}
        {canScrollRight && (
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-[5] pointer-events-none" />
        )}

        {/* Scrollable Content */}
        <div
          ref={scrollContainerRef}
          onScroll={checkScrollability}
          className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
        >
          {enrichedMatches.slice(0, 12).map((match, index) => (
            <div key={`popular-${match.id}-${index}`} className="flex-shrink-0 w-[160px] sm:w-[180px] md:w-[calc((100%-48px)/5)]">
              <MatchCard
                match={match}
                sportId={selectedSport || ''}
                isPriority={true}
                isCompact={true}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PopularMatches;