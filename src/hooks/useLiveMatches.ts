
import { useState, useEffect, useCallback } from 'react';
import { useToast } from './use-toast';
import { Match, Stream, Source, Sport } from '../types/sports';
import { fetchMatches, fetchStream, fetchSports, fetchLiveMatches, fetchAllMatches } from '../api/sportsApi';
import { consolidateMatches, filterCleanMatches, isMatchLive } from '../utils/matchUtils';

export const useLiveMatches = () => {
  const { toast } = useToast();
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  const fetchLiveContent = useCallback(async () => {
    try {
      console.log('Fetching live matches...');
      
      // Fetch sports and football data in parallel - NO LOADING STATE
      const [sportsData, initialFootballMatches] = await Promise.all([
        fetchSports(),
        fetchMatches('football')
      ]);
      
      setSports(sportsData);
      
      // Process and display football matches instantly
      const initialMatchesWithSources = initialFootballMatches.filter(m => m.sources && m.sources.length > 0);
      const initialCleanMatches = filterCleanMatches(initialMatchesWithSources);
      const initialConsolidatedMatches = consolidateMatches(initialCleanMatches.map(m => ({ ...m, sportId: 'football' })));
      
      const initialLive = initialConsolidatedMatches.filter(match => {
        const matchTime = typeof match.date === 'number' ? match.date : new Date(match.date).getTime();
        const now = new Date().getTime();
        const sixHoursInMs = 6 * 60 * 60 * 1000;
        const oneHourInMs = 60 * 60 * 1000;
        
        return match.sources && 
               match.sources.length > 0 && 
               matchTime - now < oneHourInMs && 
               now - matchTime < sixHoursInMs;
      }).sort((a, b) => {
        const aTime = typeof a.date === 'number' ? a.date : new Date(a.date).getTime();
        const bTime = typeof b.date === 'number' ? b.date : new Date(b.date).getTime();
        return bTime - aTime;
      });
      
      const initialUpcoming = initialConsolidatedMatches.filter(match => 
        !initialLive.some(liveMatch => liveMatch.id === match.id)
      );
      
      // Display immediately - NO loading state blocking
      setAllMatches(initialConsolidatedMatches);
      setLiveMatches(initialLive);
      setUpcomingMatches(initialUpcoming);
      setLoading(false);
      console.log('Football matches displayed instantly');
      
      // Fetch remaining sports in background
      const otherSports = ['basketball', 'tennis', 'cricket', 'hockey', 'fight', 'baseball', 'rugby'];
      
      const allSportPromises = otherSports.map(async (sportId) => {
        try {
          const matches = await fetchMatches(sportId);
          return matches.map(match => ({ ...match, sportId }));
        } catch (error) {
          console.error(`Error fetching matches for sport ${sportId}:`, error);
          return [];
        }
      });
      
      const results = await Promise.all(allSportPromises);
      const allOtherMatches = results.flat();
      
      // Get football matches again to merge with others
      const finalFootballMatches = await fetchMatches('football');
      const allFetchedMatches = [...finalFootballMatches.map(m => ({ ...m, sportId: 'football' })), ...allOtherMatches];
      
      // Final processing with all matches
      const finalMatchesWithSources = allFetchedMatches.filter(m => m.sources && m.sources.length > 0);
      const finalCleanMatches = filterCleanMatches(finalMatchesWithSources);
      const finalConsolidatedMatches = consolidateMatches(finalCleanMatches);
      
      const finalLive = finalConsolidatedMatches.filter(match => {
        const matchTime = typeof match.date === 'number' ? match.date : new Date(match.date).getTime();
        const now = new Date().getTime();
        const sixHoursInMs = 6 * 60 * 60 * 1000;
        const oneHourInMs = 60 * 60 * 1000;
        
        return match.sources && 
               match.sources.length > 0 && 
               matchTime - now < oneHourInMs && 
               now - matchTime < sixHoursInMs;
      }).sort((a, b) => {
        const aTime = typeof a.date === 'number' ? a.date : new Date(a.date).getTime();
        const bTime = typeof b.date === 'number' ? b.date : new Date(b.date).getTime();
        return bTime - aTime;
      });
      
      const finalUpcoming = finalConsolidatedMatches.filter(match => 
        !finalLive.some(liveMatch => liveMatch.id === match.id)
      );
      
      console.log('All matches loaded - Live:', finalLive.length, 'Upcoming:', finalUpcoming.length);
      
      // Update with complete data
      setAllMatches(finalConsolidatedMatches);
      setLiveMatches(finalLive);
      setUpcomingMatches(finalUpcoming);
      
    } catch (error) {
      console.error('Error fetching live content:', error);
      setLoading(false);
      toast({
        title: "Error",
        description: "Failed to load content. Please try again.",
        variant: "destructive",
      });
    }
  }, [toast, retryCount]);

  useEffect(() => {
    fetchLiveContent();
  }, [fetchLiveContent]);

  const handleRetryLoading = useCallback(() => {
    setLoading(true);
    setRetryCount(prev => prev + 1);
    toast({
      title: "Refreshing",
      description: "Loading latest matches...",
    });
  }, [toast]);

  return {
    allMatches,
    liveMatches,
    upcomingMatches,
    sports,
    loading,
    handleRetryLoading
  };
};
