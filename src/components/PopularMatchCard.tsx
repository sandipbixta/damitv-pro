import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Match } from '../types/sports';
import { getBohoImageUrl } from '../api/sportsApi';
import { generateMatchSlug, extractNumericId } from '../utils/matchSlug';
import { LiveViewerCount } from './LiveViewerCount';
import { isMatchLive } from '../utils/matchUtils';

interface PopularMatchCardProps {
  match: Match;
  rank: number;
  sportId?: string;
}

const PopularMatchCard: React.FC<PopularMatchCardProps> = ({ match, rank, sportId }) => {
  const [imageFailed, setImageFailed] = useState(false);
  
  const home = match.teams?.home?.name || '';
  const away = match.teams?.away?.name || '';
  const hasStream = match.sources?.length > 0;
  const isLive = isMatchLive(match);

  // Use poster (portrait image) from API - this is the square/vertical one with both team badges
  const posterUrl = match.poster ? getBohoImageUrl(match.poster) : null;

  const matchSlug = generateMatchSlug(home, away, match.title);
  const numericId = extractNumericId(match.id);
  const matchUrl = `/match/${sportId || match.sportId || match.category}/${numericId}/${matchSlug}`;

  const cardContent = (
    <div className="relative h-full group cursor-pointer">
      {/* Image container - portrait style for poster images */}
      <div className="relative h-[220px] sm:h-[240px] rounded-lg overflow-hidden bg-card border border-border/40 transition-all duration-300 hover:border-primary/50 hover:scale-105">
        {posterUrl && !imageFailed ? (
          <img
            src={posterUrl}
            alt={match.title}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-card via-muted to-card flex items-center justify-center">
            <span className="text-muted-foreground font-bold text-lg tracking-widest">DAMITV</span>
          </div>
        )}

        {/* Gradient overlay - only at bottom for text readability */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/90 to-transparent" />

        {/* Live badge */}
        {isLive && (
          <div className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-[10px] font-bold uppercase px-2 py-1 rounded flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-current rounded-full animate-pulse" />
            LIVE
          </div>
        )}

        {/* Content overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-2">
          <h4 className="text-white font-bold text-xs line-clamp-1">
            {home && away ? `${home} vs ${away}` : match.title}
          </h4>
          {isLive && (
            <div className="flex items-center gap-2 mt-0.5">
              <LiveViewerCount match={match} size="sm" />
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (hasStream) {
    return (
      <Link to={matchUrl} className="block">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
};

export default PopularMatchCard;
