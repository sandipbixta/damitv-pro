import React, { useEffect, useState } from 'react';
import { Match } from '@/types/sports';
import { useSportsData } from '@/contexts/SportsDataContext';
import { enrichMatchesWithViewers, isMatchLive } from '@/services/viewerCountService';
import { Flame, Users } from 'lucide-react';
import { formatViewerCount } from '@/services/viewerCountService';
import { useNavigate } from 'react-router-dom';
import { generateMatchSlug } from '@/utils/matchSlug';
import TeamLogoDisplay from '@/components/TeamLogoDisplay';

interface PopularMatchesSidebarProps {
  currentMatchId?: string;
  className?: string;
}

const PopularMatchesSidebar: React.FC<PopularMatchesSidebarProps> = ({
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
        .slice(0, 10);

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
          .slice(0, 6);
        
        setPopularMatches(sorted);
      } catch (error) {
        console.error('Error loading popular matches:', error);
        setPopularMatches(liveMatches.slice(0, 6));
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
      <div className={`bg-card rounded-lg border border-border p-4 ${className}`}>
        <div className="flex items-center gap-2 mb-4">
          <Flame className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-foreground">Popular Now</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-14 bg-muted rounded-lg" />
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
    <div className={`bg-card rounded-lg border border-border p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Flame className="w-5 h-5 text-primary" />
        <h3 className="font-bold text-foreground">Popular Now</h3>
        <span className="text-xs px-2 py-0.5 rounded-full bg-destructive text-destructive-foreground font-semibold animate-pulse">
          LIVE
        </span>
      </div>

      {/* Match List */}
      <div className="space-y-2">
        {popularMatches.map((match, index) => {
          const homeTeam = match.teams?.home?.name || match.title.split(' vs ')[0] || 'Home';
          const awayTeam = match.teams?.away?.name || match.title.split(' vs ')[1] || 'Away';
          const homeLogo = match.teams?.home?.badge;
          const awayLogo = match.teams?.away?.badge;
          const viewerCount = match.viewerCount || 0;

          return (
            <button
              key={`sidebar-${match.id}-${index}`}
              onClick={() => handleMatchClick(match)}
              className="w-full p-3 bg-muted/50 hover:bg-muted rounded-lg transition-colors text-left group"
            >
              {/* Teams Row */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <TeamLogoDisplay logo={homeLogo} teamName={homeTeam} size="sm" />
                  <span className="text-sm font-medium text-foreground truncate">{homeTeam}</span>
                </div>
                <span className="text-xs text-muted-foreground px-1">vs</span>
                <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                  <span className="text-sm font-medium text-foreground truncate text-right">{awayTeam}</span>
                  <TeamLogoDisplay logo={awayLogo} teamName={awayTeam} size="sm" />
                </div>
              </div>

              {/* Footer Row */}
              <div className="flex items-center justify-between mt-2">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                  <span className="text-xs text-destructive font-semibold">LIVE</span>
                </span>
                {viewerCount > 0 && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="w-3 h-3" />
                    <span>{formatViewerCount(viewerCount, false)}</span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default PopularMatchesSidebar;
