
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
  name?: string;  // Display name for the stream/channel
  image?: string; // Channel logo URL
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
  isLive?: boolean;        // Whether the match is currently live
  tournament?: string;     // Tournament/competition name
  country?: string;        // Country name
  countryFlag?: string;    // Country flag URL
  channels?: MatchChannel[]; // Available broadcast channels
  score?: {                // Live score data
    home?: number | string;
    away?: number | string;
  };
  progress?: string;       // Match progress (e.g., "45'", "HT", "2nd Quarter")
  status?: string;         // Match status
  priority?: number;       // Priority score for sorting (higher = more important)
}

export interface MatchChannel {
  name: string;
  code: string;
  url: string;
  image?: string;
  viewers?: number;
}

export interface Stream {
  id: string;
  streamNo: number;
  language: string;
  hd: boolean;
  embedUrl: string;
  source: string;
  name?: string;  // Display name for the stream
  image?: string; // Channel logo URL
  timestamp?: number;  // Optional timestamp for freshness tracking
  viewers?: number;  // Viewer count for this stream
}
