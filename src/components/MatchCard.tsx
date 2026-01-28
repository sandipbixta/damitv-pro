import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Match } from '../types/sports';
import { isMatchLive } from '../utils/matchUtils';
import { useMatchTeamLogos } from '../hooks/useTeamLogo';
import { useLiveScore } from '../hooks/useLiveScore';
import { LiveViewerCount } from './LiveViewerCount';
import { generateMatchSlug, extractNumericId } from '../utils/matchSlug';
import { getMatchPosterImage } from '../utils/matchImageMapping';
import { getBohoImageUrl } from '../api/sportsApi';

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

  // Use TheSportsDB API for team logos and fanart
  const { homeLogo, awayLogo, homeFanart, awayFanart } = useMatchTeamLogos(
    match.teams?.home,
    match.teams?.away
  );

  // Get fanart for background (prefer home team)
  const teamFanart = homeFanart || awayFanart;

  const homeBadge = homeLogo || '';
  const awayBadge = awayLogo || '';
  const home = match.teams?.home?.name || '';
  const away = match.teams?.away?.name || '';
  const hasStream = match.sources?.length > 0;
  const isLive = isMatchLive(match);

  // Get live score from TheSportsDB
  const liveScore = useLiveScore(
    home,
    away,
    match.category || sportId,
    isLive
  );

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

  // Get sport name from category or sportId
  const getSportName = () => {
    const sport = match.category || sportId || match.sportId || '';
    return sport.charAt(0).toUpperCase() + sport.slice(1).replace(/-/g, ' ');
  };

  // Generate thumbnail - Priority: Custom Image → TheSportsDB Fanart → Streamed Poster → Team Logos → Team Initials
  const generateThumbnail = () => {
    // 1. First check for custom mapped poster image only
    const customPoster = getMatchPosterImage(match.title, match.category);
    if (customPoster) {
      return (
        <div className="w-full h-full bg-card flex items-center justify-center">
          <img
            src={customPoster}
            alt={match.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      );
    }

    // 2. If we have TheSportsDB fanart, show it (no logo overlay)
    if (teamFanart) {
      return (
        <div className="w-full h-full">
          <img
            src={teamFanart}
            alt={match.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      );
    }

    // 3. If we have a poster from the API, show it (no logo overlay)
    const posterUrl = match.poster ? getBohoImageUrl(match.poster) : null;
    if (posterUrl) {
      return (
        <div className="w-full h-full">
          <img
            src={posterUrl}
            alt={match.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      );
    }

    // 4. Show team logos/badges or initials (no fanart or poster available)
    // NOTE: Only show "vs" here - scores are displayed in TeamRow below, not on poster
    return (
      <div className="w-full h-full bg-gradient-to-br from-card via-muted to-card flex items-center justify-center gap-3 px-6">
        <div className="flex-1 flex justify-end items-center">
          {homeBadge ? (
            <img
              src={homeBadge}
              alt={home}
              style={{ maxWidth: 50, maxHeight: 70 }}
              className="object-contain w-auto h-auto"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-base font-bold text-muted-foreground">{home.charAt(0) || 'H'}</span>
            </div>
          )}
        </div>
        {/* Always show "vs" - never show scores on poster thumbnail */}
        <span className="text-muted-foreground font-bold text-xs flex-shrink-0">vs</span>
        <div className="flex-1 flex justify-start items-center">
          {awayBadge ? (
            <img
              src={awayBadge}
              alt={away}
              style={{ maxWidth: 50, maxHeight: 70 }}
              className="object-contain w-auto h-auto"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-base font-bold text-muted-foreground">{away.charAt(0) || 'A'}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Team row component with score
  const TeamRow = ({ name, score, isHome }: { name: string; score?: string | null; isHome: boolean }) => (
    <div className="flex items-center justify-between">
      <span
        className={`text-foreground font-bold truncate flex-1 ${isCompact ? 'text-xs sm:text-sm' : 'text-sm'}`}
      >
        {name}
      </span>
      {isLive && score !== null && score !== undefined && (
        <span className={`font-bold text-primary ml-2 ${isCompact ? 'text-sm' : 'text-base'}`}>
          {score}
        </span>
      )}
    </div>
  );

  const cardContent = (
    <div className="group cursor-pointer h-full">
      <div className="relative overflow-hidden rounded-lg bg-card border border-border/40 transition-all duration-300 hover:border-primary/50 hover:bg-card/90 h-full flex flex-col">
        {/* Thumbnail Section */}
        <div
          className={`relative ${isCompact ? 'h-28 sm:h-32' : 'h-36 sm:h-40'} flex-shrink-0`}
        >
          {generateThumbnail()}

          {/* Gradient overlay at bottom - for custom posters and API posters */}
          {(getMatchPosterImage(match.title, match.category) || match.poster) && (
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/80 to-transparent" />
          )}

          {/* WATCH IN / LIVE Badge - Smaller size */}
          <div className="absolute bottom-2 left-2 z-10">
            {isLive || isMatchStarting ? (
              <div className="bg-destructive text-destructive-foreground text-[10px] sm:text-[9px] font-bold uppercase px-2 py-1 rounded tracking-wide flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-current rounded-full animate-pulse" />
                {liveScore.matchTime ? `${liveScore.matchTime}'` : 'LIVE'}
              </div>
            ) : countdown ? (
              <div className="bg-primary text-primary-foreground text-[10px] sm:text-[9px] font-bold uppercase px-2 py-1 rounded tracking-wide italic">
                WATCH IN {countdown}
              </div>
            ) : null}
          </div>

        </div>

        {/* Info Section - Compact has smaller text area */}
        <div className={`${isCompact ? 'p-2 gap-1 sm:p-3 sm:gap-2' : 'p-4 gap-3'} flex flex-col flex-1`}>
          {/* Sport & Competition */}
          <p className="text-[10px] sm:text-[11px] text-muted-foreground uppercase tracking-widest font-bold truncate">
            {getSportName()} {match.title && !home && !away && `• ${match.title}`}
          </p>

          {/* Teams with Scores */}
          {home && away ? (
            <div className={`flex flex-col ${isCompact ? 'gap-1.5 sm:gap-2' : 'gap-2'}`}>
              <TeamRow name={home} score={liveScore.homeScore} isHome={true} />
              <TeamRow name={away} score={liveScore.awayScore} isHome={false} />
            </div>
          ) : (
            <h3 className="font-bold text-foreground text-sm line-clamp-2">
              {match.title}
            </h3>
          )}

          {/* Bottom section - Viewer count on left, Match status on right */}
          <div className={`mt-auto border-t border-border/40 ${isCompact ? 'pt-2 sm:pt-3' : 'pt-3'}`}>
            {isLive ? (
              <div className="flex items-center justify-between">
                {/* Viewer count on left */}
                <div className="flex items-center gap-1.5">
                  <LiveViewerCount match={match} size="sm" />
                </div>
                {/* Match is Live on right */}
                <span className={`text-destructive font-bold flex items-center gap-1.5 ${isCompact ? 'text-[11px] sm:text-xs' : 'text-xs'}`}>
                  <span className={`${isCompact ? 'w-1.5 h-1.5' : 'w-2 h-2'} bg-destructive rounded-full animate-pulse`} />
                  Match is Live
                </span>
              </div>
            ) : (
              <p className={`${isCompact ? 'text-[11px] sm:text-xs' : 'text-xs'} text-muted-foreground font-medium`}>
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
    const numericId = extractNumericId(match.id);
    const matchUrl = `/match/${sportId || match.sportId || match.category}/${numericId}/${matchSlug}`;
    return (
      <Link to={matchUrl} className={`block ${className}`}>
        {cardContent}
      </Link>
    );
  }

  return <div className={className}>{cardContent}</div>;
};

export default MatchCard;
