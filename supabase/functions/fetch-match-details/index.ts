import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MatchDetailsRequest {
  eventId?: string;
  searchTeams?: {
    homeTeam: string;
    awayTeam: string;
  };
  includeLineups?: boolean;
  includeTimeline?: boolean;
}

// Map sport/league to TheSportsDB sport names for live scores
function getSportsDBSport(league: string | null): string {
  if (!league) return 'Soccer';
  
  const sportMap: Record<string, string> = {
    'nfl': 'American_Football',
    'nba': 'Basketball',
    'nhl': 'Ice_Hockey',
    'mlb': 'Baseball',
    'premier league': 'Soccer',
    'la liga': 'Soccer',
    'serie a': 'Soccer',
    'bundesliga': 'Soccer',
    'ligue 1': 'Soccer',
    'champions league': 'Soccer',
    'uefa': 'Soccer',
    'mls': 'Soccer',
  };
  
  const lowerLeague = league.toLowerCase();
  for (const [key, value] of Object.entries(sportMap)) {
    if (lowerLeague.includes(key)) {
      return value;
    }
  }
  return 'Soccer';
}

// Fetch live score for a match from the livescore endpoint
async function fetchLiveScore(
  apiKey: string,
  homeTeam: string,
  awayTeam: string,
  sport: string
): Promise<{ homeScore: number | null; awayScore: number | null; progress: string | null; isLive: boolean } | null> {
  try {
    const url = `https://www.thesportsdb.com/api/v1/json/${apiKey}/livescore.php?s=${sport}`;
    console.log(`Fetching live scores for sport: ${sport}`);
    
    const response = await fetch(url);
    if (!response.ok) {
      console.log(`Live score fetch failed: ${response.statusText}`);
      return null;
    }
    
    const data = await response.json();
    const events = data?.events || [];
    
    if (events.length === 0) {
      console.log('No live events found');
      return null;
    }
    
    // Find matching event by team names
    const normalizeTeam = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const homeNorm = normalizeTeam(homeTeam);
    const awayNorm = normalizeTeam(awayTeam);
    
    for (const event of events) {
      const eventHomeNorm = normalizeTeam(event.strHomeTeam || '');
      const eventAwayNorm = normalizeTeam(event.strAwayTeam || '');
      
      const homeMatch = eventHomeNorm.includes(homeNorm) || homeNorm.includes(eventHomeNorm);
      const awayMatch = eventAwayNorm.includes(awayNorm) || awayNorm.includes(eventAwayNorm);
      
      if (homeMatch && awayMatch) {
        console.log(`Found live match: ${event.strHomeTeam} vs ${event.strAwayTeam} - Score: ${event.intHomeScore}-${event.intAwayScore}`);
        return {
          homeScore: event.intHomeScore !== null ? parseInt(event.intHomeScore) : null,
          awayScore: event.intAwayScore !== null ? parseInt(event.intAwayScore) : null,
          progress: event.strProgress || event.strStatus || null,
          isLive: true,
        };
      }
    }
    
    console.log(`No matching live event found for ${homeTeam} vs ${awayTeam}`);
    return null;
  } catch (e) {
    console.log('Error fetching live score:', e);
    return null;
  }
}

