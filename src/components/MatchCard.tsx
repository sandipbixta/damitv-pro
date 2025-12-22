import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Match } from '../types/sports';
import { isMatchLive } from '../utils/matchUtils';
import { teamLogoService } from '../services/teamLogoService';
import { LiveViewerCount } from './LiveViewerCount';

interface MatchCardProps {
  match: Match;
  className?: string;
  sportId?: string;
  onClick?: () => void;
  preventNavigation?: boolean;
  isPriority?: boolean;
}

const MatchCard: React.FC<MatchCardProps> = ({
  match,
  className = '',
  sportId,
  onClick,
  preventNavigation,
  isPriority
}) => {
  const [countdown, setCountdown] = React.useState<string>('');
  const [isMatchStarting, setIsMatchStarting] = React.useState(false);

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

  // Get team badges with fallbacks
  const getTeamBadge = (team: any) => {
    if (team?.badge) {
      return `https://streamed.pk/api/images/badge/${team.badge}.webp`;
    }
    const logoFromService = teamLogoService.getTeamLogo(team?.name || '', team?.badge);
    return logoFromService || '';
  };

  const homeBadge = getTeamBadge(match.teams?.home);
  const awayBadge = getTeamBadge(match.teams?.away);
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
    if (match.poster && match.poster.trim() !== '') {
      const posterUrl = match.poster.startsWith('http') 
        ? match.poster 
        : `https://streamed.pk${match.poster}.webp`;
      
      return (
        <img
          src={posterUrl}
          alt={match.title}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
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

  // Team row component - FanCode style with bold text
  const TeamRow = ({ name, badge }: { name: string; badge: string }) => (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-full overflow-hidden bg-muted/50 flex items-center justify-center flex-shrink-0">
        {badge ? (
          <img
            src={badge}
            alt={name}
            className="w-full h-full object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              const parent = (e.target as HTMLImageElement).parentElement;
              if (parent) {
                parent.innerHTML = `<span class="text-xs font-bold text-muted-foreground">${name.substring(0, 2).toUpperCase()}</span>`;
              }
            }}
          />
        ) : (
          <span className="text-xs font-bold text-muted-foreground">
            {name.substring(0, 2).toUpperCase()}
          </span>
        )}
      </div>
      <span className="text-foreground font-bold text-sm truncate">{name}</span>
    </div>
  );

  const cardContent = (
    <div className="group cursor-pointer h-full">
      <div className="relative overflow-hidden rounded-lg bg-card border border-border/40 transition-all duration-300 hover:border-primary/50 hover:bg-card/90 h-full flex flex-col">
        {/* Thumbnail Section */}
        <div className="relative aspect-video overflow-hidden flex-shrink-0">
          {generateThumbnail()}
          
          {/* Gradient overlay at bottom */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
          
          {/* WATCH IN / LIVE Badge - FanCode style with orange */}
          <div className="absolute bottom-3 left-3 z-10">
            {isLive || isMatchStarting ? (
              <div className="bg-destructive text-destructive-foreground text-[11px] font-extrabold uppercase px-3 py-1.5 rounded tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 bg-current rounded-full animate-pulse" />
                LIVE
              </div>
            ) : countdown ? (
              <div className="bg-primary text-primary-foreground text-[11px] font-extrabold uppercase px-3 py-1.5 rounded tracking-wider italic">
                WATCH IN {countdown}
              </div>
            ) : null}
          </div>

          {/* Viewer count for live matches */}
          {isLive && match.viewerCount && match.viewerCount > 0 && (
            <div className="absolute top-3 right-3 z-10">
              <LiveViewerCount match={match} size="sm" />
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="p-4 flex flex-col flex-1 gap-3">
          {/* Sport & Competition */}
          <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-bold truncate">
            {getSportName()} {match.title && !home && !away && `• ${match.title}`}
          </p>
          
          {/* Teams */}
          {home && away ? (
            <div className="flex flex-col gap-3">
              <TeamRow name={home} badge={homeBadge} />
              <TeamRow name={away} badge={awayBadge} />
            </div>
          ) : (
            <h3 className="font-bold text-foreground text-sm line-clamp-2">
              {match.title}
            </h3>
          )}
          
          {/* Match Start Time */}
          <p className="text-xs text-muted-foreground mt-auto pt-3 border-t border-border/40 font-medium">
            {isLive ? (
              <span className="text-destructive font-bold">● Match is Live</span>
            ) : match.date ? (
              formatMatchDate(match.date)
            ) : (
              'Time TBD'
            )}
          </p>
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
    return (
      <Link to={`/match/${sportId || match.sportId || match.category}/${match.id}`} className={`block ${className}`}>
        {cardContent}
      </Link>
    );
  }

  return <div className={className}>{cardContent}</div>;
};

export default MatchCard;
