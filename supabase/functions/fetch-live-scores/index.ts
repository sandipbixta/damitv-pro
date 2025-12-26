import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LiveScore {
  eventId: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  progress: string | null;
  sport: string;
  league: string;
  homeBadge: string | null;
  awayBadge: string | null;
}

// Sports to fetch live scores for (v2 API uses lowercase)
const SPORTS_V2 = ['soccer', 'basketball', 'icehockey', 'american_football', 'tennis', 'rugby', 'cricket'];

// Simple in-memory cache
let cachedScores: LiveScore[] = [];
let cacheTimestamp = 0;
const CACHE_TTL = 30000; // 30 seconds cache

async function fetchLiveScoresForSport(apiKey: string, sport: string): Promise<LiveScore[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout per sport

    const url = `https://www.thesportsdb.com/api/v2/json/livescore/${sport}`;
    
    const response = await fetch(url, {
      headers: { 'X-API-KEY': apiKey },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.log(`Failed for ${sport}: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    const events = data?.events || data?.livescore || [];
    
    if (!events || events.length === 0) {
      return [];
    }
    
    console.log(`Found ${events.length} live events for ${sport}`);
    
    return events.map((event: any) => ({
      eventId: event.idEvent || event.idLiveScore,
      homeTeam: event.strHomeTeam || '',
      awayTeam: event.strAwayTeam || '',
      homeScore: event.intHomeScore !== null ? parseInt(event.intHomeScore) : null,
      awayScore: event.intAwayScore !== null ? parseInt(event.intAwayScore) : null,
      status: event.strStatus || event.strProgress || 'Live',
      progress: event.strProgress || event.strStatus || null,
      sport: sport.replace('_', ' '),
      league: event.strLeague || '',
      homeBadge: event.strHomeTeamBadge || null,
      awayBadge: event.strAwayTeamBadge || null,
    }));
  } catch (e) {
    if (e.name === 'AbortError') {
      console.log(`Timeout for ${sport}`);
    } else {
      console.error(`Error fetching ${sport}:`, e);
    }
    return [];
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Return cached data if still valid
    const now = Date.now();
    if (cachedScores.length > 0 && (now - cacheTimestamp) < CACHE_TTL) {
      console.log(`Returning ${cachedScores.length} cached scores`);
      return new Response(
        JSON.stringify({
          success: true,
          liveScores: cachedScores,
          cached: true,
          timestamp: new Date().toISOString(),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("THESPORTSDB_API_KEY");
    if (!apiKey) {
      throw new Error("TheSportsDB API key not configured");
    }

    // Fetch all sports in parallel with individual timeouts
    const results = await Promise.all(
      SPORTS_V2.map(sport => fetchLiveScoresForSport(apiKey, sport))
    );

    const allLiveScores = results.flat();
    
    // Update cache
    cachedScores = allLiveScores;
    cacheTimestamp = now;
    
    console.log(`Found ${allLiveScores.length} total live matches`);

    return new Response(
      JSON.stringify({
        success: true,
        liveScores: allLiveScores,
        cached: false,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    // Return cached data on error if available
    if (cachedScores.length > 0) {
      return new Response(
        JSON.stringify({
          success: true,
          liveScores: cachedScores,
          cached: true,
          fallback: true,
          timestamp: new Date().toISOString(),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    return new Response(
      JSON.stringify({ success: false, error: error.message, liveScores: [] }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
