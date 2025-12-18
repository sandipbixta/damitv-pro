import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Activity } from 'lucide-react';
import { getLiveScoreByTeams } from '@/hooks/useLiveScoreUpdates';

interface LiveMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: string | null;
  awayScore: string | null;
  progress: string | null;
  league: string;
  isLive: boolean;
}

const LiveScoresTicker: React.FC = () => {
  const [liveMatches, setLiveMatches] = useState<LiveMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const tickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchLiveMatches = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('fetch-popular-matches');
        
        if (error) {
          console.error('Error fetching live matches for ticker:', error);
          return;
        }

        if (data?.matches) {
          // Sports to exclude
          const EXCLUDED_SPORTS = ['tennis', 'golf', 'hockey', 'ice hockey', 'nhl', 'darts', 'billiards', 'snooker', 'pool', 'other'];
          
          // Get ALL live matches, then try to enrich with scores from live score store
          const live = data.matches
            .filter((m: any) => {
              if (!m.isLive) return false;
              const sportId = (m.sportId || '').toLowerCase();
              const category = (m.category || m.tournament || '').toLowerCase();
              return !EXCLUDED_SPORTS.some(excluded => 
                sportId.includes(excluded) || category.includes(excluded)
              );
            })
            .map((m: any) => {
              const homeTeam = m.teams?.home?.name || m.homeTeam || 'Home';
              const awayTeam = m.teams?.away?.name || m.awayTeam || 'Away';
              
              // Try to get live score from the live score store
              const liveScore = getLiveScoreByTeams(homeTeam, awayTeam);
              
              // Use score from API response, or from live score store, or null
              const homeScore = m.score?.home ?? m.homeScore ?? liveScore?.homeScore ?? null;
              const awayScore = m.score?.away ?? m.awayScore ?? liveScore?.awayScore ?? null;
              const progress = m.progress ?? liveScore?.progress ?? null;
              
              return {
                id: m.id || `${homeTeam}-${awayTeam}`,
                homeTeam,
                awayTeam,
                homeScore,
                awayScore,
                progress,
                league: m.tournament || m.league || m.category || 'Live',
                isLive: true
              };
            });
          
          console.log(`Ticker: Found ${live.length} live matches`);
          setLiveMatches(live);
        }
      } catch (error) {
        console.error('Failed to fetch live matches:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLiveMatches();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchLiveMatches, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading || liveMatches.length === 0) {
    return null;
  }

  // Duplicate matches for seamless infinite scroll
  const duplicatedMatches = [...liveMatches, ...liveMatches];

  return (
    <div className="w-full bg-black/90 backdrop-blur-sm border-b border-border/30 overflow-hidden">
      <div className="flex items-center">
        {/* Fixed Label */}
        <div className="flex-shrink-0 bg-red-600 px-3 py-2 flex items-center gap-2 z-10">
          <Activity className="w-4 h-4 text-white animate-pulse" />
          <span className="text-white text-xs font-bold uppercase tracking-wide">Live</span>
        </div>
        
        {/* Scrolling Ticker */}
        <div className="flex-1 overflow-hidden relative group">
          <div 
            ref={tickerRef}
            className="flex animate-ticker whitespace-nowrap group-hover:[animation-play-state:paused]"
            style={{
              animationDuration: `${duplicatedMatches.length * 0.8}s`
            }}
          >
            {duplicatedMatches.map((match, index) => (
              <div 
                key={`${match.id}-${index}`}
                className="flex items-center px-4 py-2 border-r border-border/20"
              >
                {/* League */}
                <span className="text-muted-foreground text-[10px] uppercase mr-3">
                  {match.league}
                </span>
                
                {/* Home Team */}
                <span className="text-white text-xs font-medium truncate max-w-[100px]">
                  {match.homeTeam}
                </span>
                
                {/* Score or LIVE indicator */}
                <div className="mx-2 bg-primary/20 px-2 py-0.5 rounded flex items-center gap-1">
                  {match.homeScore !== null && match.awayScore !== null ? (
                    <>
                      <span className="text-white font-bold text-sm tabular-nums">
                        {match.homeScore}
                      </span>
                      <span className="text-muted-foreground text-xs">-</span>
                      <span className="text-white font-bold text-sm tabular-nums">
                        {match.awayScore}
                      </span>
                    </>
                  ) : (
                    <span className="text-red-400 font-bold text-xs animate-pulse">LIVE</span>
                  )}
                </div>
                
                {/* Away Team */}
                <span className="text-white text-xs font-medium truncate max-w-[100px]">
                  {match.awayTeam}
                </span>
                
                {/* Progress */}
                {match.progress && (
                  <span className="ml-2 text-red-400 text-[10px] font-bold">
                    {match.progress}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveScoresTicker;
