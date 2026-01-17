import React, { useEffect, useState } from 'react';
import { Match } from '@/types/sports';
import { useSportsData } from '@/contexts/SportsDataContext';
import { enrichMatchesWithViewers, isMatchLive } from '@/services/viewerCountService';
import { Flame } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { generateMatchSlug } from '@/utils/matchSlug';
import TeamLogoDisplay from '@/components/TeamLogoDisplay';

interface PopularMatchesListProps {
  currentMatchId?: string;
  className?: string;
}

const PopularMatchesList: React.FC<PopularMatchesListProps> = ({
  currentMatchId,
  className = ''
}) => {
  const navigate = useNavigate();
  const { allMatches } = useSportsData();
  const [popularMatches, setPopularMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPopularMatches = async () => {
      setIsLoading(true);
      
      // Filter live matches excluding current match
      const liveMatches = allMatches
        .filter(m => isMatchLive(m) && m.id !== currentMatchId)
        .slice(0, 8);

      if (liveMatches.length === 0) {
        setPopularMatches([]);
        setIsLoading(false);
        return;
      }

      try {
        // Enrich with viewer counts
        const enriched = await enrichMatchesWithViewers(liveMatches);
        const sorted = enriched
          .sort((a, b) => (b.viewerCount || 0) - (a.viewerCount || 0))
          .slice(0, 5);
        
        setPopularMatches(sorted);
      } catch (error) {
        console.error('Error loading popular matches:', error);
        setPopularMatches(liveMatches.slice(0, 5));
      } finally {
        setIsLoading(false);
      }
    };

    loadPopularMatches();
    
    // Refresh every 2 minutes
    const interval = setInterval(loadPopularMatches, 120000);
    return () => clearInterval(interval);
  }, [allMatches, currentMatchId]);

  const handleMatchClick = (match: Match) => {
    const homeTeam = match.teams?.home?.name || '';
    const awayTeam = match.teams?.away?.name || '';
    const slug = generateMatchSlug(homeTeam, awayTeam, match.title);
    navigate(`/match/${match.category || 'football'}/${match.id}/${slug}`);
  };

  if (isLoading) {
    return (
      <div className={`mt-6 ${className}`}>
        <div className="flex items-center gap-2 mb-3">
          <Flame className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground text-sm">Live Now</h3>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-10 bg-muted rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (popularMatches.length === 0) {
    return null;
  }

  return (
    <div className={`mt-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Flame className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-foreground text-sm">Live Now</h3>
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-destructive text-destructive-foreground font-semibold animate-pulse">
          LIVE
        </span>
      </div>

      {/* Compact Match List */}
      <div className="space-y-1.5">
        {popularMatches.map((match, index) => {
          const homeTeam = match.teams?.home?.name || match.title.split(' vs ')[0] || 'Home';
          const awayTeam = match.teams?.away?.name || match.title.split(' vs ')[1] || 'Away';
          const homeLogo = match.teams?.home?.badge;
          const awayLogo = match.teams?.away?.badge;

          return (
            <button
              key={`list-${match.id}-${index}`}
              onClick={() => handleMatchClick(match)}
              className="w-full flex items-center gap-2 p-2 bg-muted/30 hover:bg-muted/60 rounded-lg transition-colors text-left"
            >
              {/* Home Team */}
              <TeamLogoDisplay logo={homeLogo} teamName={homeTeam} size="sm" />
              <span className="text-xs font-medium text-foreground truncate flex-1 max-w-[80px]">{homeTeam}</span>
              
              {/* VS */}
              <span className="text-[10px] text-muted-foreground">vs</span>
              
              {/* Away Team */}
              <span className="text-xs font-medium text-foreground truncate flex-1 max-w-[80px] text-right">{awayTeam}</span>
              <TeamLogoDisplay logo={awayLogo} teamName={awayTeam} size="sm" />
              
              {/* Live Badge */}
              <span className="flex items-center gap-1 ml-1">
                <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default PopularMatchesList;
