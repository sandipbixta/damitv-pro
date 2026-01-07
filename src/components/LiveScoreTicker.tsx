import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchLiveMatches } from '@/api/sportsApi';
import { Match } from '@/types/sports';
import { isMatchLive } from '@/utils/matchUtils';
import { generateMatchSlug, extractNumericId } from '@/utils/matchSlug';

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
  const [durationSec, setDurationSec] = useState<number>(600);

  // Map sport category to URL slug
  const getSportSlug = (sport: string): string => {
    const sportMap: Record<string, string> = {
      'soccer': 'football',
      'football': 'football',
      'basketball': 'basketball',
      'tennis': 'tennis',
      'cricket': 'cricket',
      'hockey': 'hockey',
      'ice hockey': 'hockey',
      'american football': 'american-football',
      'rugby': 'rugby',
    };
    return sportMap[sport.toLowerCase()] || sport.toLowerCase().replace(/\s+/g, '-');
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('🎯 Fetching matches for ticker...');
        
        // Fetch live matches from the API directly
        const matches = await fetchLiveMatches();
        
        if (matches && matches.length > 0) {
          console.log(`✅ Received ${matches.length} matches for ticker`);
          
          const items: TickerItem[] = matches.slice(0, 20).map((match: Match) => {
            const sportSlug = getSportSlug(match.category || 'football');
            const homeTeam = match.teams?.home?.name || 'Team A';
            const awayTeam = match.teams?.away?.name || 'Team B';
            const matchSlug = generateMatchSlug(homeTeam, awayTeam, match.title);
            
            return {
              id: match.id,
              homeTeam,
              awayTeam,
              homeScore: match.home_score ?? null,
              awayScore: match.away_score ?? null,
              status: match.progress || (isMatchLive(match) ? 'LIVE' : 'Upcoming'),
              sport: match.category || 'Football',
              league: '',
              homeBadge: match.teams?.home?.badge || null,
              awayBadge: match.teams?.away?.badge || null,
              isLive: isMatchLive(match),
              matchUrl: `/match/${sportSlug}/${extractNumericId(match.id)}/${matchSlug}`,
            };
          });
          
          setTickerItems(items);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('❌ Error fetching ticker data:', error);
        setIsLoading(false);
      }
    };

    fetchData();
    
    // Refresh every 60 seconds
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  // Calculate scroll duration based on content width
  useEffect(() => {
    if (trackRef.current && tickerItems.length > 0) {
      const trackWidth = trackRef.current.scrollWidth / 2;
      const viewportWidth = window.innerWidth;
      const speed = 50; // pixels per second
      const calculatedDuration = Math.max(30, trackWidth / speed);
      setDurationSec(calculatedDuration);
    }
  }, [tickerItems]);

  // Handle pause on hover
  const handleMouseEnter = () => setIsPaused(true);
  const handleMouseLeave = () => setIsPaused(false);

  if (isLoading || tickerItems.length === 0) {
    return null;
  }

  // Duplicate items for seamless loop
  const duplicatedItems = [...tickerItems, ...tickerItems];

  return (
    <div 
      className="relative bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-b border-gray-700 overflow-hidden"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Live indicator */}
      <div className="absolute left-0 top-0 bottom-0 z-10 flex items-center px-3 bg-gradient-to-r from-gray-900 via-gray-900 to-transparent">
        <div className="flex items-center gap-1.5 bg-red-600 px-2 py-0.5 rounded text-xs font-bold text-white">
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
          LIVE
        </div>
      </div>

      {/* Scrolling content */}
      <div 
        ref={trackRef}
        className="flex py-2 pl-20"
        style={{
          animation: `scroll ${durationSec}s linear infinite`,
          animationPlayState: isPaused ? 'paused' : 'running',
        }}
      >
        {duplicatedItems.map((item, index) => (
          <Link
            key={`${item.id}-${index}`}
            to={item.matchUrl}
            className="flex items-center gap-3 px-4 py-1 whitespace-nowrap hover:bg-gray-700/50 transition-colors rounded mx-1"
          >
            {/* Sport badge */}
            <span className="text-[10px] uppercase font-medium text-gray-400 bg-gray-700/50 px-1.5 py-0.5 rounded">
              {item.sport}
            </span>
            
            {/* Teams and score */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-200">{item.homeTeam}</span>
              
              {item.homeScore !== null && item.awayScore !== null ? (
                <span className="text-sm font-bold text-primary px-2 py-0.5 bg-primary/10 rounded">
                  {item.homeScore} - {item.awayScore}
                </span>
              ) : (
                <span className="text-xs text-gray-400 px-2">vs</span>
              )}
              
              <span className="text-sm text-gray-200">{item.awayTeam}</span>
            </div>
            
            {/* Status */}
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
              item.isLive 
                ? 'bg-red-500/20 text-red-400' 
                : 'bg-gray-700/50 text-gray-400'
            }`}>
              {item.status}
            </span>
          </Link>
        ))}
      </div>

      {/* Right fade overlay */}
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-gray-900 to-transparent pointer-events-none" />

      {/* Keyframe animation */}
      <style>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
};

export default LiveScoreTicker;
