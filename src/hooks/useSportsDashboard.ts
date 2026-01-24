// Sports dashboard hook - disabled (frontend only)
import { useState } from 'react';

export interface LiveMatch {
  comp: string;
  match: string;
  score: string;
  time: string;
  status: string;
  venue: string;
}

export interface Fixture {
  comp: string;
  teams: string;
  kickoff: string;
  status: string;
}

export interface Standing {
  pos: number;
  team: string;
  pld: number;
  w: number;
  d: number;
  l: number;
  gf: number;
  ga: number;
  pts: number;
}

export interface NewsArticle {
  title: string;
  summary: string;
  url: string;
}

export function useSportsDashboard() {
  const [state] = useState({
    liveMatches: [] as LiveMatch[],
    fixtures: [] as Fixture[],
    standings: [] as Standing[],
    news: [] as NewsArticle[],
    loading: { live: false, fixtures: false, standings: false, news: false },
    error: { live: null, fixtures: null, standings: null, news: null },
    lastUpdated: null as Date | null
  });

  return {
    ...state,
    refreshAll: () => {},
    isAnyLoading: false
  };
}
