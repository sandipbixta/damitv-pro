import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const API_BASES = [
  'https://streamed.su/api',
  'https://justcast.stream/api',
];

const THESPORTSDB_API_KEY = Deno.env.get('THESPORTSDB_API_KEY') || '751945';

// Fetch from BOHOSport API
async function fetchMatches() {
  for (const base of API_BASES) {
    try {
      const response = await fetch(`${base}/matches/all`, {
        signal: AbortSignal.timeout(8000),
      });
      if (response.ok) {
        const data = await response.json();
        return Array.isArray(data) ? data : data?.data || [];
      }
    } catch (e) {
      console.log(`Failed to fetch from ${base}:`, e.message);
    }
  }
  return [];
}

// Fetch live scores from TheSportsDB
async function fetchLiveScores() {
  const sports = ['Soccer', 'Basketball', 'Baseball', 'Cricket'];
  const allScores: any[] = [];

  for (const sport of sports) {
    try {
      const response = await fetch(
        `https://www.thesportsdb.com/api/v2/json/livescore/${sport}`,
        {
          headers: { 'X-API-KEY': THESPORTSDB_API_KEY },
          signal: AbortSignal.timeout(5000),
        }
      );
      if (response.ok) {
        const data = await response.json();
        if (data?.livescore) {
          allScores.push(...data.livescore.map((s: any) => ({
            id: s.idEvent,
            sport: sport.toLowerCase(),
            homeTeam: s.strHomeTeam,
            awayTeam: s.strAwayTeam,
            homeScore: s.intHomeScore,
            awayScore: s.intAwayScore,
            status: s.strStatus,
            progress: s.strProgress,
            league: s.strLeague,
          })));
        }
      }
    } catch (e) {
      console.log(`Failed to fetch ${sport} scores:`, e.message);
    }
  }

  return allScores;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const endpoint = url.searchParams.get('endpoint') || 'all';

    // Categories/Sports
    const categories = [
      { id: 'football', name: 'Football', emoji: '⚽' },
      { id: 'basketball', name: 'Basketball', emoji: '🏀' },
      { id: 'baseball', name: 'Baseball', emoji: '⚾' },
      { id: 'cricket', name: 'Cricket', emoji: '🏏' },
    ];

    // Fetch matches
    const rawMatches = await fetchMatches();
    const now = Date.now();

    // Process matches with embed URLs
    const matches = rawMatches
      .filter((m: any) => {
        const cat = (m.category || '').toLowerCase();
        return ['football', 'soccer', 'basketball', 'baseball', 'cricket'].some(s => cat.includes(s));
      })
      .map((m: any) => {
        const sources = (m.sources || []).map((s: any) => ({
          source: s.source,
          id: s.id,
          embedUrl: `https://embed.damitv.pro/${s.source}/${s.id}`,
        }));

        return {
          id: m.id,
          title: m.title,
          category: m.category?.toLowerCase() || 'football',
          date: m.date,
          isLive: m.date && m.date <= now,
          poster: m.poster ? `https://streamed.su${m.poster}` : null,
          homeTeam: m.teams?.home?.name || null,
          awayTeam: m.teams?.away?.name || null,
          homeBadge: m.teams?.home?.badge ? `https://streamed.su${m.teams.home.badge}` : null,
          awayBadge: m.teams?.away?.badge ? `https://streamed.su${m.teams.away.badge}` : null,
          sources,
          // Primary embed URL (first source)
          embedUrl: sources[0]?.embedUrl || null,
        };
      });

    // Separate live and upcoming
    const liveMatches = matches.filter((m: any) => m.isLive);
    const upcomingMatches = matches.filter((m: any) => !m.isLive).slice(0, 50);

    // Response based on endpoint
    if (endpoint === 'categories') {
      return new Response(JSON.stringify({ success: true, data: categories }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (endpoint === 'live') {
      return new Response(JSON.stringify({ success: true, data: liveMatches }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (endpoint === 'upcoming') {
      return new Response(JSON.stringify({ success: true, data: upcomingMatches }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (endpoint === 'livescores') {
      const scores = await fetchLiveScores();
      return new Response(JSON.stringify({ success: true, data: scores }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Default: return everything
    const liveScores = await fetchLiveScores();

    return new Response(JSON.stringify({
      success: true,
      timestamp: new Date().toISOString(),
      embedBaseUrl: 'https://embed.damitv.pro/{source}/{id}',
      data: {
        categories,
        liveMatches,
        upcomingMatches,
        liveScores,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('API error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
