import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { QUERY_KEYS } from '@/lib/queryClient';
import { Match } from '@/types/sports';

// Extended source type (includes CDN channel info)
interface MatchSource {
  source: string;
  id: string;
  name?: string;
  image?: string;
  isCdn?: boolean;
}

// Edge function response type
interface PopularMatchResponse {
  id: string;
  title: string;
  category: string;
  date: number;
  popular: boolean;
  teams: {
    home: { name: string; badge?: string };
    away: { name: string; badge?: string };
  };
  sources: MatchSource[];
  poster?: string;
  tournament?: string;
  isLive: boolean;
  score?: { home?: string; away?: string };
  progress?: string;
  priority: number;
  broadcaster?: string;
}

// Memory cache for instant access
let cachedMatches: Match[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

// Transform edge function response to Match type for MatchCard compatibility
function transformToMatch(data: PopularMatchResponse): Match {
  // Extract CDN channels from sources for the channels property
  const cdnSources = data.sources.filter(s => s.isCdn);
  const channels = cdnSources.length > 0 ? cdnSources.map(s => ({
    name: s.name || s.source,
    code: 'cdn',
    url: s.id,
    image: s.image,
  })) : undefined;

  return {
    id: data.id,
    title: data.title,
    category: data.category,
    date: data.date,
    popular: data.popular,
    teams: {
      home: {
        name: data.teams.home.name,
        badge: data.teams.home.badge,
      },
      away: {
        name: data.teams.away.name,
        badge: data.teams.away.badge,
      },
    },
    // Sources now include both WeStream (priority) and CDN channels (backup)
    sources: data.sources.map(s => ({
      source: s.source,
      id: s.id,
      name: s.name,
      image: s.image,
    })),
    poster: data.poster,
    tournament: data.tournament,
    isLive: data.isLive,
    score: data.score ? {
      home: data.score.home,
      away: data.score.away,
    } : undefined,
    progress: data.progress,
    priority: data.priority,
    channels, // For display purposes on match cards
  };
}

const fetchPopularMatches = async (): Promise<Match[]> => {
  // Return memory cache if fresh
  if (cachedMatches && Date.now() - cacheTimestamp < CACHE_DURATION) {
    console.log('⚡ Using memory cache for popular matches');
    return cachedMatches;
  }

  console.log('🌐 Fetching popular matches from edge function...');
  
  const { data, error } = await supabase.functions.invoke('fetch-popular-matches');
  
  if (error) {
    console.error('Error fetching popular matches:', error);
    // Return stale cache if available
    if (cachedMatches) {
      console.log('⚠️ Using stale cache due to error');
      return cachedMatches;
    }
    throw error;
  }
  
  const rawMatches: PopularMatchResponse[] = data?.matches || [];
  const matches = rawMatches.map(transformToMatch);
  
  // Update memory cache
  cachedMatches = matches;
  cacheTimestamp = Date.now();
  
  console.log(`✅ Fetched ${matches.length} popular matches`);
  return matches;
};

export const usePopularMatches = (enabled: boolean = true) => {
  return useQuery({
    queryKey: QUERY_KEYS.POPULAR_MATCHES,
    queryFn: fetchPopularMatches,
    enabled,
    staleTime: 3 * 60 * 1000, // 3 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
    refetchInterval: 3 * 60 * 1000, // Refresh every 3 minutes
    refetchOnWindowFocus: false,
    // Return cached data immediately while fetching
    initialData: cachedMatches || undefined,
  });
};

// Preload function - call on app init
export const preloadPopularMatches = () => {
  fetchPopularMatches().catch(console.error);
};

// Get cached match instantly without network request
export const usePopularMatchesCache = () => {
  return {
    getMatch: (matchId: string) => {
      if (cachedMatches) {
        return cachedMatches.find(m => m.id === matchId) || null;
      }
      return null;
    },
    getAllCached: () => cachedMatches,
    isCached: () => !!cachedMatches
  };
};
