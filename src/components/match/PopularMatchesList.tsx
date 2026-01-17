import React, { useEffect, useState, useCallback } from 'react';
import { Match } from '@/types/sports';
import { useSportsData } from '@/contexts/SportsDataContext';
import { enrichMatchesWithViewers, isMatchLive } from '@/services/viewerCountService';
import { Flame } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { generateMatchSlug } from '@/utils/matchSlug';
import { useTeamLogo } from '@/hooks/useTeamLogo';
import { fetchLiveScore, LiveScore } from '@/services/liveScoreService';

// Individual match item with logo and live score fetching
const MobileMatchItem: React.FC<{ 
  match: Match; 
  onClick: () => void;
  liveScore?: LiveScore | null;
}> = ({ match, onClick, liveScore }) => {
  const homeTeam = match.teams?.home?.name || match.title.split(' vs ')[0] || 'Home';
  const awayTeam = match.teams?.away?.name || match.title.split(' vs ')[1] || 'Away';

  // Get scores - prioritize live score from API, fallback to match data
  const homeScore = liveScore?.homeScore ?? (match as any).homeScore ?? (match as any).home_score;
  const awayScore = liveScore?.awayScore ?? (match as any).awayScore ?? (match as any).away_score;
  const hasScore = homeScore !== undefined && homeScore !== null && awayScore !== undefined && awayScore !== null;

  // Fetch logos using hook
  const { logo: homeLogo } = useTeamLogo(homeTeam);
  const { logo: awayLogo } = useTeamLogo(awayTeam);

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 p-2 bg-muted/30 hover:bg-muted/60 rounded-lg transition-colors text-left"
    >
      {/* Home Team */}
      <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
        {homeLogo ? (
          <img src={homeLogo} alt={homeTeam} className="w-5 h-5 object-contain" />
        ) : (
          <span className="text-[10px] font-bold text-muted-foreground">{homeTeam.charAt(0)}</span>
        )}
      </div>
      <span className="text-xs font-medium text-foreground truncate flex-1 max-w-[70px]">{homeTeam}</span>
      
      {/* Score or VS */}
      {hasScore ? (
        <span className="text-xs font-bold text-primary whitespace-nowrap">
          {homeScore} - {awayScore}
        </span>
      ) : (
        <span className="text-[10px] text-muted-foreground">vs</span>
      )}
      
      {/* Away Team */}
      <span className="text-xs font-medium text-foreground truncate flex-1 max-w-[70px] text-right">{awayTeam}</span>
      <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
        {awayLogo ? (
          <img src={awayLogo} alt={awayTeam} className="w-5 h-5 object-contain" />
        ) : (
          <span className="text-[10px] font-bold text-muted-foreground">{awayTeam.charAt(0)}</span>
        )}
      </div>
      
      {/* Live Badge */}
      <span className="flex items-center gap-1 ml-1">
        <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
      </span>
    </button>
  );
};

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
  const [liveScores, setLiveScores] = useState<Map<string, LiveScore>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  // Fetch live scores for all popular matches
  const fetchScoresForMatches = useCallback(async (matches: Match[]) => {
    const newScores = new Map<string, LiveScore>();
    
    // Fetch scores in parallel (max 3 at a time to avoid rate limiting)
    for (let i = 0; i < matches.length; i += 3) {
      const batch = matches.slice(i, i + 3);
      const promises = batch.map(async (match) => {
        const homeTeam = match.teams?.home?.name || match.title.split(' vs ')[0] || '';
        const awayTeam = match.teams?.away?.name || match.title.split(' vs ')[1] || '';
        
        if (homeTeam && awayTeam) {
          const score = await fetchLiveScore(homeTeam, awayTeam);
          if (score) {
            newScores.set(match.id, score);
          }
        }
      });
      
      await Promise.all(promises);
    }
    
    setLiveScores(newScores);
  }, []);

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
        
        // Fetch live scores in background
        fetchScoresForMatches(sorted);
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
  }, [allMatches, currentMatchId, fetchScoresForMatches]);

  // Refresh live scores every minute
  useEffect(() => {
    if (popularMatches.length === 0) return;
    
    const scoreInterval = setInterval(() => {
      fetchScoresForMatches(popularMatches);
    }, 60000);
    
    return () => clearInterval(scoreInterval);
  }, [popularMatches, fetchScoresForMatches]);

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
        {popularMatches.map((match, index) => (
          <MobileMatchItem
            key={`list-${match.id}-${index}`}
            match={match}
            onClick={() => handleMatchClick(match)}
            liveScore={liveScores.get(match.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default PopularMatchesList;
