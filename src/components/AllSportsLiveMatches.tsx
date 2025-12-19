import React, { useEffect, useState, useRef } from 'react';
import { Sport, Match } from '../types/sports';
import { fetchSports } from '../api/sportsApi';
import { consolidateMatches, filterCleanMatches } from '../utils/matchUtils';
import { isMatchLive } from '../services/viewerCountService';
import { useLiveScoreUpdates } from '../hooks/useLiveScoreUpdates';
import MatchCard from './MatchCard';
import SkeletonCard from './SkeletonCard';
import { useToast } from '../hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import HighlightsSection from './HighlightsSection';
import FeaturedMatchBanner from './FeaturedMatchBanner';

// LocalStorage cache key for instant loading
const CACHE_KEY_MATCHES = 'damitv_matches_cache_v2';

interface AllSportsLiveMatchesProps {
  searchTerm?: string;
}

// Load cached data instantly
const getCachedMatches = (): Match[] => {
  try {
    const cached = localStorage.getItem(CACHE_KEY_MATCHES);
    if (!cached) return [];
    const parsed = JSON.parse(cached);
    return parsed.matches || [];
  } catch {
    return [];
  }
};

const setCachedMatches = (matches: Match[]) => {
  try {
    localStorage.setItem(CACHE_KEY_MATCHES, JSON.stringify({
      matches: matches.slice(0, 100),
      timestamp: Date.now()
    }));
  } catch {
    // Storage might be full
  }
};

// Transform edge function match to our Match format
const transformEdgeMatch = (m: any): Match => ({
  id: m.id,
  title: m.title,
  category: m.category,
  date: m.date,
  poster: m.poster,
  popular: m.popular,
  teams: m.teams,
  sources: m.sources,
  tournament: m.tournament,
  isLive: m.isLive,
  score: m.score,
  progress: m.progress,
  priority: m.priority
});

