// Highlights hook - disabled (frontend only)
import { useState } from 'react';

export interface Highlight {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: string | null;
  awayScore: string | null;
  date: string;
  league: string;
  sport: string;
  leagueBadge: string | null;
  homeTeamBadge: string | null;
  awayTeamBadge: string | null;
  thumbnail: string | null;
  video: string;
  embedUrl: string;
  venue: string | null;
}

export const useHighlights = () => {
  const [highlights] = useState<Highlight[]>([]);
  const [sports] = useState<string[]>([]);

  return { highlights, sports, loading: false, error: null };
};