// Search for an event by team names
async function searchEventByTeams(
  apiKey: string,
  homeTeam: string,
  awayTeam: string
): Promise<string | null> {
  const baseUrl = `https://www.thesportsdb.com/api/v1/json/${apiKey}`;
  
  // Try searching with home team name
  const searchTerms = [
    `${homeTeam} vs ${awayTeam}`,
    homeTeam,
    awayTeam,
  ];

  for (const term of searchTerms) {
    try {
      const encodedTerm = encodeURIComponent(term);
      const searchUrl = `${baseUrl}/searchevents.php?e=${encodedTerm}`;
      console.log(`Searching events with term: ${term}`);
      
      const response = await fetch(searchUrl);
      if (!response.ok) continue;
      
      const data = await response.json();
      const events = data?.event || [];
      
      if (events.length === 0) continue;
      
      // Try to find a matching event (recent/upcoming)
      const now = new Date();
      const matchingEvents = events.filter((e: any) => {
        const homeMatch = 
          e.strHomeTeam?.toLowerCase().includes(homeTeam.toLowerCase()) ||
          homeTeam.toLowerCase().includes(e.strHomeTeam?.toLowerCase() || '');
        const awayMatch = 
          e.strAwayTeam?.toLowerCase().includes(awayTeam.toLowerCase()) ||
          awayTeam.toLowerCase().includes(e.strAwayTeam?.toLowerCase() || '');
        
        // Check if event is recent (within last 7 days) or upcoming (within next 7 days)
        if (e.dateEvent) {
          const eventDate = new Date(e.dateEvent);
          const daysDiff = Math.abs((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          return (homeMatch && awayMatch) || daysDiff <= 7;
        }
        
        return homeMatch && awayMatch;
      });

      // Sort by date (most recent first)
      matchingEvents.sort((a: any, b: any) => {
        const dateA = new Date(a.dateEvent || 0);
        const dateB = new Date(b.dateEvent || 0);
        return dateB.getTime() - dateA.getTime();
      });

      if (matchingEvents.length > 0) {
        console.log(`Found matching event: ${matchingEvents[0].idEvent} - ${matchingEvents[0].strEvent}`);
        return matchingEvents[0].idEvent;
      }
    } catch (e) {
      console.log(`Search failed for term "${term}":`, e);
    }
  }

  // Try alternative: search by team directly using searchteams endpoint then find events
  try {
    const teamSearchUrl = `${baseUrl}/searchteams.php?t=${encodeURIComponent(homeTeam)}`;
    const teamResponse = await fetch(teamSearchUrl);
    if (teamResponse.ok) {
      const teamData = await teamResponse.json();
      const team = teamData?.teams?.[0];
      if (team?.idTeam) {
        // Get last 5 events for this team
        const eventsUrl = `${baseUrl}/eventslast.php?id=${team.idTeam}`;
        const eventsResponse = await fetch(eventsUrl);
        if (eventsResponse.ok) {
          const eventsData = await eventsResponse.json();
          const events = eventsData?.results || [];
          
          for (const event of events) {
            const awayMatch = 
              event.strAwayTeam?.toLowerCase().includes(awayTeam.toLowerCase()) ||
              awayTeam.toLowerCase().includes(event.strAwayTeam?.toLowerCase() || '');
            const homeMatch = 
              event.strHomeTeam?.toLowerCase().includes(homeTeam.toLowerCase()) ||
              homeTeam.toLowerCase().includes(event.strHomeTeam?.toLowerCase() || '');
            
            if (homeMatch && awayMatch) {
              console.log(`Found event from team history: ${event.idEvent}`);
              return event.idEvent;
            }
          }
        }
        
        // Also check next events
        const nextEventsUrl = `${baseUrl}/eventsnext.php?id=${team.idTeam}`;
        const nextEventsResponse = await fetch(nextEventsUrl);
        if (nextEventsResponse.ok) {
          const nextEventsData = await nextEventsResponse.json();
          const nextEvents = nextEventsData?.events || [];
          
          for (const event of nextEvents) {
            const awayMatch = 
              event.strAwayTeam?.toLowerCase().includes(awayTeam.toLowerCase()) ||
              awayTeam.toLowerCase().includes(event.strAwayTeam?.toLowerCase() || '');
            const homeMatch = 
              event.strHomeTeam?.toLowerCase().includes(homeTeam.toLowerCase()) ||
              homeTeam.toLowerCase().includes(event.strHomeTeam?.toLowerCase() || '');
            
            if (homeMatch && awayMatch) {
              console.log(`Found event from upcoming events: ${event.idEvent}`);
              return event.idEvent;
            }
          }
        }
      }
    }
  } catch (e) {
    console.log("Team-based search failed:", e);
  }

  return null;
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

    const { eventId, searchTeams, includeLineups = true, includeTimeline = true }: MatchDetailsRequest = await req.json();

    let finalEventId = eventId;

    // If no eventId provided, try to search by team names
    if (!finalEventId && searchTeams) {
      console.log(`Searching for event: ${searchTeams.homeTeam} vs ${searchTeams.awayTeam}`);
      finalEventId = await searchEventByTeams(apiKey, searchTeams.homeTeam, searchTeams.awayTeam);
      
      if (!finalEventId) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Could not find matching event for these teams",
            searchedTeams: searchTeams,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    if (!finalEventId) {
      throw new Error("Event ID is required or provide team names to search");
    }

    const baseUrl = `https://www.thesportsdb.com/api/v1/json/${apiKey}`;
    
    // Fetch match details
    console.log(`Fetching event details for ID: ${finalEventId}`);
    const eventResponse = await fetch(`${baseUrl}/lookupevent.php?id=${finalEventId}`);
    if (!eventResponse.ok) {
      throw new Error(`Failed to fetch event: ${eventResponse.statusText}`);
    }
    const eventData = await eventResponse.json();
    const event = eventData?.events?.[0] || null;

    let lineups = null;
    let timeline = null;

    // Fetch lineups if requested
    if (includeLineups && event) {
      try {
        console.log(`Fetching lineups for event: ${finalEventId}`);
        const lineupsResponse = await fetch(`${baseUrl}/lookuplineup.php?id=${finalEventId}`);
        if (lineupsResponse.ok) {
          const lineupsData = await lineupsResponse.json();
          lineups = lineupsData?.lineup || [];
          console.log(`Found ${lineups.length} players in lineups`);
        }
      } catch (e) {
        console.log("Failed to fetch lineups:", e);
      }
    }

    // Fetch timeline/events if requested
    if (includeTimeline && event) {
      try {
        console.log(`Fetching timeline for event: ${finalEventId}`);
        const timelineResponse = await fetch(`${baseUrl}/lookupeventtimeline.php?id=${finalEventId}`);
        if (timelineResponse.ok) {
          const timelineData = await timelineResponse.json();
          timeline = timelineData?.timeline || [];
          console.log(`Found ${timeline.length} timeline events`);
        }
      } catch (e) {
        console.log("Failed to fetch timeline:", e);
      }
    }

    // Try to fetch live score if the match might be in progress
    let liveScore: { homeScore: number | null; awayScore: number | null; progress: string | null; isLive: boolean } | null = null;
    if (event) {
      const sport = getSportsDBSport(event.strLeague);
      liveScore = await fetchLiveScore(apiKey, event.strHomeTeam, event.strAwayTeam, sport);
      
      // Also try alternative sports if no result
      if (!liveScore) {
        const altSports = ['American_Football', 'Basketball', 'Ice_Hockey', 'Soccer'];
        for (const altSport of altSports) {
          if (altSport !== sport) {
            liveScore = await fetchLiveScore(apiKey, event.strHomeTeam, event.strAwayTeam, altSport);
            if (liveScore) break;
          }
        }
      }
    }

    // Parse and structure the response - merge live score data if available
    const matchDetails = event ? {
      id: event.idEvent,
      homeTeam: event.strHomeTeam,
      awayTeam: event.strAwayTeam,
      homeScore: liveScore?.homeScore ?? (event.intHomeScore !== null ? parseInt(event.intHomeScore) : null),
      awayScore: liveScore?.awayScore ?? (event.intAwayScore !== null ? parseInt(event.intAwayScore) : null),
      status: liveScore?.isLive ? 'In Play' : (event.strStatus || event.strProgress || 'Scheduled'),
      progress: liveScore?.progress || event.strProgress || null,
      isLive: liveScore?.isLive || event.strStatus === 'In Play' || event.strProgress?.includes("'"),
      venue: event.strVenue,
      date: event.dateEvent,
      time: event.strTime,
      league: event.strLeague,
      season: event.strSeason,
      round: event.intRound,
      homeTeamBadge: event.strHomeTeamBadge,
      awayTeamBadge: event.strAwayTeamBadge,
      homeFormation: event.strHomeFormation,
      awayFormation: event.strAwayFormation,
      homeGoalDetails: event.strHomeGoalDetails,
      awayGoalDetails: event.strAwayGoalDetails,
      homeRedCards: event.strHomeRedCards,
      awayRedCards: event.strAwayRedCards,
      homeYellowCards: event.strHomeYellowCards,
      awayYellowCards: event.strAwayYellowCards,
      thumbnail: event.strThumb,
      video: event.strVideo,
    } : null;

    // Structure lineups by team
    const structuredLineups = lineups ? {
      home: lineups.filter((p: any) => p.strHome === 'Yes').map((p: any) => ({
        name: p.strPlayer,
        position: p.strPosition,
        positionShort: p.strPositionShort,
        number: p.intSquadNumber,
        isSub: p.strSub === 'Yes',
        formation: p.strFormation,
      })),
      away: lineups.filter((p: any) => p.strHome === 'No').map((p: any) => ({
        name: p.strPlayer,
        position: p.strPosition,
        positionShort: p.strPositionShort,
        number: p.intSquadNumber,
        isSub: p.strSub === 'Yes',
        formation: p.strFormation,
      })),
    } : null;

    // Structure timeline events
    const structuredTimeline = timeline ? timeline.map((e: any) => ({
      id: e.idTimeline,
      time: e.intTime,
      type: e.strTimeline,
      player: e.strPlayer,
      team: e.strTeam,
      isHome: e.strHome === 'Yes',
      assist: e.strAssist,
      comment: e.strComment,
    })).sort((a: any, b: any) => parseInt(a.time) - parseInt(b.time)) : null;

    console.log(`Successfully fetched match details for event ${finalEventId}`);

    return new Response(
      JSON.stringify({
        success: true,
        eventId: finalEventId,
        match: matchDetails,
        lineups: structuredLineups,
        timeline: structuredTimeline,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error fetching match details:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
