import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Sport } from '../types/sports';

interface SportsNavProps {
  sports: Sport[];
  onSelectSport: (sportId: string) => void;
  selectedSport: string | null;
  isLoading: boolean;
}

const SportsNav: React.FC<SportsNavProps> = ({ 
  sports, 
  onSelectSport, 
  selectedSport, 
  isLoading 
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

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
  }, [sports]);

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = 200;
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
      setTimeout(checkScrollability, 300);
    }
  };

  if (isLoading) {
    return (
      <div className="relative bg-black/60 backdrop-blur-md">
        <div className="flex gap-2 px-4 py-3 overflow-hidden">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-10 w-28 bg-white/10 animate-pulse rounded-lg flex-shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  const allSports = [{ id: 'all', name: 'All Sports' }, ...sports];

  return (
    <div className="relative group/nav bg-black/60 backdrop-blur-md">
      {/* Left Arrow */}
      {canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/80 hover:bg-black p-1.5 rounded-full shadow-lg opacity-0 group-hover/nav:opacity-100 transition-opacity ml-1"
        >
          <ChevronLeft className="w-4 h-4 text-white" />
        </button>
      )}

      {/* Right Arrow */}
      {canScrollRight && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/80 hover:bg-black p-1.5 rounded-full shadow-lg opacity-0 group-hover/nav:opacity-100 transition-opacity mr-1"
        >
          <ChevronRight className="w-4 h-4 text-white" />
        </button>
      )}

      {/* Left Gradient */}
      {canScrollLeft && (
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-black/60 to-transparent z-[5] pointer-events-none" />
      )}

      {/* Right Gradient */}
      {canScrollRight && (
        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-black/60 to-transparent z-[5] pointer-events-none" />
      )}

      {/* Scrollable Content */}
      <div
        ref={scrollContainerRef}
        onScroll={checkScrollability}
        className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide scroll-smooth"
      >
        {allSports.map((sport) => {
          const isSelected = selectedSport === sport.id;
          
          return (
            <button
              key={sport.id}
              onClick={() => onSelectSport(sport.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap text-sm font-medium flex-shrink-0 ${
              isSelected
                ? 'bg-white text-black shadow-lg'
                : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
            }`}
          >
              {sport.name}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SportsNav;
