
export interface Sport {
  id: string;
  name: string;
}

export interface Team {
  name: string;
  badge?: string;
  logo?: string;  // Adding logo property that's referenced in Match.tsx
}

export interface Source {
  source: string;
  id: string;
}

export interface Match {
  id: string;
  title: string;
  category: string;         // Sport category (e.g. "football", "basketball")
  date: number;            // Unix timestamp in milliseconds
  poster?: string;         // URL path to match poster image
  popular: boolean;        // Whether the match is marked as popular
  teams?: {
    home?: Team;
    away?: Team;
  };
  sources: Source[];
  related?: Match[];       // Related matches
  sportId?: string;        // Added for compatibility - maps to category
  viewerCount?: number;    // Number of current viewers
  home_score?: number | null;  // Live score for home team
  away_score?: number | null;  // Live score for away team
  status?: string;             // Match status (e.g., "live", "finished", "upcoming")
  progress?: string;           // Match progress (e.g., "45'", "HT", "FT")
}

export interface Stream {
  id: string;
  streamNo: number;
  language: string;
  hd: boolean;
  embedUrl: string;
  source: string;
  timestamp?: number;  // Optional timestamp for freshness tracking
}
