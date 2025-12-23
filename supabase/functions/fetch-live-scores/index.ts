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

// Sports to fetch live scores for
const SPORTS = ['Soccer', 'Basketball', 'Ice_Hockey', 'American_Football'];

async function fetchLiveScoresForSport(apiKey: string, sport: string): Promise<LiveScore[]> {
  try {
    // Try the v2 livescore endpoint first (available on some API keys)
    const urls = [
      `https://www.thesportsdb.com/api/v2/json/${apiKey}/livescore.php?s=${sport}`,
      `https://www.thesportsdb.com/api/v1/json/${apiKey}/livescore.php?s=${sport}`,
    ];
    
    for (const url of urls) {
      console.log(`Trying: ${url}`);
      
      const response = await fetch(url);
      if (!response.ok) {
        console.log(`Failed for ${sport} at ${url}: ${response.status}`);
        continue;
      }
      
      const data = await response.json();
      const events = data?.events || [];
      
      if (events.length === 0) {
        continue;
      }
      
      console.log(`Found ${events.length} live events for ${sport}`);
      
      return events.map((event: any) => ({
        eventId: event.idEvent,
        homeTeam: event.strHomeTeam || '',
        awayTeam: event.strAwayTeam || '',
        homeScore: event.intHomeScore !== null ? parseInt(event.intHomeScore) : null,
        awayScore: event.intAwayScore !== null ? parseInt(event.intAwayScore) : null,
        status: event.strStatus || '',
        progress: event.strProgress || null,
        sport: sport.replace('_', ' '),
        league: event.strLeague || '',
        homeBadge: event.strHomeTeamBadge || null,
        awayBadge: event.strAwayTeamBadge || null,
      }));
    }
    
    return [];
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
      SPORTS.map(sport => fetchLiveScoresForSport(apiKey, sport))
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
