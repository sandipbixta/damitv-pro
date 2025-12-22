
import React from 'react';
import { Match } from '../types/sports';
import MatchCard from './MatchCard';
import { useIsMobile } from '../hooks/use-mobile';
import { isTrendingMatch } from '../utils/popularLeagues';
import { consolidateMatches, filterCleanMatches } from '../utils/matchUtils';
import { enrichMatchesWithViewers, isMatchLive } from '../services/viewerCountService';

interface PopularMatchesProps {
  popularMatches: Match[];
  selectedSport: string | null;
  excludeMatchIds?: string[]; // Add prop to exclude specific match IDs
}

const PopularMatches: React.FC<PopularMatchesProps> = ({ 
  popularMatches, 
  selectedSport,
  excludeMatchIds = []
}) => {
  const isMobile = useIsMobile();
  const [enrichedMatches, setEnrichedMatches] = React.useState<Match[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  
  // Filter out matches without sources, advertisements, and excluded IDs, then consolidate
  const cleanMatches = filterCleanMatches(
    popularMatches
      .filter(match => match.sources && match.sources.length > 0) // CRITICAL: Must have sources
      .filter(match => !excludeMatchIds.includes(match.id))
  );
  
  // Consolidate matches (merges duplicate matches with their stream sources)
  const consolidatedMatches = React.useMemo(() => consolidateMatches(cleanMatches), [cleanMatches.length, JSON.stringify(cleanMatches.map(m => m.id))]);

  // Enrich matches with viewer counts from stream API and sort
  React.useEffect(() => {
    const enrichMatches = async () => {
      if (consolidatedMatches.length === 0) {
        setEnrichedMatches([]);
        return;
      }

      setIsLoading(true);
      
      // SMART PRIORITIZATION: Sort by likelihood of having viewers BEFORE fetching
      const liveMatches = consolidatedMatches.filter(m => isMatchLive(m));
      
      const prioritizedMatches = liveMatches
        .map(match => {
          const trendingInfo = isTrendingMatch(match.title);
          // Calculate priority score: popular flag + trending score + has poster
          const priorityScore = 
            (match.popular ? 100 : 0) + 
            (trendingInfo.score * 10) + 
            (match.poster ? 50 : 0);
          return { match, priorityScore };
        })
        .sort((a, b) => b.priorityScore - a.priorityScore)
        .map(item => item.match);
      
      // Only check top 25 most likely popular matches (faster!)
      const matchesToCheck = prioritizedMatches.slice(0, 25);
      
      console.log(`🔥 Checking viewer counts for top ${matchesToCheck.length} prioritized matches`);
      
      try {
        const matchesWithViewers = await enrichMatchesWithViewers(matchesToCheck);
        
        // Only include matches with viewer counts
        const liveMatchesWithViewers = matchesWithViewers.filter(m => 
          (m.viewerCount || 0) > 0
        );
        
        // Sort by viewer count descending (highest first)
        const sortedMatches = liveMatchesWithViewers.sort((a, b) => {
          const aViewers = a.viewerCount || 0;
          const bViewers = b.viewerCount || 0;
          return bViewers - aViewers;
        });
        
        console.log('🔥 Top 8 matches by viewers:', sortedMatches.slice(0, 8).map(m => ({
          title: m.title,
          viewers: m.viewerCount
        })));
        
        setEnrichedMatches(sortedMatches);
      } catch (error) {
        console.error('Error enriching popular matches:', error);
        // Fallback: use prioritized matches without viewer counts
        const fallbackMatches = prioritizedMatches.slice(0, 20);
        setEnrichedMatches(fallbackMatches);
      } finally {
        setIsLoading(false);
      }
    };

    enrichMatches();
    
    // Refresh every 2 minutes to get updated viewer counts
    const interval = setInterval(enrichMatches, 120000);
    return () => clearInterval(interval);
  }, [consolidatedMatches.length]);

  const filteredMatches = enrichedMatches;
  
  // Show section immediately with skeleton loaders
  if (filteredMatches.length === 0 && !isLoading) {
    return null;
  }

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">🔥</span>
        <h2 className="text-2xl font-bold text-white">Popular by Viewers</h2>
        <span className="text-sm px-3 py-1 rounded-full bg-red-600 text-white font-semibold animate-pulse">
          LIVE
        </span>
      </div>
      <p className="text-gray-400 text-sm mb-4">
        Top live matches sorted by viewer count - updated in real-time
      </p>
      <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'} gap-3 md:gap-4 auto-rows-fr`}>
        {isLoading && filteredMatches.length === 0 ? (
          // Show skeleton loaders while loading
          Array.from({ length: 8 }).map((_, i) => (
            <div key={`skeleton-${i}`} className="h-full">
              <div className="bg-card rounded-lg p-4 animate-pulse">
                <div className="h-32 bg-muted rounded mb-2"></div>
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            </div>
          ))
        ) : (
          filteredMatches.slice(0, 8).map((match, index) => (
            <div key={`popular-${match.id}-${index}`} className="h-full">
              <MatchCard 
                match={match}
                sportId={selectedSport || ''}
                isPriority={true}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PopularMatches;
