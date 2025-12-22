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
        <div className="w-full h-full bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900 flex items-center justify-center gap-8 px-4">
          {homeBadge && (
            <img
              src={homeBadge}
              alt={home}
              className="w-20 h-20 object-contain drop-shadow-lg"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          )}
          <span className="text-white/50 font-bold text-xl">vs</span>
          {awayBadge && (
            <img
              src={awayBadge}
              alt={away}
              className="w-20 h-20 object-contain drop-shadow-lg"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          )}
        </div>
      );
    }

    return (
      <div className="w-full h-full bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center">
        <span className="text-white/30 font-bold text-2xl tracking-widest">DAMITV</span>
      </div>
    );
  };

  // Team row component - FanCode style with larger text
  const TeamRow = ({ name, badge }: { name: string; badge: string }) => (
    <div className="flex items-center gap-3">
      <div className="w-6 h-6 rounded-full overflow-hidden bg-slate-700/50 flex items-center justify-center flex-shrink-0">
        {badge ? (
          <img
            src={badge}
            alt={name}
            className="w-full h-full object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <span className="text-[9px] font-bold text-slate-400">
            {name.substring(0, 2).toUpperCase()}
          </span>
        )}
      </div>
      <span className="text-white font-normal text-base">{name}</span>
    </div>
  );

  const cardContent = (
    <div className="group cursor-pointer h-full">
      <div className="relative overflow-hidden rounded-xl bg-[#16161e] transition-all duration-300 hover:bg-[#1c1c28] h-full flex flex-col">
        {/* Thumbnail Section */}
        <div className="relative aspect-[16/9] overflow-hidden flex-shrink-0 rounded-t-xl">
          {generateThumbnail()}
          
          {/* WATCH IN / LIVE Badge - Positioned at bottom, overlapping */}
          <div className="absolute bottom-0 left-0 z-20 translate-y-1/2 ml-3">
            {isLive || isMatchStarting ? (
              <div 
                className="text-white text-xs font-semibold italic px-3 py-1 transform -skew-x-6"
                style={{
                  background: 'linear-gradient(90deg, #dc2626 0%, #ef4444 100%)',
                }}
              >
                <span className="inline-block transform skew-x-6">● LIVE NOW</span>
              </div>
            ) : countdown ? (
              <div 
                className="text-white text-xs font-semibold italic px-3 py-1 transform -skew-x-6"
                style={{
                  background: 'linear-gradient(90deg, #0d9488 0%, #10b981 100%)',
                }}
              >
                <span className="inline-block transform skew-x-6">WATCH IN {countdown}</span>
              </div>
            ) : null}
          </div>

          {/* Viewer count for live matches */}
          {isLive && match.viewerCount && match.viewerCount > 0 && (
            <div className="absolute top-2 right-2 z-10">
              <LiveViewerCount match={match} size="sm" />
            </div>
          )}
        </div>

        {/* Info Section - FanCode style */}
        <div className="px-4 pt-6 pb-4 flex flex-col flex-1 gap-2">
          {/* Sport & Competition */}
          <p className="text-sm text-gray-400">
            {getSportName()}{match.title && ` • ${match.title.length > 35 ? match.title.substring(0, 35) + '...' : match.title}`}
          </p>
          
          {/* Teams - Vertical layout like FanCode */}
          {home && away ? (
            <div className="flex flex-col gap-2.5 mt-1">
              <TeamRow name={home} badge={homeBadge} />
              <TeamRow name={away} badge={awayBadge} />
            </div>
          ) : (
            <h3 className="font-medium text-white text-base line-clamp-2">
              {match.title}
            </h3>
          )}
          
          {/* Match Start Time - FanCode style */}
          <p className="text-sm text-gray-500 mt-auto pt-2">
            {isLive ? (
              <span className="text-red-400">Match is Live</span>
            ) : match.date ? (
              `Match Starts at ${formatMatchDate(match.date)}`
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