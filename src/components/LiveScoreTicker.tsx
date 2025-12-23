import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchLiveMatches } from '@/api/sportsApi';
import { Match } from '@/types/sports';
import { isMatchLive } from '@/utils/matchUtils';
import { generateMatchSlug } from '@/utils/matchSlug';

const LiveScoreTicker: React.FC = () => {
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const matches = await fetchLiveMatches();
        // Filter to only show live matches or matches starting soon
        const now = Date.now();
        const relevantMatches = matches.filter(match => {
          const isLive = isMatchLive(match);
          const isStartingSoon = match.date && match.date - now < 2 * 60 * 60 * 1000; // Within 2 hours
          return isLive || isStartingSoon;
        }).slice(0, 15);
        
        setLiveMatches(relevantMatches);
      } catch (error) {
        console.error('Error fetching live matches for ticker:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMatches();
    
    // Refresh every 2 minutes
    const interval = setInterval(fetchMatches, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading || liveMatches.length === 0) {
    return null;
  }

  const getMatchDisplay = (match: Match) => {
    const home = match.teams?.home?.name || '';
    const away = match.teams?.away?.name || '';
    const isLive = isMatchLive(match);
    
    if (home && away) {
      return (
        <span className="flex items-center gap-2">
          {isLive && (
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-destructive rounded-full animate-pulse" />
              <span className="text-destructive font-bold text-[10px] uppercase">LIVE</span>
            </span>
          )}
          <span className="text-foreground font-medium">{home}</span>
          <span className="text-muted-foreground">vs</span>
          <span className="text-foreground font-medium">{away}</span>
          <span className="text-muted-foreground text-xs">•</span>
          <span className="text-primary text-xs font-medium uppercase">{match.category?.replace(/-/g, ' ')}</span>
        </span>
      );
    }
    
    return (
      <span className="flex items-center gap-2">
        {isLive && (
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-destructive rounded-full animate-pulse" />
            <span className="text-destructive font-bold text-[10px] uppercase">LIVE</span>
          </span>
        )}
        <span className="text-foreground font-medium">{match.title}</span>
      </span>
    );
  };

  const getMatchUrl = (match: Match) => {
    const home = match.teams?.home?.name || '';
    const away = match.teams?.away?.name || '';
    const matchSlug = generateMatchSlug(home, away, match.title);
    return `/match/${match.category}/${match.id}/${matchSlug}`;
  };

  // Duplicate matches for seamless looping
  const duplicatedMatches = [...liveMatches, ...liveMatches];

  return (
    <div className="bg-card/80 backdrop-blur-sm border-b border-border overflow-hidden">
      <div className="relative flex items-center h-8">
        {/* Live indicator */}
        <div className="absolute left-0 z-10 bg-gradient-to-r from-card via-card to-transparent pr-4 pl-2 h-full flex items-center">
          <div className="flex items-center gap-1.5 bg-destructive/10 px-2 py-0.5 rounded">
            <span className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
            <span className="text-destructive font-bold text-xs uppercase tracking-wide">Live</span>
          </div>
        </div>

        {/* Scrolling content */}
        <div className="flex animate-scroll-left pl-24">
          {duplicatedMatches.map((match, index) => (
            <Link
              key={`${match.id}-${index}`}
              to={getMatchUrl(match)}
              className="flex-shrink-0 px-6 py-1 hover:bg-muted/50 transition-colors text-sm whitespace-nowrap"
            >
              {getMatchDisplay(match)}
            </Link>
          ))}
        </div>

        {/* Fade overlay on right */}
        <div className="absolute right-0 z-10 bg-gradient-to-l from-card via-card to-transparent w-12 h-full" />
      </div>
    </div>
  );
};

export default LiveScoreTicker;
