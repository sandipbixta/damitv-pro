import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('THESPORTSDB_API_KEY') || '3';
    const baseUrl = `https://www.thesportsdb.com/api/v1/json/${apiKey}`;

    // Fetch latest events that have video highlights
    // We'll use eventslast.php for popular leagues to get recent matches with highlights
    const popularLeagues = [
      '4328', // Premier League
      '4331', // Bundesliga
      '4332', // Serie A
      '4335', // La Liga
      '4334', // Ligue 1
      '4480', // Champions League
    ];

    const highlightsPromises = popularLeagues.map(async (leagueId) => {
      try {
        const response = await fetch(`${baseUrl}/eventspastleague.php?id=${leagueId}`);
        if (!response.ok) return [];
        const data = await response.json();
        return data.events || [];
      } catch (e) {
        console.log(`Failed to fetch events for league ${leagueId}:`, e);
        return [];
      }
    });

    const allEventsArrays = await Promise.all(highlightsPromises);
    const allEvents = allEventsArrays.flat();

    // Filter events that have video highlights (strVideo is not null)
    const eventsWithHighlights = allEvents
      .filter((event: any) => event.strVideo && event.strVideo.trim() !== '')
      .map((event: any) => ({
        id: event.idEvent,
        homeTeam: event.strHomeTeam,
        awayTeam: event.strAwayTeam,
        homeScore: event.intHomeScore,
        awayScore: event.intAwayScore,
        date: event.dateEvent,
        league: event.strLeague,
        leagueBadge: event.strLeagueBadge,
        homeTeamBadge: event.strHomeTeamBadge,
        awayTeamBadge: event.strAwayTeamBadge,
        thumbnail: event.strThumb || event.strPoster,
        video: event.strVideo,
        venue: event.strVenue,
      }))
      // Sort by date descending (most recent first)
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
      // Limit to 12 highlights
      .slice(0, 12);

    console.log(`Found ${eventsWithHighlights.length} highlights from ${allEvents.length} total events`);

    return new Response(
      JSON.stringify({
        success: true,
        highlights: eventsWithHighlights,
        count: eventsWithHighlights.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error fetching highlights:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        highlights: [],
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
