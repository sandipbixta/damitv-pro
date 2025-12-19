import React from 'react';
import { Link } from 'react-router-dom';
import { Match } from '@/types/sports';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Users, Trophy, Flame } from 'lucide-react';
import TeamLogo from './TeamLogo';

interface FeaturedMatchBannerProps {
  match: Match;
}

const FeaturedMatchBanner: React.FC<FeaturedMatchBannerProps> = ({ match }) => {
  const home = match.teams?.home?.name || '';
  const away = match.teams?.away?.name || '';
  const hasTeams = !!home && !!away;

  // Generate match URL
  const matchUrl = match.sources?.[0] 
    ? `/match/${match.sources[0].source}/${match.sources[0].id}`
    : '#';

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary/20 via-background to-primary/10 border border-primary/30 mb-8">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/4 w-1/2 h-full bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-1/2 -right-1/4 w-1/2 h-full bg-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 p-4 sm:p-6 lg:p-8">
        {/* Header badges */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <Badge variant="default" className="bg-primary text-primary-foreground gap-1">
            <Flame className="w-3 h-3" />
            Featured Match
          </Badge>
          {match.isLive && (
            <Badge variant="destructive" className="animate-pulse gap-1">
              <span className="w-2 h-2 bg-white rounded-full animate-ping" />
              LIVE NOW
            </Badge>
          )}
          {match.popular && (
            <Badge variant="secondary" className="gap-1">
              <Users className="w-3 h-3" />
              Popular
            </Badge>
          )}
        </div>

        {/* Match content */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          {/* Teams/Title section */}
          <div className="flex-1 w-full">
          {hasTeams ? (
              <div className="flex items-center justify-center gap-4 sm:gap-8">
                {/* Home team */}
                <div className="flex flex-col items-center gap-2 flex-1 max-w-[150px] sm:max-w-[180px]">
                  {match.teams?.home?.badge ? (
                    <img 
                      src={match.teams.home.badge} 
                      alt={home}
                      className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 object-contain"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  ) : (
                    <TeamLogo
                      teamName={home}
                      className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24"
                    />
                  )}
                  <span className="text-sm sm:text-base lg:text-lg font-semibold text-foreground text-center line-clamp-2">
                    {home}
                  </span>
                  {match.score?.home && (
                    <span className="text-2xl sm:text-3xl font-bold text-primary">
                      {match.score.home}
                    </span>
                  )}
                </div>

                {/* VS / Score */}
                <div className="flex flex-col items-center gap-1">
                  <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-muted-foreground">
                    VS
                  </span>
                  {match.progress && (
                    <span className="text-xs sm:text-sm text-primary font-medium">
                      {match.progress}
                    </span>
                  )}
                </div>

                {/* Away team */}
                <div className="flex flex-col items-center gap-2 flex-1 max-w-[150px] sm:max-w-[180px]">
                  {match.teams?.away?.badge ? (
                    <img 
                      src={match.teams.away.badge} 
                      alt={away}
                      className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 object-contain"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  ) : (
                    <TeamLogo
                      teamName={away}
                      className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24"
                    />
                  )}
                  <span className="text-sm sm:text-base lg:text-lg font-semibold text-foreground text-center line-clamp-2">
                    {away}
                  </span>
                  {match.score?.away && (
                    <span className="text-2xl sm:text-3xl font-bold text-primary">
                      {match.score.away}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mb-2">
                  {match.title}
                </h2>
              </div>
            )}

            {/* Tournament info */}
            {(match.tournament || match.category) && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <Trophy className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {match.tournament || match.category}
                </span>
              </div>
            )}
          </div>

          {/* CTA Button */}
          <div className="flex-shrink-0">
            <Link to={matchUrl}>
              <Button size="lg" className="gap-2 px-6 sm:px-8 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-shadow">
                <Play className="w-5 h-5" />
                <span className="hidden sm:inline">Watch Now</span>
                <span className="sm:hidden">Watch</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeaturedMatchBanner;
