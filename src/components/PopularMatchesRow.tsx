import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Flame } from 'lucide-react';
import { Match } from '../types/sports';
import MatchCard from './MatchCard';
import { cn } from '@/lib/utils';

interface PopularMatchesRowProps {
  matches: Match[];
}

const PopularMatchesRow: React.FC<PopularMatchesRowProps> = ({ matches }) => {
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
      const cardWidth = 260;
      const scrollAmount = cardWidth * 2;
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (matches.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2 px-1">
        <Flame className="h-5 w-5 text-primary" />
        <h3 className="text-lg sm:text-xl font-bold text-foreground">
          Popular by Viewers
        </h3>
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
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {matches.slice(0, 10).map((match, index) => (
            <div
              key={`popular-${match.sportId}-${match.id}`}
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
              
              {/* Match Card - positioned to overlap the number */}
              <div 
                className="relative z-10 w-[160px] sm:w-[170px]"
                style={{ marginLeft: index + 1 >= 10 ? '70px' : '50px' }}
              >
                <MatchCard
                  match={match}
                  sportId={match.sportId || match.category}
                  isCompact={true}
                />
              </div>
            </div>
          ))}
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

export default PopularMatchesRow;