const AllSportsLiveMatches: React.FC<AllSportsLiveMatchesProps> = ({ searchTerm = '' }) => {
  const { toast } = useToast();
  
  // Initialize live score updates (slower since edge function provides scores)
  useLiveScoreUpdates(60000);
  
  // Initialize with cached data immediately for instant display
  const [allMatches, setAllMatches] = useState<Match[]>(() => getCachedMatches());
  const [sports, setSports] = useState<Sport[]>([]);
  const [hasInitialized, setHasInitialized] = useState(() => getCachedMatches().length > 0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const initialLoadDone = useRef(false);

  // Fetch ALL matches from edge function (already enriched with logos + scores)
  const fetchMatchesFromEdge = async (): Promise<Match[]> => {
    try {
      console.log('⚡ Fetching matches from edge function...');
      const startTime = Date.now();
      
      const { data, error } = await supabase.functions.invoke('fetch-popular-matches');
      
      if (error) {
        console.error('Edge function error:', error);
        return [];
      }
      
      const matches = (data?.matches || []).map(transformEdgeMatch);
      console.log(`✅ Edge function returned ${matches.length} matches in ${Date.now() - startTime}ms`);
      
      return matches;
    } catch (error) {
      console.error('Failed to fetch from edge:', error);
      return [];
    }
  };

  useEffect(() => {
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;
    
    const loadMatches = async () => {
      try {
        // Show refreshing indicator only if we have cached data
        if (allMatches.length > 0) {
          setIsRefreshing(true);
        }
        
        console.log('🔄 Loading matches...');
        const startTime = Date.now();
        
        // Fetch sports and matches in parallel - edge function does all the heavy lifting
        const [sportsData, matchesData] = await Promise.all([
          fetchSports(),
          fetchMatchesFromEdge()
        ]);
        
        setSports(sportsData);
        
        // Filter and consolidate matches
        const cleanMatches = filterCleanMatches(
          matchesData.filter(m => m.sources && m.sources.length > 0)
        );
        const consolidatedMatches = consolidateMatches(cleanMatches);
        
        console.log(`✅ Loaded ${consolidatedMatches.length} matches in ${Date.now() - startTime}ms`);
        
        setAllMatches(consolidatedMatches);
        setCachedMatches(consolidatedMatches);
        
      } catch (error) {
        console.error('Error loading matches:', error);
        if (allMatches.length === 0) {
          toast({
            title: "Error",
            description: "Failed to load matches.",
            variant: "destructive",
          });
        }
      } finally {
        setHasInitialized(true);
        setIsRefreshing(false);
      }
    };

    loadMatches();
  }, [toast, allMatches.length]);

  // Refresh matches every 2 minutes
  useEffect(() => {
    const refreshData = async () => {
      if (allMatches.length === 0) return;
      
      try {
        console.log('🔄 Refreshing matches...');
        const freshMatches = await fetchMatchesFromEdge();
        
        if (freshMatches.length > 0) {
          const cleanMatches = filterCleanMatches(
            freshMatches.filter(m => m.sources && m.sources.length > 0)
          );
          const consolidatedMatches = consolidateMatches(cleanMatches);
          
          setAllMatches(consolidatedMatches);
          setCachedMatches(consolidatedMatches);
          console.log(`✅ Refreshed ${consolidatedMatches.length} matches`);
        }
      } catch (error) {
        console.error('Error refreshing data:', error);
      }
    };

    const interval = setInterval(refreshData, 2 * 60 * 1000); // Refresh every 2 minutes
    
    return () => clearInterval(interval);
  }, [allMatches.length]);

  // Define preferred sport order
  const getSportPriority = (sportId: string): number => {
    const sportOrder: { [key: string]: number } = {
      'football': 1,
      'basketball': 2, 
      'american-football': 3,
      'nfl': 3,
      'baseball': 4,
      'motor-sports': 5,
      'motorsport': 5,
      'fight': 6,
      'fighting': 6,
      'mma': 6,
      'rugby': 7,
      'cricket': 8,
      'afl': 9
    };
    
    const normalizedSportId = sportId.toLowerCase();
    
    if (sportOrder[normalizedSportId] !== undefined) {
      return sportOrder[normalizedSportId];
    }
    
    for (const [sport, priority] of Object.entries(sportOrder)) {
      if (normalizedSportId.includes(sport) || sport.includes(normalizedSportId)) {
        return priority;
      }
    }
    
    return 14.5;
  };

  const getSportName = (sportId: string) => {
    const sport = sports.find(s => s.id === sportId);
    return sport?.name || sportId.charAt(0).toUpperCase() + sportId.slice(1).replace(/-/g, ' ');
  };

  // Filter live matches
  const filteredLiveMatches = React.useMemo(() => {
    let matches = allMatches.filter(m => m.isLive || isMatchLive(m));
    
    if (searchTerm.trim()) {
      const lowercaseSearch = searchTerm.toLowerCase();
      matches = matches.filter(match => {
        return match.title.toLowerCase().includes(lowercaseSearch) || 
          match.teams?.home?.name?.toLowerCase().includes(lowercaseSearch) ||
          match.teams?.away?.name?.toLowerCase().includes(lowercaseSearch);
      });
    }
    
    // Sort by priority (from edge function)
    return matches.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }, [allMatches, searchTerm]);

  // Filter upcoming matches (not live)
  const filteredUpcomingMatches = React.useMemo(() => {
    let upcoming = allMatches.filter(match => !match.isLive && !isMatchLive(match));
    
    if (searchTerm.trim()) {
      const lowercaseSearch = searchTerm.toLowerCase();
      upcoming = upcoming.filter(match => {
        return match.title.toLowerCase().includes(lowercaseSearch) || 
          match.teams?.home?.name?.toLowerCase().includes(lowercaseSearch) ||
          match.teams?.away?.name?.toLowerCase().includes(lowercaseSearch);
      });
    }
    
    return upcoming.sort((a, b) => a.date - b.date);
  }, [allMatches, searchTerm]);

  // Group live matches by sport
  const liveMatchesBySport = React.useMemo(() => {
    const grouped: { [sportId: string]: Match[] } = {};
    
    filteredLiveMatches.forEach(match => {
      const sportId = match.sportId || match.category || 'unknown';
      if (!grouped[sportId]) {
        grouped[sportId] = [];
      }
      grouped[sportId].push(match);
    });
    
    Object.keys(grouped).forEach(sportId => {
      grouped[sportId].sort((a, b) => (b.priority || 0) - (a.priority || 0));
    });
    
    return grouped;
  }, [filteredLiveMatches]);

  // Group upcoming matches by sport
  const upcomingMatchesBySport = React.useMemo(() => {
    const grouped: { [sportId: string]: Match[] } = {};
    
    filteredUpcomingMatches.forEach(match => {
      const sportId = match.sportId || match.category || 'unknown';
      if (!grouped[sportId]) {
        grouped[sportId] = [];
      }
      grouped[sportId].push(match);
    });
    
    Object.keys(grouped).forEach(sportId => {
      grouped[sportId].sort((a, b) => a.date - b.date);
    });
    
    return grouped;
  }, [filteredUpcomingMatches]);

  // Sort sports by priority
  const sortedLiveSports = React.useMemo(() => 
    Object.entries(liveMatchesBySport).sort(([sportIdA], [sportIdB]) => {
      return getSportPriority(sportIdA) - getSportPriority(sportIdB);
    }), [liveMatchesBySport]);

  const sortedUpcomingSports = React.useMemo(() => 
    Object.entries(upcomingMatchesBySport).sort(([sportIdA], [sportIdB]) => {
      return getSportPriority(sportIdA) - getSportPriority(sportIdB);
    }), [upcomingMatchesBySport]);

  const hasLiveMatches = filteredLiveMatches.length > 0;
  const hasUpcomingMatches = filteredUpcomingMatches.length > 0;

  // Get the most important live match for the featured banner
  const featuredMatch = React.useMemo(() => {
    // Priority: live match with highest priority score
    if (filteredLiveMatches.length > 0) {
      return filteredLiveMatches[0]; // Already sorted by priority
    }
    return null;
  }, [filteredLiveMatches]);

  // Show skeleton only during initial load with no cache
  if (!hasInitialized && allMatches.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
          <span className="text-muted-foreground text-sm">Loading matches...</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  // Show message when no matches available
  if (!hasLiveMatches && !hasUpcomingMatches) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg">No live matches available at the moment.</p>
        <p className="text-sm mt-2">Check back later for upcoming matches.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Refreshing indicator */}
      {isRefreshing && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Updating matches...</span>
        </div>
      )}

      {/* Featured Match Banner */}
      {featuredMatch && (
        <FeaturedMatchBanner match={featuredMatch} />
      )}


      {/* Live Matches Sections */}
      {hasLiveMatches && (
        <>
          {sortedLiveSports.map(([sportId, matches]) => (
            <div key={sportId} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                  {getSportName(sportId)}
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-500 text-white animate-pulse">
                    LIVE
                  </span>
                </h3>
                <span className="text-sm text-muted-foreground">
                  {matches.length} live match{matches.length !== 1 ? 'es' : ''}
                </span>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 auto-rows-fr">
                {matches.map((match) => (
                  <div key={`live-${match.sportId || sportId}-${match.id}`} className="h-full">
                    <MatchCard
                      match={match}
                      sportId={match.sportId || sportId}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </>
      )}

      {/* Match Highlights Section */}
      <HighlightsSection />

      {/* Upcoming Matches Sections */}
      {hasUpcomingMatches && (
        <>
          <div className="border-t border-border pt-8">
            <h2 className="text-2xl font-bold text-foreground mb-6">Upcoming Matches</h2>
          </div>
          {sortedUpcomingSports.map(([sportId, matches]) => (
            <div key={`upcoming-${sportId}`} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-foreground">
                  {getSportName(sportId)}
                </h3>
                <span className="text-sm text-muted-foreground">
                  {matches.length} upcoming match{matches.length !== 1 ? 'es' : ''}
                </span>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 auto-rows-fr">
                {matches.slice(0, 12).map((match) => (
                  <div key={`upcoming-${match.sportId || sportId}-${match.id}`} className="h-full">
                    <MatchCard
                      match={match}
                      sportId={match.sportId || sportId}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
};

export default AllSportsLiveMatches;
