import React from 'react';
import { Link } from 'react-router-dom';
import { Play, Users, Clock } from 'lucide-react';

interface CDNChannel {
  channel_name: string;
  channel_code: string;
  url: string;
  image?: string;
  viewers?: number;
}

interface CDNMatch {
  gameID: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamIMG?: string;
  awayTeamIMG?: string;
  time?: string;
  tournament?: string;
  country?: string;
  countryIMG?: string;
  status?: string;
  start?: string;
  channels?: CDNChannel[];
}

interface CDNMatchCardProps {
  match: CDNMatch;
}

const CDNMatchCard: React.FC<CDNMatchCardProps> = ({ match }) => {
  const totalViewers = match.channels?.reduce((sum, ch) => sum + (ch.viewers || 0), 0) || 0;
  const isLive = match.status === 'live' || match.status === 'playing';
  const isFinished = match.status === 'finished';
  
  // Get the first channel URL for streaming
  const streamUrl = match.channels?.[0]?.url || '';
  
  // Format time
  const displayTime = match.time || '';

  return (
    <Link 
      to={`/cdn-player/${match.gameID}`}
      state={{ match }}
      className="block group"
    >
      <div className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10">
        {/* Header with tournament */}
        <div className="bg-muted/50 px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {match.countryIMG && (
              <img 
                src={match.countryIMG} 
                alt={match.country || ''} 
                className="w-5 h-4 object-cover rounded-sm"
              />
            )}
            <span className="text-xs text-muted-foreground truncate max-w-[120px]">
              {match.tournament || match.country || 'Sports'}
            </span>
          </div>
          {isLive && (
            <span className="flex items-center gap-1 text-xs font-semibold text-red-500">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              LIVE
            </span>
          )}
          {isFinished && (
            <span className="text-xs text-muted-foreground">FT</span>
          )}
        </div>

        {/* Teams Section */}
        <div className="p-4">
          {/* Home Team */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
              {match.homeTeamIMG ? (
                <img 
                  src={match.homeTeamIMG} 
                  alt={match.homeTeam}
                  className="w-8 h-8 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder.svg';
                  }}
                />
              ) : (
                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-xs font-bold text-primary">
                  {match.homeTeam?.charAt(0) || 'H'}
                </div>
              )}
            </div>
            <span className="text-sm font-medium text-foreground truncate flex-1">
              {match.homeTeam}
            </span>
          </div>

          {/* Away Team */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
              {match.awayTeamIMG ? (
                <img 
                  src={match.awayTeamIMG} 
                  alt={match.awayTeam}
                  className="w-8 h-8 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder.svg';
                  }}
                />
              ) : (
                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-xs font-bold text-primary">
                  {match.awayTeam?.charAt(0) || 'A'}
                </div>
              )}
            </div>
            <span className="text-sm font-medium text-foreground truncate flex-1">
              {match.awayTeam}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {displayTime && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {displayTime}
              </span>
            )}
            {totalViewers > 0 && (
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {totalViewers}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-primary text-xs font-medium group-hover:underline">
            <Play className="w-3 h-3" />
            Watch
          </div>
        </div>
      </div>
    </Link>
  );
};

export default CDNMatchCard;
