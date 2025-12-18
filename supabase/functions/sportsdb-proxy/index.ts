import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SPORTSDB_API_V1 = 'https://www.thesportsdb.com/api/v1/json/751945';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, teamName, playerName, eventName, leagueId, date } = await req.json();
    
    console.log(`[SportsDB Proxy] Action: ${action}, Param: ${teamName || playerName || eventName || leagueId || date}`);

    let url = '';
    
    switch (action) {
      case 'searchTeam':
        if (!teamName) {
          return new Response(
            JSON.stringify({ error: 'teamName is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        url = `${SPORTSDB_API_V1}/searchteams.php?t=${encodeURIComponent(teamName)}`;
        break;
        
      case 'searchPlayer':
        if (!playerName) {
          return new Response(
            JSON.stringify({ error: 'playerName is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        url = `${SPORTSDB_API_V1}/searchplayers.php?p=${encodeURIComponent(playerName)}`;
        break;
        
      case 'searchEvent':
        if (!eventName) {
          return new Response(
            JSON.stringify({ error: 'eventName is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        url = `${SPORTSDB_API_V1}/searchevents.php?e=${encodeURIComponent(eventName)}`;
        break;
        
      case 'lookupLeague':
        if (!leagueId) {
          return new Response(
            JSON.stringify({ error: 'leagueId is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        url = `${SPORTSDB_API_V1}/lookupleague.php?id=${leagueId}`;
        break;
        
      case 'getHighlights':
        const highlightDate = date || new Date().toISOString().split('T')[0];
        url = `${SPORTSDB_API_V1}/eventshighlights.php?d=${highlightDate}`;
        break;
        
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action. Use: searchTeam, searchPlayer, searchEvent, lookupLeague, getHighlights' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    console.log(`[SportsDB Proxy] Fetching: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'DamiTV/1.0',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`[SportsDB Proxy] API error: ${response.status}`);
      return new Response(
        JSON.stringify({ error: `API returned ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log(`[SportsDB Proxy] Success for action: ${action}`);

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[SportsDB Proxy] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
