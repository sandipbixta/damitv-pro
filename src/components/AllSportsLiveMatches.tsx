import React, { useEffect, useState, useRef } from 'react';
import { Sport, Match } from '../types/sports';
import { fetchLiveMatches, fetchSports, fetchAllMatches } from '../api/sportsApi';
import { consolidateMatches, filterCleanMatches, sortMatchesByViewers } from '../utils/matchUtils';
import { enrichMatchesWithViewers, isMatchLive } from '../services/viewerCountService';
import { getLiveScoreByTeams, useLiveScoreUpdates } from '../hooks/useLiveScoreUpdates';
import MatchCard from './MatchCard';
import SkeletonCard from './SkeletonCard';
import { useToast } from '../hooks/use-toast';
import { TrendingUp, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import HighlightsSection from './HighlightsSection';

// LocalStorage cache keys for instant loading
const CACHE_KEY_LIVE = 'damitv_live_matches_cache';
const CACHE_KEY_ALL = 'damitv_all_matches_cache';

interface AllSportsLiveMatchesProps {
  searchTerm?: string;
}

// Normalize team name for matching
const normalizeTeamName = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/fc$/i, '')
    .replace(/^fc /i, '')
    .replace(/ fc$/i, '')
    .replace(/\./g, '')
    .replace(/'/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

// Interface for popular match scores
interface PopularMatchScore {
  homeTeam: string;
  awayTeam: string;
  homeScore: string | null;
  awayScore: string | null;
  progress: string | null;
  isLive: boolean;
}

// Merge scores from popular matches AND live score store into WeStream matches
const mergeScoresIntoMatches = (matches: Match[], popularScores: PopularMatchScore[]): Match[] => {
  return matches.map(match => {
    const homeTeam = match.teams?.home?.name || '';
    const awayTeam = match.teams?.away?.name || '';
    
    if (!homeTeam || !awayTeam) return match;
    
    const normalizedHome = normalizeTeamName(homeTeam);
    const normalizedAway = normalizeTeamName(awayTeam);
    
    // First try to find in popular scores
    let scoreData = popularScores.find(ps => {
      const psHome = normalizeTeamName(ps.homeTeam);
      const psAway = normalizeTeamName(ps.awayTeam);
      
      return (psHome.includes(normalizedHome) || normalizedHome.includes(psHome)) &&
             (psAway.includes(normalizedAway) || normalizedAway.includes(psAway));
    });
    
    // If not found in popular scores, try the live score store
    if (!scoreData || (!scoreData.homeScore && !scoreData.awayScore)) {
      const liveScore = getLiveScoreByTeams(homeTeam, awayTeam);
      if (liveScore) {
        scoreData = {
          homeTeam: liveScore.homeTeam,
          awayTeam: liveScore.awayTeam,
          homeScore: String(liveScore.homeScore),
          awayScore: String(liveScore.awayScore),
          progress: liveScore.progress,
          isLive: true
        };
      }
    }
    
    if (scoreData && scoreData.homeScore !== null && scoreData.awayScore !== null) {
      return {
        ...match,
        score: {
          home: scoreData.homeScore,
          away: scoreData.awayScore
        },
        progress: scoreData.progress || match.progress,
        isLive: scoreData.isLive || match.isLive
      };
    }
    
    return match;
  });
};

// Load cached data instantly
const getCachedLiveMatches = (): Match[] => {
  try {
    const cached = localStorage.getItem(CACHE_KEY_LIVE);
    if (!cached) return [];
    return JSON.parse(cached);
  } catch {
    return [];
  }
};

const getCachedAllMatches = (): Match[] => {
  try {
    const cached = localStorage.getItem(CACHE_KEY_ALL);
    if (!cached) return [];
    return JSON.parse(cached);
  } catch {
    return [];
  }
};

const setCachedLiveMatches = (matches: Match[]) => {
  try {
    localStorage.setItem(CACHE_KEY_LIVE, JSON.stringify(matches.slice(0, 100)));
  } catch {
    // Storage might be full
  }
};

const setCachedAllMatches = (matches: Match[]) => {
  try {
    localStorage.setItem(CACHE_KEY_ALL, JSON.stringify(matches.slice(0, 100)));
  } catch {
    // Storage might be full
  }
};

const AllSportsLiveMatches: React.FC<AllSportsLiveMatchesProps> = ({ searchTerm = '' }) => {
  const { toast } = useToast();
  
  // Initialize live score updates to populate the global store
  const { lastUpdate: liveScoreLastUpdate } = useLiveScoreUpdates(30000);
  
  // Initialize with cached data immediately
  const [liveMatches, setLiveMatches] = useState<Match[]>(() => getCachedLiveMatches());
  const [allMatches, setAllMatches] = useState<Match[]>(() => getCachedAllMatches());
  const [sports, setSports] = useState<Sport[]>([]);
  const [hasInitialized, setHasInitialized] = useState(() => getCachedLiveMatches().length > 0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [mostViewedMatches, setMostViewedMatches] = useState<Match[]>([]);
  const [popularScores, setPopularScores] = useState<PopularMatchScore[]>([]);
  const initialLoadDone = useRef(false);

  // Fetch popular matches scores from edge function
  const fetchPopularScores = async (): Promise<PopularMatchScore[]> => {
    try {
      const { data, error } = await supabase.functions.invoke('fetch-popular-matches');
      if (error || !data?.matches) return [];
      
      return data.matches.map((m: any) => ({
        homeTeam: m.teams?.home?.name || m.homeTeam || '',
        awayTeam: m.teams?.away?.name || m.awayTeam || '',
        homeScore: m.score?.home ?? m.homeScore ?? null,
        awayScore: m.score?.away ?? m.awayScore ?? null,
        progress: m.progress ?? null,
        isLive: m.isLive ?? false
      }));
    } catch {
      return [];
    }
  };

  useEffect(() => {
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;
    
    const loadLiveMatches = async () => {
      try {
        // Show refreshing indicator only if we have cached data
        if (liveMatches.length > 0) {
          setIsRefreshing(true);
        }
        
        console.log('🔄 Fetching fresh matches...');
        
        // Fetch sports, live matches, all matches, AND popular scores in parallel
        const [sportsData, liveMatchesData, allMatchesData, scores] = await Promise.all([
          fetchSports(),
          fetchLiveMatches(),
          fetchAllMatches(),
          fetchPopularScores()
        ]);
        
        setSports(sportsData);
        setPopularScores(scores);
        
        // Filter and consolidate live matches (remove matches without sources)
        const cleanLiveMatches = filterCleanMatches(
          liveMatchesData.filter(m => m.sources && m.sources.length > 0)
        );
        const consolidatedLiveMatches = consolidateMatches(cleanLiveMatches);
        
        // Filter and consolidate all matches (must have sources)
        const cleanAllMatches = filterCleanMatches(
          allMatchesData.filter(m => m.sources && m.sources.length > 0)
        );
        const consolidatedAllMatches = consolidateMatches(cleanAllMatches);
        
        console.log(`✅ Loaded ${consolidatedLiveMatches.length} live matches and ${consolidatedAllMatches.length} total matches`);
        console.log(`📊 Got ${scores.length} popular match scores for merging`);
        
        // Merge live scores from popular matches into the WeStream matches
        const liveMatchesWithScores = mergeScoresIntoMatches(consolidatedLiveMatches, scores);
        const allMatchesWithScores = mergeScoresIntoMatches(consolidatedAllMatches, scores);
        
        // Enrich live matches with viewer counts from stream API
        const enrichedLiveMatches = await enrichMatchesWithViewers(liveMatchesWithScores);
        setLiveMatches(enrichedLiveMatches);
        setCachedLiveMatches(enrichedLiveMatches);
        
        // Enrich all matches with viewer counts
        const enrichedAllMatches = await enrichMatchesWithViewers(allMatchesWithScores);
        setAllMatches(enrichedAllMatches);
        setCachedAllMatches(enrichedAllMatches);
        
        // For "Popular by Viewers", only show live matches with viewers
        const liveMatchesWithViewers = enrichedLiveMatches.filter(m => 
          isMatchLive(m) && 
          (m.viewerCount || 0) > 0
        );
        
        // Sort by viewer count
        const sortedByViewers = liveMatchesWithViewers.sort((a, b) => 
          (b.viewerCount || 0) - (a.viewerCount || 0)
        );
        
        setMostViewedMatches(sortedByViewers.slice(0, 12));
        
      } catch (error) {
        console.error('Error loading matches:', error);
        // Only show error toast if we have no cached data
        if (liveMatches.length === 0) {
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

    loadLiveMatches();
  }, [toast]);

  // Refresh viewer counts and scores every 30 seconds
  useEffect(() => {
    const refreshData = async () => {
      if (liveMatches.length === 0) return;
      
      try {
        console.log('🔄 Refreshing viewer counts and scores for', liveMatches.length, 'live matches');
        
        // Fetch fresh scores
        const freshScores = await fetchPopularScores();
        if (freshScores.length > 0) {
          setPopularScores(freshScores);
        }
        
        // Merge fresh scores into live matches
        const matchesWithScores = mergeScoresIntoMatches(liveMatches, freshScores.length > 0 ? freshScores : popularScores);
        
        // Enrich with viewer counts
        const enrichedLiveMatches = await enrichMatchesWithViewers(matchesWithScores);
        
        // Update live matches with fresh viewer counts and scores
        setLiveMatches(enrichedLiveMatches);
        
        // Only show live matches with viewers for popular section
        const liveMatchesWithViewers = enrichedLiveMatches.filter(m => 
          isMatchLive(m) && 
          (m.viewerCount || 0) > 0
        );
        
        // Sort by viewer count
        const sortedByViewers = liveMatchesWithViewers.sort((a, b) => 
          (b.viewerCount || 0) - (a.viewerCount || 0)
        );
        
        console.log('🔥 Refreshed - Popular live matches with viewers:', sortedByViewers.map(m => ({ 
          id: m.id, 
          title: m.title, 
          viewers: m.viewerCount 
        })));
        
        setMostViewedMatches(sortedByViewers.slice(0, 12));
      } catch (error) {
        console.error('Error refreshing data:', error);
      }
    };

    const interval = setInterval(refreshData, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, [liveMatches.length, popularScores]);

  // Define preferred sport order (excluded: tennis, golf, hockey, darts, billiards)
  const getSportPriority = (sportId: string): number => {
    const sportOrder: { [key: string]: number } = {
      'football': 1,
      'basketball': 2, 
      'american-football': 3,
      'baseball': 4,
      'motor-sports': 5,
      'fight': 6,
      'rugby': 7,
      'cricket': 8,
      'afl': 9
    };
    
    const normalizedSportId = sportId.toLowerCase();
    
    // Check for exact match first
    if (sportOrder[normalizedSportId] !== undefined) {
      return sportOrder[normalizedSportId];
    }
    
    // Check for partial matches
    for (const [sport, priority] of Object.entries(sportOrder)) {
      if (normalizedSportId.includes(sport) || sport.includes(normalizedSportId)) {
        return priority;
      }
    }
    
    // Unknown sports get high priority (but before tennis)
    return 14.5;
  };

  const getSportName = (sportId: string) => {
    const sport = sports.find(s => s.id === sportId);
    return sport?.name || sportId.charAt(0).toUpperCase() + sportId.slice(1);
  };

  // Filter matches by search term (ended matches already filtered out in data loading)
  const filteredLiveMatches = React.useMemo(() => {
    // Show all live matches (logos are fetched from TheSportsDB asynchronously)
    let matches = liveMatches;
    
    // Apply search filter if provided
    if (searchTerm.trim()) {
      const lowercaseSearch = searchTerm.toLowerCase();
      matches = matches.filter(match => {
        return match.title.toLowerCase().includes(lowercaseSearch) || 
          match.teams?.home?.name?.toLowerCase().includes(lowercaseSearch) ||
          match.teams?.away?.name?.toLowerCase().includes(lowercaseSearch);
      });
    }
    
    return matches;
  }, [liveMatches, searchTerm]);

  // Filter upcoming matches (not live)
  const filteredUpcomingMatches = React.useMemo(() => {
    // Get non-live matches from allMatches (show all matches, logos fetched from TheSportsDB)
    let upcoming = allMatches.filter(match => !isMatchLive(match));
    
    // Apply search filter if provided
    if (searchTerm.trim()) {
      const lowercaseSearch = searchTerm.toLowerCase();
      upcoming = upcoming.filter(match => {
        return match.title.toLowerCase().includes(lowercaseSearch) || 
          match.teams?.home?.name?.toLowerCase().includes(lowercaseSearch) ||
          match.teams?.away?.name?.toLowerCase().includes(lowercaseSearch);
      });
    }
    
    // Sort by date (earliest first)
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
    
    // Sort matches within each sport by date (newest/most recent first)
    Object.keys(grouped).forEach(sportId => {
      grouped[sportId].sort((a, b) => b.date - a.date);
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
    
    // Sort matches within each sport by date (earliest first for upcoming)
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

  // Show skeleton only during initial load with no cache
  if (!hasInitialized && liveMatches.length === 0) {
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
      {/* Popular by Viewers Section */}
      {mostViewedMatches.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Popular by Viewers
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary text-primary-foreground">
                TRENDING
              </span>
            </h3>
            <span className="text-sm text-muted-foreground">
              {mostViewedMatches.length} popular match{mostViewedMatches.length !== 1 ? 'es' : ''}
            </span>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 auto-rows-fr">
            {mostViewedMatches.slice(0, 6).map((match) => (
              <div key={`popular-${match.id}`} className="h-full">
                <MatchCard
                  match={match}
                  sportId={match.sportId || match.category}
                />
              </div>
            ))}
          </div>
        </div>
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

      {/* Match Highlights Section - Before Upcoming Matches */}
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