import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import SectionHeader from './SectionHeader';
import { format } from 'date-fns';
import TeamLogo from './TeamLogo';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { searchTeam } from '@/services/sportsLogoService';

// Calculate real-time minutes based on match start time and current period
const calculateLiveMinutes = (progress: string, matchStartTime?: number): string => {
  if (!progress) return '';
  const trimmed = progress.trim().toUpperCase();
  
  // Already in minutes format (e.g., "45'", "45")
  if (/^\d+['′]?$/.test(trimmed)) {
    return trimmed.replace(/['′]/g, '') + "'";
  }
  
  // Half time
  if (trimmed === 'HT' || trimmed === 'HALF TIME' || trimmed === 'HALFTIME') {
    return "HT";
  }
  
  // Full time / Match Finished
  if (trimmed === 'FT' || trimmed === 'FULL TIME' || trimmed === 'FULLTIME' || 
      trimmed === 'AET' || trimmed === 'MATCH FINISHED' || trimmed.includes('FINISHED')) {
    return "FT";
  }
  
  // Calculate elapsed time if we have match start time
  if (matchStartTime) {
    const now = Date.now();
    const elapsedMs = now - matchStartTime;
    const elapsedMinutes = Math.floor(elapsedMs / 60000);
    
    // First half (1H, 1ST HALF) - 0 to 45 minutes
    if (trimmed === '1H' || trimmed === '1ST HALF' || trimmed === 'FIRST HALF') {
      const minute = Math.min(elapsedMinutes, 45);
      return minute > 45 ? "45+'" : `${Math.max(1, minute)}'`;
    }
    
    // Second half (2H, 2ND HALF) - 45 to 90 minutes (started ~60 min after kickoff including HT)
    if (trimmed === '2H' || trimmed === '2ND HALF' || trimmed === 'SECOND HALF') {
      // Assume halftime is ~15 min, so 2H starts at ~60 min after kickoff
      const secondHalfMinute = Math.max(0, elapsedMinutes - 60);
      const minute = 45 + Math.min(secondHalfMinute, 45);
      return minute >= 90 ? "90+'" : `${Math.max(46, minute)}'`;
    }
  }
  
  // Fallback for 1H/2H without start time - show period indicator
  if (trimmed === '1H' || trimmed === '1ST HALF' || trimmed === 'FIRST HALF') {
    return "1H";
  }
  if (trimmed === '2H' || trimmed === '2ND HALF' || trimmed === 'SECOND HALF') {
    return "2H";
  }
  
  // Extra time
  if (trimmed === 'ET' || trimmed === 'EXTRA TIME') {
    return "ET";
  }
  
  // Return original if no conversion needed
  return progress;
};

interface StreamSource {
  source: string;
  id: string;
}

interface PopularMatch {
  id: string;
  title: string;
  category: string;
  date: number;
  popular: boolean;
  teams: {
    home: { name: string; badge?: string };
    away: { name: string; badge?: string };
  };
  sources: StreamSource[];
  poster?: string;
  tournament?: string;
  isLive: boolean;
  score?: { home?: string; away?: string };
  progress?: string;
  priority: number;
  // Legacy fields for backward compatibility
  homeTeam?: string;
  awayTeam?: string;
  homeTeamBadge?: string;
  awayTeamBadge?: string;
  homeScore?: string;
  awayScore?: string;
  sport?: string;
  sportIcon?: string;
  league?: string;
  timestamp?: string;
  isFinished?: boolean;
  channels?: { id: string; name: string; embedUrl: string }[];
}

// Countdown hook
const useCountdown = (timestamp: string) => {
  const [countdown, setCountdown] = useState('');
  
  useEffect(() => {
    const matchDate = new Date(timestamp);
    if (isNaN(matchDate.getTime())) return; // Guard against invalid dates
    
    const updateCountdown = () => {
      const now = Date.now();
      const timeUntilMatch = matchDate.getTime() - now;
      
      if (timeUntilMatch <= 0) {
        setCountdown('');
        return;
      }
      
      const hours = Math.floor(timeUntilMatch / (1000 * 60 * 60));
      const minutes = Math.floor((timeUntilMatch % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeUntilMatch % (1000 * 60)) / 1000);
      
      if (hours > 24) {
        const days = Math.floor(hours / 24);
        const remainingHours = hours % 24;
        setCountdown(`${days}d : ${remainingHours}h`);
      } else if (hours > 0) {
        setCountdown(`${hours}h : ${minutes.toString().padStart(2, '0')}m`);
      } else {
        setCountdown(`${minutes}m : ${seconds.toString().padStart(2, '0')}s`);
      }
    };
    
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [timestamp]);
  
  return countdown;
};

// Stream Modal Component removed - now navigates to dedicated match page

// Match Card Component - styled like MatchCard.tsx
const PopularMatchCard: React.FC<{ 
  match: PopularMatch; 
  onClick: () => void;
}> = React.memo(({ match, onClick }) => {
  const [imgError, setImgError] = useState({ home: false, away: false, poster: false });
  const [fetchedPoster, setFetchedPoster] = useState<string | null>(null);
  const [fetchedBadges, setFetchedBadges] = useState<{ home: string | null; away: string | null }>({ home: null, away: null });
  
  // Extract data with backward compatibility
  const homeTeam = match.teams?.home?.name || match.homeTeam || 'TBD';
  const awayTeam = match.teams?.away?.name || match.awayTeam || 'TBD';
  const homeBadgeFromMatch = match.teams?.home?.badge || match.homeTeamBadge;
  const awayBadgeFromMatch = match.teams?.away?.badge || match.awayTeamBadge;
  
  // Safe date parsing to prevent Invalid time value errors
  const getMatchDate = (): number => {
    if (typeof match.date === 'number' && !isNaN(match.date)) return match.date;
    if (match.timestamp) {
      const parsed = new Date(match.timestamp).getTime();
      if (!isNaN(parsed)) return parsed;
    }
    if (match.date) {
      const parsed = new Date(match.date).getTime();
      if (!isNaN(parsed)) return parsed;
    }
    return Date.now(); // fallback to current time
  };
  const matchDate = getMatchDate();
  
  const league = match.tournament || match.league || match.category || '';
  const sportIcon = match.sportIcon || '⚽';
  const homeScore = match.score?.home || match.homeScore;
  const awayScore = match.score?.away || match.awayScore;
  
  // Safe ISO string conversion
  const safeIsoString = (() => {
    try {
      const date = new Date(matchDate);
      return !isNaN(date.getTime()) ? date.toISOString() : new Date().toISOString();
    } catch {
      return new Date().toISOString();
    }
  })();
  const countdown = useCountdown(safeIsoString);
  
  // Check for streams - support both new format (sources) and old format (channels)
  const hasStream = (match.sources?.length || 0) > 0 || (match.channels?.length || 0) > 0;

  // Only fetch images if badges are missing from match data
  useEffect(() => {
    // Skip if we already have badges from the API
    if ((match.poster || homeBadgeFromMatch) && awayBadgeFromMatch) return;
    
    let isMounted = true;
    const fetchImages = async () => {
      // Only fetch team badges if not provided
      if (!homeBadgeFromMatch && homeTeam && homeTeam !== 'TBD') {
        try {
          const homeTeamData = await searchTeam(homeTeam);
          if (isMounted && homeTeamData?.badge) {
            setFetchedBadges(prev => ({ ...prev, home: homeTeamData.badge }));
          }
        } catch (e) {
          // Silent fail
        }
      }

      if (!awayBadgeFromMatch && awayTeam && awayTeam !== 'TBD') {
        try {
          const awayTeamData = await searchTeam(awayTeam);
          if (isMounted && awayTeamData?.badge) {
            setFetchedBadges(prev => ({ ...prev, away: awayTeamData.badge }));
          }
        } catch (e) {
          // Silent fail
        }
      }
    };

    // Delay image fetching to prevent blocking initial render
    const timeoutId = setTimeout(fetchImages, 500);
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [homeTeam, awayTeam, match.poster, homeBadgeFromMatch, awayBadgeFromMatch]);

  const posterToUse = match.poster || fetchedPoster;
  const homeBadge = homeBadgeFromMatch || fetchedBadges.home;
  const awayBadge = awayBadgeFromMatch || fetchedBadges.away;

  const generateThumbnail = () => {
    // Priority 1: Use poster/thumb image
    if (posterToUse && !imgError.poster) {
      return (
        <div className="w-full h-full relative bg-black">
          <img
            src={posterToUse}
            alt={match.title}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => setImgError(prev => ({ ...prev, poster: true }))}
          />
        </div>
      );
    }

    // Priority 2: Use team badges with black background
    if ((homeBadge && !imgError.home) || (awayBadge && !imgError.away)) {
      return (
        <div className="w-full h-full relative overflow-hidden bg-black">
          <div className="flex items-center gap-3 z-10 relative h-full justify-center">
            {homeBadge && !imgError.home ? (
              <div className="flex flex-col items-center">
                <img
                  src={homeBadge}
                  alt={homeTeam}
                  className="w-10 h-10 object-contain drop-shadow-md filter brightness-110"
                  onError={() => setImgError(prev => ({ ...prev, home: true }))}
                />
                <span className="text-white text-[10px] font-medium mt-1 text-center truncate max-w-[50px] drop-shadow-sm">
                  {homeTeam}
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                  {homeTeam.substring(0, 2).toUpperCase()}
                </div>
                <span className="text-white text-[10px] font-medium mt-1 text-center truncate max-w-[50px] drop-shadow-sm">
                  {homeTeam}
                </span>
              </div>
            )}
            <span className="text-white font-bold text-sm drop-shadow-sm">VS</span>
            {awayBadge && !imgError.away ? (
              <div className="flex flex-col items-center">
                <img
                  src={awayBadge}
                  alt={awayTeam}
                  className="w-10 h-10 object-contain drop-shadow-md filter brightness-110"
                  onError={() => setImgError(prev => ({ ...prev, away: true }))}
                />
                <span className="text-white text-[10px] font-medium mt-1 text-center truncate max-w-[50px] drop-shadow-sm">
                  {awayTeam}
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                  {awayTeam.substring(0, 2).toUpperCase()}
                </div>
                <span className="text-white text-[10px] font-medium mt-1 text-center truncate max-w-[50px] drop-shadow-sm">
                  {awayTeam}
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }

    // Priority 3: Default DAMITV branding
    return (
      <div className="w-full h-full relative overflow-hidden bg-black">
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <span className="text-white font-bold text-2xl drop-shadow-lg tracking-wide">DAMITV</span>
        </div>
      </div>
    );
  };

  const displayDate = new Date(matchDate);

  return (
    <div 
      onClick={onClick}
      className="group cursor-pointer flex-shrink-0 w-[180px] md:w-[200px]"
    >
      <div className="relative overflow-hidden rounded-lg bg-card transition-all duration-300 hover:opacity-90 h-full flex flex-col">
        {/* Banner Image Section - smaller aspect ratio */}
        <div className="relative aspect-[16/10] overflow-hidden rounded-t-lg flex-shrink-0">
          {generateThumbnail()}
          
          {/* FREE Badge - Top left */}
          {hasStream && !match.isLive && (
            <div className="absolute top-2 left-2 z-10">
              <span className="bg-green-500 text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded">
                FREE
              </span>
            </div>
          )}
          
          {/* LIVE Badge - Top right */}
          {match.isLive && (
            <div className="absolute top-2 right-2 z-10">
              <span className="bg-red-600 text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded animate-pulse">
                ● LIVE
              </span>
            </div>
          )}
          
          {/* Countdown - WATCH IN style like MatchCard */}
          {!match.isLive && countdown && (
            <div className="absolute bottom-2 left-2 z-10">
              <div className="bg-[hsl(16,100%,60%)] text-white text-[10px] font-bold py-1 px-2.5 rounded italic tracking-wide">
                WATCH IN {countdown}
              </div>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="p-2 flex flex-col gap-1 flex-1 bg-card">
          {/* Sport Icon • Tournament */}
          <p className="text-[10px] text-muted-foreground truncate">
            {sportIcon} {league}
          </p>
          
          {/* Home Team with Score */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              {homeBadge ? (
                <img src={homeBadge} alt={homeTeam} className="w-6 h-6 object-contain flex-shrink-0" />
              ) : (
                <TeamLogo teamName={homeTeam} sport={match.category || "Soccer"} size="sm" showFallbackIcon={false} />
              )}
              <span className="text-xs font-medium text-foreground truncate">{homeTeam}</span>
            </div>
            {match.isLive && homeScore && (
              <span className="text-foreground font-bold text-sm ml-2 min-w-[24px] text-right tabular-nums">
                {homeScore}
              </span>
            )}
          </div>
          
          {/* Away Team with Score */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              {awayBadge ? (
                <img src={awayBadge} alt={awayTeam} className="w-6 h-6 object-contain flex-shrink-0" />
              ) : (
                <TeamLogo teamName={awayTeam} sport={match.category || "Soccer"} size="sm" showFallbackIcon={false} />
              )}
              <span className="text-xs font-medium text-foreground truncate">{awayTeam}</span>
            </div>
            {match.isLive && awayScore && (
              <span className="text-foreground font-bold text-sm ml-2 min-w-[24px] text-right tabular-nums">
                {awayScore}
              </span>
            )}
          </div>
          
          {/* Match Time/Progress */}
          <div className="flex items-center justify-between mt-auto">
            {match.isLive ? (
              <span className="text-[10px] text-red-500 font-medium">
                {match.progress ? calculateLiveMinutes(match.progress, matchDate) : 'Live'}
              </span>
            ) : (
              <p className="text-[10px] text-red-500 font-medium">
                {format(displayDate, 'EEE, do MMM, h:mm a')}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

// Skeleton Component
const MatchCardSkeleton: React.FC = () => (
  <div className="w-[180px] md:w-[200px] flex-shrink-0 rounded-lg bg-card overflow-hidden border border-border/50">
    <div className="aspect-[16/10] bg-muted animate-pulse" />
    <div className="p-2 space-y-1.5">
      <div className="h-2.5 w-20 bg-muted animate-pulse rounded" />
      <div className="h-3 w-24 bg-muted animate-pulse rounded" />
      <div className="h-3 w-20 bg-muted animate-pulse rounded" />
      <div className="h-2.5 w-28 bg-muted animate-pulse rounded" />
    </div>
  </div>
);

const CACHE_KEY = 'damitv_popular_matches';
const CACHE_EXPIRY = 10 * 60 * 1000; // 10 minutes

const getCachedMatches = (): { matches: PopularMatch[]; timestamp: number } | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (e) {
    console.error('Error reading cache:', e);
  }
  return null;
};

const setCachedMatches = (matches: PopularMatch[]) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ matches, timestamp: Date.now() }));
  } catch (e) {
    console.error('Error setting cache:', e);
  }
};

const PopularMatchesSection: React.FC = () => {
  const navigate = useNavigate();
  const [matches, setMatches] = useState<PopularMatch[]>(() => {
    // Initialize with cached data immediately
    const cached = getCachedMatches();
    if (cached) {
      // Filter out finished matches - isFinished may not exist in new format
      const activeMatches = cached.matches.filter((m: PopularMatch) => m.isFinished !== true);
      return activeMatches;
    }
    return [];
  });
  const [liveCount, setLiveCount] = useState(() => {
    const cached = getCachedMatches();
    if (cached) {
      return cached.matches.filter((m: PopularMatch) => m.isLive && m.isFinished !== true).length;
    }
    return 0;
  });
  const [loading, setLoading] = useState(() => {
    // Only show loading if no cached data
    return !getCachedMatches();
  });
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const fetchMatches = useCallback(async (showLoading = false) => {
    try {
      if (showLoading && matches.length === 0) setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('fetch-popular-matches');
      
      if (error) {
        console.error('Error fetching popular matches:', error);
        return;
      }
      
      const fetchedMatches = data?.matches || [];
      // Filter out finished matches
      const activeMatches = fetchedMatches.filter((m: PopularMatch) => m.isFinished !== true);
      
      // Show matches immediately
      setCachedMatches(activeMatches);
      setMatches(activeMatches);
      
      const liveMatches = activeMatches.filter((m: PopularMatch) => m.isLive);
      setLiveCount(liveMatches.length);
      
      console.log(`Popular matches: ${activeMatches.length} (${liveMatches.length} live)`);
      
      // Fetch viewer counts in background and re-sort (non-blocking)
      if (activeMatches.length > 0) {
        fetchViewerCountsAndSort(activeMatches);
      }
    } catch (err) {
      console.error('Error fetching popular matches:', err);
    } finally {
      setLoading(false);
    }
  }, [matches.length]);

  // Background function to fetch viewer counts and sort
  const fetchViewerCountsAndSort = async (matchList: PopularMatch[]) => {
    try {
      const matchesWithViewers = await Promise.all(
        matchList.map(async (match) => {
          try {
            const { data: viewerCount } = await supabase.rpc('get_viewer_count', { match_id_param: match.id });
            return { ...match, viewerCount: viewerCount || 0 };
          } catch {
            return { ...match, viewerCount: 0 };
          }
        })
      );
      
      // Sort by viewer count (highest first)
      const sortedMatches = matchesWithViewers.sort((a, b) => (b.viewerCount || 0) - (a.viewerCount || 0));
      setMatches(sortedMatches);
      setCachedMatches(sortedMatches);
    } catch (err) {
      console.error('Error fetching viewer counts:', err);
    }
  };

  useEffect(() => {
    // Fetch fresh data in background (even if we have cache)
    fetchMatches(matches.length === 0);
    
    // Full data refresh every 2 minutes
    const fullRefreshInterval = setInterval(() => fetchMatches(false), 2 * 60 * 1000);
    
    return () => {
      clearInterval(fullRefreshInterval);
    };
  }, [fetchMatches]);

  const checkScrollButtons = useCallback(() => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  }, []);

  useEffect(() => {
    checkScrollButtons();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollButtons);
      return () => container.removeEventListener('scroll', checkScrollButtons);
    }
  }, [checkScrollButtons, matches]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (loading) {
    return (
      <section className="mb-8">
        <SectionHeader title="Popular Matches" />
        <div className="relative">
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <MatchCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (matches.length === 0 && !loading) {
    return (
      <section className="mb-8">
        <SectionHeader title="Popular Matches" seeAllLink="/schedule" seeAllText="VIEW SCHEDULE" />
        <div className="bg-card rounded-xl p-6 border border-border text-center">
          <p className="text-muted-foreground">No major matches live right now. Check back later!</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-6 bg-primary rounded-full" />
          <h2 className="text-lg md:text-xl font-bold text-foreground">Popular Matches</h2>
          {liveCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
              {liveCount} LIVE
            </span>
          )}
        </div>
        <Link 
          to="/schedule" 
          className="text-primary text-sm font-semibold hover:underline transition-colors"
        >
          VIEW SCHEDULE
        </Link>
      </div>
      
      <div className="relative group">
        {/* Scroll Left Button */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-background/90 border border-border rounded-full flex items-center justify-center shadow-lg hover:bg-background transition-all opacity-0 group-hover:opacity-100 md:opacity-100"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        
        {/* Scroll Right Button */}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-background/90 border border-border rounded-full flex items-center justify-center shadow-lg hover:bg-background transition-all opacity-0 group-hover:opacity-100 md:opacity-100"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
        
        {/* Scrollable Container */}
        <div 
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {matches.map(match => (
            <PopularMatchCard 
              key={match.id} 
              match={match} 
              onClick={() => navigate(`/selected-match/${match.id}`)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default PopularMatchesSection;
