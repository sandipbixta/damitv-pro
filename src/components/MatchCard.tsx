import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Match } from '../types/sports';
import { isMatchLive } from '../utils/matchUtils';
import { useMatchTeamLogos } from '../hooks/useTeamLogo';
import { getBohoImageUrl } from '../api/sportsApi';
import { LiveViewerCount } from './LiveViewerCount';
import { generateMatchSlug } from '../utils/matchSlug';

interface MatchCardProps {
  match: Match;
  className?: string;
  sportId?: string;
  onClick?: () => void;
  preventNavigation?: boolean;
  isPriority?: boolean;
  isCompact?: boolean;
}

const MatchCard: React.FC<MatchCardProps> = ({
  match,
  className = '',
  sportId,
  onClick,
  preventNavigation,
  isPriority,
  isCompact = false
}) => {
  const [countdown, setCountdown] = React.useState<string>('');
  const [isMatchStarting, setIsMatchStarting] = React.useState(false);
  const [posterFailed, setPosterFailed] = React.useState(false);

  // Use TheSportsDB API for team logos
  const { homeLogo, awayLogo } = useMatchTeamLogos(
    match.teams?.home,
    match.teams?.away
  );

  // Reset poster error when match changes
  React.useEffect(() => {
    setPosterFailed(false);
  }, [match.id, match.poster]);

  // Calculate countdown for upcoming matches
  React.useEffect(() => {
    if (!match.date || match.date <= Date.now()) {
      setCountdown('');
      return;
    }

    const updateCountdown = () => {
      const now = Date.now();
      const timeUntilMatch = match.date - now;

      if (timeUntilMatch <= 0) {
        setCountdown('');
        setIsMatchStarting(true);
        return;
      }

      const days = Math.floor(timeUntilMatch / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeUntilMatch % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeUntilMatch % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeUntilMatch % (1000 * 60)) / 1000);

      if (days > 0) {
        setCountdown(`${days}d : ${hours}h`);
      } else if (hours > 0) {
        setCountdown(`${hours}h : ${minutes}m`);
      } else {
        setCountdown(`${minutes}m : ${seconds}s`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [match.date]);

  const formatMatchDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return format(date, "EEE, do MMM, h:mm a");
  };

  const homeBadge = homeLogo || '';
  const awayBadge = awayLogo || '';
  const home = match.teams?.home?.name || '';
  const away = match.teams?.away?.name || '';
  const hasStream = match.sources?.length > 0;
  const isLive = isMatchLive(match);

  // Get sport name from category or sportId
  const getSportName = () => {
    const sport = match.category || sportId || match.sportId || '';
    return sport.charAt(0).toUpperCase() + sport.slice(1).replace(/-/g, ' ');
  };

  // Generate thumbnail
  const generateThumbnail = () => {
    const poster = typeof match.poster === 'string' ? match.poster.trim() : '';

    if (!posterFailed && poster) {
      const posterUrl = getBohoImageUrl(poster);

      return (
        <img
          src={posterUrl}
          alt={match.title}
          className="w-full h-full object-cover"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => {
            setPosterFailed(true);
          }}
        />
      );
    }

    // Fallback with team badges
    if (homeBadge || awayBadge) {
      return (
        <div className="w-full h-full bg-gradient-to-br from-card via-muted to-card flex items-center justify-center gap-6">
          {homeBadge && (
            <img
              src={homeBadge}
              alt={home}
              className="w-14 h-14 object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          )}
          <span className="text-muted-foreground font-bold text-sm">vs</span>
          {awayBadge && (
            <img
              src={awayBadge}
              alt={away}
              className="w-14 h-14 object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          )}
        </div>
      );
    }

    return (
      <div className="w-full h-full bg-gradient-to-br from-card via-muted to-card flex items-center justify-center">
        <span className="text-muted-foreground font-bold text-lg tracking-widest">DAMITV</span>
      </div>
    );
  };

  // Team row component - simplified without logos
  const TeamRow = ({ name }: { name: string }) => (
    <div className="flex items-center">
      <span className="text-foreground font-bold text-sm truncate">{name}</span>
    </div>
  );

  const cardContent = (
    <div className="group cursor-pointer h-full">
      <div className="relative overflow-hidden rounded-lg bg-card border border-border/40 transition-all duration-300 hover:border-primary/50 hover:bg-card/90 h-full flex flex-col">
        {/* Thumbnail Section - Compact or normal height */}
        <div className={`relative ${isCompact ? 'h-24' : 'h-36'} overflow-hidden flex-shrink-0`}>
          {generateThumbnail()}
          
          {/* Gradient overlay at bottom */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
          
          {/* WATCH IN / LIVE Badge - Smaller size */}
          <div className="absolute bottom-2 left-2 z-10">
            {isLive || isMatchStarting ? (
              <div className="bg-destructive text-destructive-foreground text-[9px] font-bold uppercase px-2 py-1 rounded tracking-wide flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-current rounded-full animate-pulse" />
                LIVE
              </div>
            ) : countdown ? (
              <div className="bg-primary text-primary-foreground text-[9px] font-bold uppercase px-2 py-1 rounded tracking-wide italic">
                WATCH IN {countdown}
              </div>
            ) : null}
          </div>

          {/* Remove viewer count from thumbnail - moved to bottom */}
        </div>

        {/* Info Section */}
        <div className={`${isCompact ? 'p-2.5 gap-2' : 'p-4 gap-3'} flex flex-col flex-1`}>
          {/* Sport & Competition */}
          <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-bold truncate">
            {getSportName()} {match.title && !home && !away && `• ${match.title}`}
          </p>
          
          {/* Teams */}
          {home && away ? (
            <div className="flex flex-col gap-2">
              <TeamRow name={home} />
              <TeamRow name={away} />
            </div>
          ) : (
            <h3 className="font-bold text-foreground text-sm line-clamp-2">
              {match.title}
            </h3>
          )}
          
          {/* Bottom section - Viewer count on left, Match status on right */}
          <div className="mt-auto pt-3 border-t border-border/40">
            {isLive ? (
              <div className="flex items-center justify-between">
                {/* Viewer count on left */}
                <div className="flex items-center gap-1.5">
                  <LiveViewerCount match={match} size="sm" />
                </div>
                {/* Match is Live on right */}
                <span className="text-destructive font-bold text-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
                  Match is Live
                </span>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground font-medium">
                {match.date ? formatMatchDate(match.date) : 'Time TBD'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (preventNavigation || onClick) {
    return (
      <div className={className} onClick={onClick}>
        {cardContent}
      </div>
    );
  }

  if (hasStream) {
    const matchSlug = generateMatchSlug(home, away, match.title);
    const matchUrl = `/match/${sportId || match.sportId || match.category}/${match.id}/${matchSlug}`;
    return (
      <Link to={matchUrl} className={`block ${className}`}>
        {cardContent}
      </Link>
    );
  }

  return <div className={className}>{cardContent}</div>;
};

export default MatchCard;
