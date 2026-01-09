import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Match } from '../types/sports';
import MatchCard from './MatchCard';
import { cn } from '@/lib/utils';

interface SportCarouselRowProps {
  sportId: string;
  sportName: string;
  matches: Match[];
  matchCount: number;
}

const SportCarouselRow: React.FC<SportCarouselRowProps> = ({
  sportId,
  sportName,
  matches,
  matchCount
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

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
  }, [matches]);

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (container) {
      const cardWidth = 220; // Approximate card width + gap
      const scrollAmount = cardWidth * 3; // Scroll 3 cards at a time
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-lg sm:text-xl font-bold text-foreground">
          {sportName}
        </h3>
        <span className="text-xs sm:text-sm text-muted-foreground">
          {matchCount} live match{matchCount !== 1 ? 'es' : ''}
        </span>
      </div>

      {/* Carousel Container */}
      <div className="relative group">
        {/* Left Arrow */}
        <button
          onClick={() => scroll('left')}
          className={cn(
            "absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/90 hover:bg-background border border-border rounded-full p-2 shadow-lg transition-all duration-200",
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
            "absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/90 hover:bg-background border border-border rounded-full p-2 shadow-lg transition-all duration-200",
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
          className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {matches.map((match) => (
            <div
              key={`${match.sportId || sportId}-${match.id}`}
              className="flex-shrink-0 w-[160px] sm:w-[180px] md:w-[200px]"
            >
              <MatchCard
                match={match}
                sportId={match.sportId || sportId}
                isCompact={true}
              />
            </div>
          ))}
        </div>

        {/* Gradient fades on edges */}
        <div
          className={cn(
            "absolute left-0 top-0 bottom-2 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none transition-opacity",
            canScrollLeft ? "opacity-100" : "opacity-0"
          )}
        />
        <div
          className={cn(
            "absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none transition-opacity",
            canScrollRight ? "opacity-100" : "opacity-0"
          )}
        />
      </div>
    </div>
  );
};

export default SportCarouselRow;
