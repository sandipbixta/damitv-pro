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
const SPORTS_V2 = ['soccer', 'basketball', 'icehockey', 'american_football'];

async function fetchLiveScoresForSport(apiKey: string, sport: string): Promise<LiveScore[]> {
  try {
    // V2 API format for premium keys: /api/v2/json/livescore/{sport}
    const url = `https://www.thesportsdb.com/api/v2/json/livescore/${sport}`;
    
    console.log(`Fetching live scores from: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'X-API-KEY': apiKey,
      },
    });
    
    if (!response.ok) {
      console.log(`Failed for ${sport}: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    const events = data?.events || data?.livescore || [];
    
    if (!events || events.length === 0) {
      console.log(`No live events for ${sport}`);
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
    console.error(`Error fetching live scores for ${sport}:`, e);
    return [];
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("THESPORTSDB_API_KEY");
    if (!apiKey) {
      throw new Error("TheSportsDB API key not configured");
    }

    // Fetch live scores for all sports in parallel
    const results = await Promise.all(
      SPORTS_V2.map(sport => fetchLiveScoresForSport(apiKey, sport))
    );

    // Flatten and combine all results
    const allLiveScores = results.flat();
    
    console.log(`Found ${allLiveScores.length} total live matches across all sports`);

    return new Response(
      JSON.stringify({
        success: true,
        liveScores: allLiveScores,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error fetching live scores:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        liveScores: [],
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
