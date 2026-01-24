import React from 'react';
import { Match } from '../types/sports';
import MatchCard from './MatchCard';

interface SportCarouselRowProps {
  sportId: string;
  sportName: string;
  matches: Match[];
  matchCount: number;
}

const SportCarouselRow: React.FC<SportCarouselRowProps> = ({
  sportId,
  sportName,
  matches,
  matchCount
}) => {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-lg sm:text-xl font-bold text-foreground">
          {sportName}
        </h3>
        <span className="text-xs sm:text-sm text-muted-foreground">
          {matchCount} live match{matchCount !== 1 ? 'es' : ''}
        </span>
      </div>

      {/* Grid Layout - 2 mobile, 3 tablet, 5 PC */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        {matches.map((match) => (
          <MatchCard
            key={`${match.sportId || sportId}-${match.id}`}
            match={match}
            sportId={match.sportId || sportId}
            isCompact={true}
          />
        ))}
      </div>
    </div>
  );
};

export default SportCarouselRow;
