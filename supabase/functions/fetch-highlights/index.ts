import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Sports categories with their TheSportsDB league IDs
const SPORTS_LEAGUES = {
  'Football': [
    '4328', // Premier League
    '4331', // Bundesliga
    '4332', // Serie A
    '4335', // La Liga
    '4334', // Ligue 1
    '4480', // Champions League
  ],
  'Basketball': [
    '4387', // NBA
    '4424', // EuroLeague
  ],
  'American Football': [
    '4391', // NFL
  ],
  'Ice Hockey': [
    '4380', // NHL
  ],
  'Baseball': [
    '4424', // MLB
  ],
  'Tennis': [
    '4464', // ATP Tour
  ],
  'Motorsport': [
    '4370', // Formula 1
  ],
  'Rugby': [
    '4401', // Super Rugby
  ],
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('THESPORTSDB_API_KEY') || '3';
    const baseUrl = `https://www.thesportsdb.com/api/v1/json/${apiKey}`;

    const allHighlights: any[] = [];

    // Fetch highlights from all sports leagues in parallel
    const fetchPromises: Promise<any[]>[] = [];

    for (const [sport, leagueIds] of Object.entries(SPORTS_LEAGUES)) {
      for (const leagueId of leagueIds) {
        fetchPromises.push(
          (async () => {
            try {
              const response = await fetch(`${baseUrl}/eventspastleague.php?id=${leagueId}`);
              if (!response.ok) return [];
              const data = await response.json();
              const events = data.events || [];
              
              // Add sport category to each event
              return events.map((event: any) => ({
                ...event,
                sportCategory: sport,
              }));
            } catch (e) {
              console.log(`Failed to fetch events for league ${leagueId}:`, e);
              return [];
            }
          })()
        );
      }
    }

    const allEventsArrays = await Promise.all(fetchPromises);
    const allEvents = allEventsArrays.flat();

    // Filter events that have video highlights (strVideo is not null)
    const eventsWithHighlights = allEvents
      .filter((event: any) => event.strVideo && event.strVideo.trim() !== '')
      .map((event: any) => {
        // Convert YouTube URL to embed format
        let videoUrl = event.strVideo;
        let embedUrl = '';
        
        if (videoUrl.includes('youtube.com/watch')) {
          const videoId = videoUrl.split('v=')[1]?.split('&')[0];
          if (videoId) {
            embedUrl = `https://www.youtube.com/embed/${videoId}`;
          }
        } else if (videoUrl.includes('youtu.be/')) {
          const videoId = videoUrl.split('youtu.be/')[1]?.split('?')[0];
          if (videoId) {
            embedUrl = `https://www.youtube.com/embed/${videoId}`;
          }
        }

        return {
          id: event.idEvent,
          homeTeam: event.strHomeTeam,
          awayTeam: event.strAwayTeam,
          homeScore: event.intHomeScore,
          awayScore: event.intAwayScore,
          date: event.dateEvent,
          league: event.strLeague,
          sport: event.sportCategory || event.strSport,
          leagueBadge: event.strLeagueBadge,
          homeTeamBadge: event.strHomeTeamBadge,
          awayTeamBadge: event.strAwayTeamBadge,
          thumbnail: event.strThumb || event.strPoster,
          video: videoUrl,
          embedUrl: embedUrl || videoUrl,
          venue: event.strVenue,
        };
      })
      // Sort by date descending (most recent first)
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
      // Limit to 24 highlights
      .slice(0, 24);

    // Get unique sports for filtering
    const sports = [...new Set(eventsWithHighlights.map((h: any) => h.sport))].filter(Boolean);

    console.log(`Found ${eventsWithHighlights.length} highlights from ${allEvents.length} total events across ${sports.length} sports`);

    return new Response(
      JSON.stringify({
        success: true,
        highlights: eventsWithHighlights,
        sports: sports,
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
        sports: [],
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
