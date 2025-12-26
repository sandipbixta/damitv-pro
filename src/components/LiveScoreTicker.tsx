import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { fetchLiveMatches } from '@/api/sportsApi';
import { Match } from '@/types/sports';
import { isMatchLive } from '@/utils/matchUtils';
import { generateMatchSlug } from '@/utils/matchSlug';

interface LiveScore {
  eventId: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  progress: string | null;
  sport: string;
  league: string;
  homeBadge: string | null;
  awayBadge: string | null;
}

interface TickerItem {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  sport: string;
  league: string;
  homeBadge: string | null;
  awayBadge: string | null;
  isLive: boolean;
  matchUrl: string;
}

const LiveScoreTicker: React.FC = () => {
  const [tickerItems, setTickerItems] = useState<TickerItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  const trackRef = useRef<HTMLDivElement | null>(null);
  // Keep scrolling speed readable regardless of how many items are in the ticker
  const [durationSec, setDurationSec] = useState<number>(600);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Add timestamp to bust cache
        const timestamp = Date.now();
        console.log('🎯 Fetching live scores at:', new Date(timestamp).toISOString());
        
        // First try to get live scores from TheSportsDB
        const { data: liveScoreData, error } = await supabase.functions.invoke('fetch-live-scores', {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
        });
        
        if (error) {
          console.error('Error from fetch-live-scores:', error);
        }
        
        let items: TickerItem[] = [];
        
        if (liveScoreData?.success && liveScoreData.liveScores?.length > 0) {
          console.log(`✅ Received ${liveScoreData.liveScores.length} live scores`);
          // Use live scores from TheSportsDB
          items = liveScoreData.liveScores.map((score: LiveScore) => {
            const sportSlug = getSportSlug(score.sport);
            const matchSlug = generateMatchSlug(score.homeTeam, score.awayTeam, `${score.homeTeam} vs ${score.awayTeam}`);
            return {
              id: score.eventId,
              homeTeam: score.homeTeam,
              awayTeam: score.awayTeam,
              homeScore: score.homeScore,
              awayScore: score.awayScore,
              status: formatProgress(score.progress, score.status),
              sport: score.sport,
              league: score.league,
              homeBadge: score.homeBadge,
              awayBadge: score.awayBadge,
              isLive: true,
              matchUrl: `/match/${sportSlug}/${score.eventId}/${matchSlug}`,
            };
          });
        }
        
        // If no live scores, fallback to live matches from API
        if (items.length === 0) {
          console.log('📡 No live scores, fetching from fallback API...');
          const matches = await fetchLiveMatches();
          const now = Date.now();
          
          // Get live matches or matches starting soon
          const relevantMatches = matches.filter(match => {
            const live = isMatchLive(match);
            const isStartingSoon = match.date && match.date - now < 2 * 60 * 60 * 1000;
            return live || isStartingSoon;
          }).slice(0, 20);
          
          items = relevantMatches.map(match => {
            const home = match.teams?.home?.name || '';
            const away = match.teams?.away?.name || '';
            const matchSlug = generateMatchSlug(home, away, match.title);
            const homeBadge = match.teams?.home?.badge 
              ? (match.teams.home.badge.startsWith('http') ? match.teams.home.badge : `https://streamed.su/api/images/badge/${match.teams.home.badge}`)
              : null;
            const awayBadge = match.teams?.away?.badge
              ? (match.teams.away.badge.startsWith('http') ? match.teams.away.badge : `https://streamed.su/api/images/badge/${match.teams.away.badge}`)
              : null;
            
            return {
              id: match.id,
              homeTeam: home || match.title.split(' vs ')[0] || match.title,
              awayTeam: away || match.title.split(' vs ')[1] || '',
              homeScore: null,
              awayScore: null,
              status: isMatchLive(match) ? 'LIVE' : getTimeUntil(match.date),
              sport: match.category?.replace(/-/g, ' ') || 'Sports',
              league: match.category?.replace(/-/g, ' ') || '',
              homeBadge,
              awayBadge,
              isLive: isMatchLive(match),
              matchUrl: `/match/${match.category}/${match.id}/${matchSlug}`,
            };
          });
        }
        
        setTickerItems(items);
      } catch (error) {
        console.error('Error fetching ticker data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    
    // Refresh every 30 seconds for more up-to-date scores
    const interval = setInterval(fetchData, 30 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    const speedPxPerSec = 18; // lower = slower
    const compute = () => {
      const distancePx = el.scrollWidth / 2;
      if (!distancePx || Number.isNaN(distancePx)) return;
      const next = Math.max(240, Math.round(distancePx / speedPxPerSec));
      setDurationSec(next);
    };

    let raf1 = 0;
    let raf2 = 0;
    raf1 = requestAnimationFrame(() => {
      compute();
      raf2 = requestAnimationFrame(compute);
    });

    window.addEventListener('resize', compute);
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      window.removeEventListener('resize', compute);
    };
  }, [tickerItems.length]);

  const getSportSlug = (sport: string): string => {
    const sportMap: Record<string, string> = {
      'Soccer': 'football',
      'soccer': 'football',
      'Basketball': 'basketball',
      'basketball': 'basketball',
      'Ice Hockey': 'hockey',
      'icehockey': 'hockey',
      'American Football': 'american-football',
      'american_football': 'american-football',
      'Tennis': 'tennis',
      'tennis': 'tennis',
      'Rugby': 'rugby',
      'rugby': 'rugby',
      'Cricket': 'cricket',
      'cricket': 'cricket',
    };
    return sportMap[sport] || sport.toLowerCase().replace(/\s+/g, '-');
  };

  const formatProgress = (progress: string | null, status: string): string => {
    if (progress) return progress;
    if (status) {
      if (status.includes('HT')) return 'HT';
      if (status.includes('FT')) return 'FT';
      if (status.includes('Q1')) return 'Q1';
      if (status.includes('Q2')) return 'Q2';
      if (status.includes('Q3')) return 'Q3';
      if (status.includes('Q4')) return 'Q4';
      return status;
    }
    return 'LIVE';
  };

  const getTimeUntil = (date: number | undefined): string => {
    if (!date) return '';
    const now = Date.now();
    const diff = date - now;
    if (diff <= 0) return 'LIVE';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (isLoading || tickerItems.length === 0) {
    return null;
  }

  // Duplicate items for seamless looping
  const duplicatedItems = [...tickerItems, ...tickerItems];

  return (
    <div 
      className="bg-card/80 backdrop-blur-sm border-b border-border overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="relative flex items-center h-10">
        {/* Live indicator */}
        <div className="absolute left-0 z-10 bg-gradient-to-r from-card via-card to-transparent pr-6 pl-3 h-full flex items-center">
          <div className="flex items-center gap-1.5 bg-destructive/10 px-2.5 py-1 rounded">
            <span className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
            <span className="text-destructive font-bold text-xs uppercase tracking-wide">Live</span>
          </div>
        </div>

        {/* Scrolling content */}
        <div
          ref={trackRef}
          className={`flex pl-24 ${isPaused ? '' : 'animate-scroll-left'}`}
          style={{
            animationDuration: `${durationSec}s`,
            ...(isPaused ? { animationPlayState: 'paused' } : {}),
          }}
        >
          {duplicatedItems.map((item, index) => (
            <Link
              key={`${item.id}-${index}`}
              to={item.matchUrl}
              className="flex-shrink-0 px-4 py-1.5 hover:bg-muted/50 transition-colors text-sm whitespace-nowrap flex items-center gap-3 border-r border-border/30"
            >
              {/* Sport badge */}
              <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                {item.sport.length > 10 ? item.sport.substring(0, 8) + '..' : item.sport}
              </span>
              
              {/* Teams and Score */}
              <div className="flex items-center gap-2">
                {/* Home Team */}
                <div className="flex items-center gap-1.5">
                  {item.homeBadge && (
                    <img 
                      src={item.homeBadge} 
                      alt={item.homeTeam}
                      className="w-4 h-4 object-contain"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  )}
                  <span className="text-foreground font-medium text-xs max-w-[80px] truncate">{item.homeTeam}</span>
                </div>
                
                {/* Score */}
                {item.homeScore !== null && item.awayScore !== null ? (
                  <div className="flex items-center gap-1 bg-muted/50 px-2 py-0.5 rounded">
                    <span className="text-foreground font-bold text-sm">{item.homeScore}</span>
                    <span className="text-muted-foreground">-</span>
                    <span className="text-foreground font-bold text-sm">{item.awayScore}</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground text-xs">vs</span>
                )}
                
                {/* Away Team */}
                <div className="flex items-center gap-1.5">
                  <span className="text-foreground font-medium text-xs max-w-[80px] truncate">{item.awayTeam}</span>
                  {item.awayBadge && (
                    <img 
                      src={item.awayBadge} 
                      alt={item.awayTeam}
                      className="w-4 h-4 object-contain"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  )}
                </div>
              </div>
              
              {/* Status */}
              <span className={`text-[10px] font-bold uppercase ${item.isLive ? 'text-destructive' : 'text-primary'}`}>
                {item.status}
              </span>
            </Link>
          ))}
        </div>

        {/* Fade overlay on right */}
        <div className="absolute right-0 z-10 bg-gradient-to-l from-card via-card to-transparent w-16 h-full" />
      </div>
    </div>
  );
};

export default LiveScoreTicker;
