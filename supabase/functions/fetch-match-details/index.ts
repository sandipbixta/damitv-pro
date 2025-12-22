import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MatchDetailsRequest {
  eventId: string;
  includeLineups?: boolean;
  includeTimeline?: boolean;
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

    const { eventId, includeLineups = true, includeTimeline = true }: MatchDetailsRequest = await req.json();

    if (!eventId) {
      throw new Error("Event ID is required");
    }

    const baseUrl = `https://www.thesportsdb.com/api/v1/json/${apiKey}`;
    
    // Fetch match details
    const eventResponse = await fetch(`${baseUrl}/lookupevent.php?id=${eventId}`);
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
        const lineupsResponse = await fetch(`${baseUrl}/lookuplineup.php?id=${eventId}`);
        if (lineupsResponse.ok) {
          const lineupsData = await lineupsResponse.json();
          lineups = lineupsData?.lineup || [];
        }
      } catch (e) {
        console.log("Failed to fetch lineups:", e);
      }
    }

    // Fetch timeline/events if requested
    if (includeTimeline && event) {
      try {
        const timelineResponse = await fetch(`${baseUrl}/lookupeventtimeline.php?id=${eventId}`);
        if (timelineResponse.ok) {
          const timelineData = await timelineResponse.json();
          timeline = timelineData?.timeline || [];
        }
      } catch (e) {
        console.log("Failed to fetch timeline:", e);
      }
    }

    // Parse and structure the response
    const matchDetails = event ? {
      id: event.idEvent,
      homeTeam: event.strHomeTeam,
      awayTeam: event.strAwayTeam,
      homeScore: event.intHomeScore !== null ? parseInt(event.intHomeScore) : null,
      awayScore: event.intAwayScore !== null ? parseInt(event.intAwayScore) : null,
      status: event.strStatus || event.strProgress || 'Scheduled',
      progress: event.strProgress || null,
      isLive: event.strStatus === 'In Play' || event.strProgress?.includes("'"),
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

    return new Response(
      JSON.stringify({
        success: true,
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
