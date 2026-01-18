import React, { useEffect, useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, Radio, Loader2 } from 'lucide-react';
import CDNMatchCard from './CDNMatchCard';

// CDN API types
interface CDNChannel {
  channel_name: string;
  channel_code: string;
  url: string;
  image?: string;
  viewers?: number;
}

interface CDNMatch {
  gameID: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamIMG?: string;
  awayTeamIMG?: string;
  time?: string;
  tournament?: string;
  country?: string;
  countryIMG?: string;
  status?: string;
  start?: string;
  channels?: CDNChannel[];
}

// API config
const API_BASE = 'https://api.cdn-live.tv/api/v1';
const API_USER = 'damitv';
const API_PLAN = 'vip';

// CORS proxies
const CORS_PROXIES = [
  'https://corsproxy.io/?',
  'https://api.allorigins.win/raw?url='
];

const CDNLiveMatches: React.FC = () => {
  const [matches, setMatches] = useState<CDNMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const fetchMatches = async () => {
      const url = `${API_BASE}/events/sports/?user=${API_USER}&plan=${API_PLAN}`;
      
      for (const proxy of CORS_PROXIES) {
        try {
          const proxyUrl = `${proxy}${encodeURIComponent(url)}`;
          const response = await fetch(proxyUrl, {
            headers: { 'Accept': 'application/json' }
          });
          
          if (!response.ok) continue;
          
          const data = await response.json();
          
          // Parse nested structure: {"cdn-live-tv": {"Soccer": [...], ...}}
          const cdnData = data?.['cdn-live-tv'];
          if (!cdnData) continue;
          
          const allMatches: CDNMatch[] = [];
          Object.keys(cdnData).forEach(sportKey => {
            const sportEvents = cdnData[sportKey];
            if (Array.isArray(sportEvents)) {
              sportEvents.forEach(event => {
                allMatches.push(event);
              });
            }
          });
          
          // Sort: live first, then by viewers, then by time
          const sorted = allMatches.sort((a, b) => {
            const aLive = a.status === 'live' || a.status === 'playing';
            const bLive = b.status === 'live' || b.status === 'playing';
            if (aLive && !bLive) return -1;
            if (!aLive && bLive) return 1;
            
            const aViewers = a.channels?.reduce((sum, ch) => sum + (ch.viewers || 0), 0) || 0;
            const bViewers = b.channels?.reduce((sum, ch) => sum + (ch.viewers || 0), 0) || 0;
            return bViewers - aViewers;
          });
          
          console.log(`✅ CDN: Loaded ${sorted.length} matches`);
          setMatches(sorted);
          break;
        } catch (error) {
          console.warn('CDN proxy failed, trying next...');
          continue;
        }
      }
      
      setLoading(false);
    };

    fetchMatches();
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
    const scrollAmount = 300;
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
          className="absolute left-0 top-1/2 translate-y-2 z-10 bg-black/80 hover:bg-black text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}
      {canScrollRight && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 translate-y-2 z-10 bg-black/80 hover:bg-black text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}

      {/* Scrollable Container - Mobile friendly */}
      <div
        ref={scrollContainerRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 md:mx-0 md:px-0"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {matches.slice(0, 30).map((match, index) => (
          <div
            key={match.gameID || index}
            className="flex-shrink-0 w-[260px] sm:w-[280px] md:w-[calc((100%-48px)/5)]"
          >
            <CDNMatchCard match={match} />
          </div>
        ))}
      </div>

      {/* Gradient overlays - hidden on mobile */}
      {canScrollLeft && (
        <div className="hidden md:block absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none" />
      )}
      {canScrollRight && (
        <div className="hidden md:block absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none" />
      )}
    </div>
  );
};

export default CDNLiveMatches;
