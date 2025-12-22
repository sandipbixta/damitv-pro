import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sportKey } = await req.json();
    
    console.log(`Fetching teams for sport: ${sportKey}`);

    const apiKey = Deno.env.get('ODDS_API_KEY');
    if (!apiKey) {
      throw new Error('ODDS_API_KEY not configured');
    }
    
    // Fetch events (matches) from The Odds API to extract team names
    const eventsUrl = `https://api.the-odds-api.com/v4/sports/${sportKey}/odds?apiKey=${apiKey}&regions=us`;
    console.log(`Calling API: ${eventsUrl.replace(apiKey, 'API_KEY_HIDDEN')}`);
    
    const eventsResponse = await fetch(eventsUrl);
    
    // Check if response is OK
    if (!eventsResponse.ok) {
      const errorText = await eventsResponse.text();
      console.error(`API Error (${eventsResponse.status}):`, errorText);
      throw new Error(`API returned ${eventsResponse.status}: ${errorText.substring(0, 200)}`);
    }
    
    // Check content type before parsing JSON
    const contentType = eventsResponse.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const responseText = await eventsResponse.text();
      console.error('Non-JSON response:', responseText.substring(0, 500));
      throw new Error(`API returned non-JSON response (${contentType})`);
    }
    
    const eventsData = await eventsResponse.json();

    // Check if API returned an error object
    if (eventsData.error) {
      console.error('API error:', eventsData.error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: `API Error: ${eventsData.error}`,
          teams: [] 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!eventsData || !Array.isArray(eventsData) || eventsData.length === 0) {
      console.log(`No events found for sport: ${sportKey}`);
      return new Response(
        JSON.stringify({ success: false, message: 'No events found for this sport', teams: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Extract unique teams from events
    const teamsMap = new Map();
    
    eventsData.forEach((event: any) => {
      // Add home team
      if (!teamsMap.has(event.home_team)) {
        teamsMap.set(event.home_team, {
          team_id: `${sportKey}_${event.home_team.toLowerCase().replace(/\s+/g, '_')}`,
          team_name: event.home_team,
          league_name: sportKey,
          sport: event.sport_key,
          logo_url: null,
          stadium: null,
          description: null,
          year_founded: null,
          country: null,
          website: null,
        });
      }
      
      // Add away team
      if (!teamsMap.has(event.away_team)) {
        teamsMap.set(event.away_team, {
          team_id: `${sportKey}_${event.away_team.toLowerCase().replace(/\s+/g, '_')}`,
          team_name: event.away_team,
          league_name: sportKey,
          sport: event.sport_key,
          logo_url: null,
          stadium: null,
          description: null,
          year_founded: null,
          country: null,
          website: null,
        });
      }
    });

    const teams = Array.from(teamsMap.values());

    // Fetch logos from TheSportsDB for each team
    console.log('Fetching logos from TheSportsDB...');
    const teamsWithLogos = await Promise.all(
      teams.map(async (team) => {
        try {
          const logoUrl = `https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(team.team_name)}`;
          const logoResponse = await fetch(logoUrl);
          
          if (logoResponse.ok) {
            const logoData = await logoResponse.json();
            if (logoData.teams && logoData.teams.length > 0) {
              const teamData = logoData.teams[0];
              return {
                ...team,
                logo_url: teamData.strBadge || teamData.strLogo || null,
                stadium: teamData.strStadium || team.stadium,
                country: teamData.strCountry || team.country,
                year_founded: teamData.intFormedYear || team.year_founded,
                description: teamData.strDescriptionEN || team.description
              };
            }
          }
        } catch (error) {
          console.error(`Error fetching logo for ${team.team_name}:`, error);
        }
        return team;
      })
    );

    // Upsert teams into database
    const { data, error } = await supabase
      .from('league_teams')
      .upsert(teamsWithLogos, { onConflict: 'team_id' })
      .select();

    if (error) {
      console.error('Error upserting teams:', error);
      throw error;
    }

    console.log(`Successfully fetched and stored ${teams.length} teams with logos`);

    return new Response(
      JSON.stringify({ 
        success: true,
        count: teams.length,
        teams: data 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in fetch-league-teams function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
