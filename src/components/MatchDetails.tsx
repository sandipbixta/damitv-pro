import React from 'react';
import { Match } from '@/types/sports';
import { ManualMatch } from '@/types/manualMatch';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Users, Trophy } from 'lucide-react';
import { format } from 'date-fns';

interface MatchDetailsProps {
  match?: Match | ManualMatch | null;
  isLive?: boolean;
  showCompact?: boolean;
  className?: string;
}

const MatchDetails: React.FC<MatchDetailsProps> = ({ 
  match, 
  isLive = false, 
  showCompact = false,
  className = ""
}) => {
  if (!match) return null;

  // Handle different match types
  const isManualMatch = 'links' in match;
  const matchTitle = isManualMatch ? match.title : match.title;
  const matchDate = isManualMatch ? new Date(match.date) : new Date(match.date);
  const matchTeams = isManualMatch ? match.teams : match.teams;
  const matchCategory = isManualMatch ? match.seo?.category : match.category;

  const formatTime = (date: Date) => {
    return format(date, 'HH:mm');
  };

  const formatDate = (date: Date) => {
    return format(date, 'MMM dd, yyyy');
  };

  // Helper functions to handle team data safely
  const getTeamName = (team: string | { name: string; logo?: string } | undefined): string => {
    if (!team) return '';
    return typeof team === 'string' ? team : team.name;
  };

  const getTeamLogo = (team: string | { name: string; logo?: string } | undefined): string | undefined => {
    if (!team || typeof team === 'string') return undefined;
    return team.logo;
  };

  const getTeamInitial = (team: string | { name: string; logo?: string } | undefined): string => {
    const name = getTeamName(team);
    return name.charAt(0).toUpperCase();
  };

  if (showCompact) {
    return (
      <div className={`bg-muted/50 rounded-lg p-3 ${className}`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sm text-foreground truncate">{matchTitle}</h3>
          {isLive && (
            <Badge variant="destructive" className="ml-2 animate-pulse">
              • LIVE
            </Badge>
          )}
        </div>
        
        {matchTeams && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <Users className="h-3 w-3" />
            <span>{getTeamName(matchTeams.home)} vs {getTeamName(matchTeams.away)}</span>
          </div>
        )}
        
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(matchDate)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{formatTime(matchDate)}</span>
          </div>
        </div>
      </div>
    );
  }

  // Generate SEO-friendly text content
  const generateMatchDescription = () => {
    const homeTeam = getTeamName(matchTeams?.home);
    const awayTeam = getTeamName(matchTeams?.away);
    const category = matchCategory || 'sports';
    const dateStr = formatDate(matchDate);
    const timeStr = formatTime(matchDate);
    
    if (matchTeams && homeTeam && awayTeam) {
      return `Watch ${homeTeam} vs ${awayTeam} live stream online for free. This exciting ${category} match is scheduled for ${dateStr} at ${timeStr}. Get access to high-quality live streaming of ${homeTeam} against ${awayTeam} with multiple stream sources available. Don't miss this thrilling ${category} encounter between two competitive teams. Stream ${homeTeam} vs ${awayTeam} live online with HD quality on our platform.`;
    } else {
      return `Watch ${matchTitle} live stream online for free. This ${category} match is scheduled for ${dateStr} at ${timeStr}. Get access to high-quality live streaming with multiple sources available. Don't miss this exciting ${category} event. Stream live online with HD quality on our platform.`;
    }
  };

  const generateAdditionalInfo = () => {
    const homeTeam = getTeamName(matchTeams?.home);
    const awayTeam = getTeamName(matchTeams?.away);
    const category = matchCategory || 'sports';
    
    if (matchTeams && homeTeam && awayTeam) {
      return `${homeTeam} and ${awayTeam} are set to face off in what promises to be an exciting ${category} match. Fans can watch this live stream for free with high-definition quality. Our platform provides multiple streaming sources to ensure you never miss the action. Both teams will be looking to secure a victory in this important ${category} fixture. The match features live commentary and real-time updates for the best viewing experience.`;
    } else {
      return `This ${category} event promises to deliver exciting action for fans worldwide. Watch the live stream for free with high-definition quality and multiple streaming sources available. Our platform ensures you get the best viewing experience with reliable streams and real-time updates. Don't miss out on this thrilling ${category} competition.`;
    }
  };

  return (
    <div className={`prose prose-sm max-w-none text-foreground space-y-4 ${className}`}>
      {/* Main Title */}
      <div className="border-b border-border pb-3">
        <h2 className="text-lg font-bold text-foreground mb-2">
          {matchTitle} {isLive && <span className="text-red-500">• LIVE NOW</span>}
        </h2>
        {matchCategory && (
          <p className="text-sm text-muted-foreground capitalize">
            {matchCategory} Match • {formatDate(matchDate)} at {formatTime(matchDate)}
          </p>
        )}
      </div>

      {/* Match Description */}
      <div className="text-sm text-muted-foreground leading-relaxed">
        <p>{generateMatchDescription()}</p>
      </div>

      {/* Teams Information */}
      {matchTeams && (
        <div className="bg-muted/30 rounded-lg p-4">
          <h3 className="font-semibold text-foreground mb-2">Match Details</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium text-foreground">Home Team</p>
              <p className="text-muted-foreground">{getTeamName(matchTeams.home)}</p>
            </div>
            <div>
              <p className="font-medium text-foreground">Away Team</p>
              <p className="text-muted-foreground">{getTeamName(matchTeams.away)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Additional SEO Content */}
      <div className="text-sm text-muted-foreground leading-relaxed">
        <p>{generateAdditionalInfo()}</p>
      </div>

      {/* Match Metadata */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        <div className="bg-muted/20 rounded p-2">
          <p className="font-medium text-foreground">Date</p>
          <p className="text-muted-foreground">{formatDate(matchDate)}</p>
        </div>
        <div className="bg-muted/20 rounded p-2">
          <p className="font-medium text-foreground">Time</p>
          <p className="text-muted-foreground">{formatTime(matchDate)}</p>
        </div>
        <div className="bg-muted/20 rounded p-2">
          <p className="font-medium text-foreground">Status</p>
          <p className="text-muted-foreground">{isLive ? 'Live Now' : 'Scheduled'}</p>
        </div>
        <div className="bg-muted/20 rounded p-2">
          <p className="font-medium text-foreground">Sport</p>
          <p className="text-muted-foreground capitalize">{matchCategory || 'Sports'}</p>
        </div>
      </div>

      {/* Additional info for manual matches */}
      {isManualMatch && match.seo?.description && (
        <div className="border-t border-border pt-4">
          <p className="text-sm text-muted-foreground">{match.seo.description}</p>
        </div>
      )}

      {/* Keywords for SEO */}
      <div className="text-xs text-muted-foreground/70 border-t border-border pt-2">
        <p>
          Keywords: #live #stream {(() => {
            // For debugging - show what we have
            if (matchTeams) {
              const homeTeam = getTeamName(matchTeams?.home);
              const awayTeam = getTeamName(matchTeams?.away);
              if (homeTeam && awayTeam) {
                const homeClean = homeTeam.replace(/\s+/g, '').toLowerCase();
                const awayClean = awayTeam.replace(/\s+/g, '').toLowerCase();
                return `#${homeClean} #${awayClean} #${homeClean}vs${awayClean} watch${homeClean}vs${awayClean} `;
              }
            }
            // If no team data, try to extract from title with multiple separators
            if (matchTitle) {
              const separators = [' vs ', ' - ', ' v ', ' VS ', ' V '];
              for (const separator of separators) {
                if (matchTitle.includes(separator)) {
                  const parts = matchTitle.split(separator);
                  if (parts.length === 2) {
                    const homeClean = parts[0].trim().replace(/\s+/g, '').toLowerCase();
                    const awayClean = parts[1].trim().replace(/\s+/g, '').toLowerCase();
                    return `#${homeClean} #${awayClean} #${homeClean}vs${awayClean} watch${homeClean}vs${awayClean} `;
                  }
                }
              }
            }
            return '';
          })()} #{matchCategory || 'sports'} #free #streaming #HD #quality #online #watch #sports #streaming #live #match
        </p>
      </div>
    </div>
  );
};

export default MatchDetails;