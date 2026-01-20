
import React from 'react';
import { Match } from '../types/sports';
import { consolidateMatches, filterCleanMatches, isMatchLive, sortMatchesByViewers } from '../utils/matchUtils';
import { enrichMatchesWithViewerCounts } from '../utils/viewerCount';
import MatchSection from './MatchSection';
import LoadingGrid from './LoadingGrid';
import EmptyState from './EmptyState';

interface MatchesListProps {
  matches: Match[];
  sportId: string;
  isLoading: boolean;
  onMatchesDisplayed?: (matchIds: string[]) => void;
  trendingSection?: React.ReactNode; // Optional trending section to render between live and upcoming
}

const MatchesList: React.FC<MatchesListProps> = ({ 
  matches, 
  sportId, 
  isLoading,
  onMatchesDisplayed,
  trendingSection
}) => {
  const [enrichedMatches, setEnrichedMatches] = React.useState<Match[]>([]);
  const [isEnriching, setIsEnriching] = React.useState(false);

  // Filter out matches without sources, advertisements, and ended matches, then consolidate duplicates
  // Use useMemo to prevent infinite loop - only recalculate when matches change
  const consolidatedMatches = React.useMemo(() => {
    // CRITICAL: First filter - MUST have stream sources
    const matchesWithSources = matches.filter(m => m.sources && m.sources.length > 0);
    // Second filter: clean matches
    const cleanMatches = filterCleanMatches(matchesWithSources);
    // Third: consolidate duplicates
    const consolidated = consolidateMatches(cleanMatches);
    console.log(`📊 MatchesList: ${matches.length} → ${matchesWithSources.length} (with sources) → ${consolidated.length} (final)`);
    return consolidated;
  }, [matches]);

  // Enrich matches with viewer counts and sort by viewers
  React.useEffect(() => {
    const enrichMatches = async () => {
      if (consolidatedMatches.length === 0) {
        setEnrichedMatches([]);
        return;
      }

      setIsEnriching(true);
      try {
        const matchesWithViewers = await enrichMatchesWithViewerCounts(consolidatedMatches);
        const sortedMatches = sortMatchesByViewers(matchesWithViewers);
        setEnrichedMatches(sortedMatches);
      } catch (error) {
        console.error('Error enriching matches with viewer counts:', error);
        setEnrichedMatches(consolidatedMatches);
      } finally {
        setIsEnriching(false);
      }
    };

    enrichMatches();
  }, [consolidatedMatches]);

  const filteredMatches = enrichedMatches;
  
  // Report displayed match IDs to parent component
  React.useEffect(() => {
    if (onMatchesDisplayed && filteredMatches.length > 0) {
      const displayedIds = filteredMatches.map(match => match.id);
      onMatchesDisplayed(displayedIds);
    }
  }, [filteredMatches, onMatchesDisplayed]);

  // Separate matches into live and upcoming
  const liveMatches = filteredMatches.filter(match => isMatchLive(match));
  const upcomingMatches = filteredMatches.filter(match => !isMatchLive(match));

  if (isLoading || isEnriching) {
    return <LoadingGrid />;
  }

  if (filteredMatches.length === 0) {
    return <EmptyState />;
  }

  return (
    <div>
      {/* Live Matches Section */}
      <MatchSection
        matches={liveMatches}
        sportId={sportId}
        title="Live Matches"
        isLive={true}
        showEmptyMessage={liveMatches.length === 0 && upcomingMatches.length > 0}
        emptyMessage="No live matches available right now."
      />
      
      {/* Trending Section (if provided) */}
      {trendingSection}
      
      {/* Upcoming Matches Section */}
      <MatchSection
        matches={upcomingMatches}
        sportId={sportId}
        title="Upcoming Matches"
        isLive={false}
        showEmptyMessage={upcomingMatches.length === 0 && liveMatches.length > 0}
        emptyMessage="No upcoming matches scheduled at this time."
      />
    </div>
  );
};

export default MatchesList;
