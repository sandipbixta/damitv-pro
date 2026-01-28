import React, { useEffect, useState, useMemo } from 'react';
import { Match } from '../types/sports';
import MatchCard from './MatchCard';
import { consolidateMatches, filterCleanMatches } from '../utils/matchUtils';
import { enrichMatchesWithViewers, isMatchLive } from '../services/viewerCountService';
import { Flame } from 'lucide-react';

interface PopularMatchesProps {
  popularMatches: Match[];
  selectedSport: string | null;
  excludeMatchIds?: string[];
}

const PopularMatches: React.FC<PopularMatchesProps> = ({
  popularMatches,
  selectedSport,
  excludeMatchIds = []
}) => {
  const [enrichedMatches, setEnrichedMatches] = useState<Match[]>([]);
  const [isEnriching, setIsEnriching] = useState(false);

  // Filter and consolidate matches
  const cleanMatches = filterCleanMatches(
    popularMatches
      .filter(match => match.sources && match.sources.length > 0)
      .filter(match => !excludeMatchIds.includes(match.id))
  );

  const consolidatedMatches = useMemo(
    () => consolidateMatches(cleanMatches),
    [cleanMatches.length, JSON.stringify(cleanMatches.map(m => m.id))]
  );

  // Get live matches - popular ones first, then all others
  const prioritizedMatches = useMemo(() => {
    const liveMatches = consolidatedMatches.filter(m => isMatchLive(m));
    return liveMatches
      .sort((a, b) => {
        const aScore = (a.popular ? 1 : 0);
        const bScore = (b.popular ? 1 : 0);
        return bScore - aScore;
      })
      .slice(0, 20);
  }, [consolidatedMatches]);

  // Show matches immediately, enrich with viewer counts in background
  useEffect(() => {
    if (prioritizedMatches.length === 0) {
      setEnrichedMatches([]);
      return;
    }

    // Show all matches immediately - never clear them
    setEnrichedMatches(prev => prev.length === 0 ? prioritizedMatches : prev);

    let cancelled = false;

    const enrichInBackground = async () => {
      setIsEnriching(true);
      try {
        const matchesWithViewers = await enrichMatchesWithViewers(prioritizedMatches);
        if (cancelled) return;

        // Merge viewer counts into the full list - never remove matches
        const withViewers = matchesWithViewers.filter(m => (m.viewerCount || 0) > 0);
        const withoutViewers = matchesWithViewers.filter(m => !(m.viewerCount || 0));

        // Viewer matches first (sorted by count), then the rest
        const merged = [
          ...withViewers.sort((a, b) => (b.viewerCount || 0) - (a.viewerCount || 0)),
          ...withoutViewers
        ];
        if (!cancelled) {
          setEnrichedMatches(merged);
        }
      } catch (error) {
        console.error('Error enriching popular matches:', error);
        // On error, keep showing current matches - don't clear
      } finally {
        if (!cancelled) setIsEnriching(false);
      }
    };

    enrichInBackground();
    const interval = setInterval(enrichInBackground, 120000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [prioritizedMatches.length]);

  if (enrichedMatches.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3 px-1">
        <Flame className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-bold text-foreground">Popular by Viewers</h2>
        <span className="text-xs px-2 py-0.5 rounded-full bg-destructive text-destructive-foreground font-semibold animate-pulse">
          LIVE
        </span>
        {isEnriching && (
          <span className="text-xs text-muted-foreground">updating...</span>
        )}
      </div>

      {/* Grid Layout - 2 mobile, 3 tablet, 5 PC */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        {enrichedMatches.slice(0, 10).map((match, index) => (
          <MatchCard
            key={`popular-${match.id}-${index}`}
            match={match}
            sportId={selectedSport || ''}
            isPriority={true}
            isCompact={true}
          />
        ))}
      </div>
    </div>
  );
};

export default PopularMatches;
