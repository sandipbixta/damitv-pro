import React, { useEffect, useState, useRef } from 'react';
import { fetchCDNAllSports } from '@/services/cdnSportsApi';
import { Match } from '@/types/sports';
import MatchCard from './MatchCard';
import { ChevronLeft, ChevronRight, Radio, Loader2 } from 'lucide-react';

const CDNLiveMatches: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const loadMatches = async () => {
      try {
        console.log('🎯 Loading CDN live matches...');
        const data = await fetchCDNAllSports();
        console.log(`✅ CDN: Loaded ${data.length} matches`);
        setMatches(data);
      } catch (error) {
        console.error('❌ Failed to load CDN matches:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMatches();
  }, []);

  const checkScrollability = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    checkScrollability();
    container.addEventListener('scroll', checkScrollability);
    window.addEventListener('resize', checkScrollability);

    return () => {
      container.removeEventListener('scroll', checkScrollability);
      window.removeEventListener('resize', checkScrollability);
    };
  }, [matches]);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = 320;
    scrollContainerRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  if (loading) {
    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Radio className="w-4 h-4 text-red-500 animate-pulse" />
          <span className="text-sm font-semibold uppercase tracking-wider">CDN Live</span>
        </div>
        <div className="flex items-center justify-center h-32 bg-card/50 rounded-lg">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (matches.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 relative group">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Radio className="w-4 h-4 text-red-500 animate-pulse" />
        <span className="text-sm font-semibold uppercase tracking-wider text-foreground">
          CDN Live Matches
        </span>
        <span className="text-xs text-muted-foreground">({matches.length})</span>
      </div>

      {/* Navigation Arrows */}
      {canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/80 hover:bg-black text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}
      {canScrollRight && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/80 hover:bg-black text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}

      {/* Scrollable Container */}
      <div
        ref={scrollContainerRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {matches.slice(0, 20).map((match) => (
          <div
            key={match.id}
            className="flex-shrink-0 w-[280px] md:w-[calc((100%-48px)/5)]"
          >
            <MatchCard match={match} />
          </div>
        ))}
      </div>

      {/* Gradient overlays */}
      {canScrollLeft && (
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none" />
      )}
      {canScrollRight && (
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none" />
      )}
    </div>
  );
};

export default CDNLiveMatches;
