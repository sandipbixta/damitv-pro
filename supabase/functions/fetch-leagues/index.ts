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
    console.log('Fetching all sports from The Odds API');

    const apiKey = Deno.env.get('ODDS_API_KEY');
    if (!apiKey) {
      throw new Error('ODDS_API_KEY not configured');
    }
    
    // Fetch all sports from The Odds API
    const sportsUrl = `https://api.the-odds-api.com/v4/sports?apiKey=${apiKey}`;
    console.log(`Calling API: ${sportsUrl.replace(apiKey, 'API_KEY_HIDDEN')}`);
    
    const sportsResponse = await fetch(sportsUrl);
    
    // Check if response is OK
    if (!sportsResponse.ok) {
      const errorText = await sportsResponse.text();
      console.error(`API Error (${sportsResponse.status}):`, errorText);
      throw new Error(`API returned ${sportsResponse.status}: ${errorText.substring(0, 200)}`);
    }
    
    // Check content type before parsing JSON
    const contentType = sportsResponse.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const responseText = await sportsResponse.text();
      console.error('Non-JSON response:', responseText.substring(0, 500));
      throw new Error(`API returned non-JSON response (${contentType})`);
    }
    
    const sportsData = await sportsResponse.json();

    if (!sportsData || sportsData.length === 0) {
      console.log('No sports found');
      return new Response(
        JSON.stringify({ success: false, message: 'No sports found', leagues: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Transform sports into leagues format and fetch logos
    console.log('Fetching league badges from TheSportsDB...');
    const leaguesWithLogos = await Promise.all(
      sportsData
        .filter((sport: any) => sport.active)
        .map(async (sport: any) => {
          const league = {
            league_id: sport.key,
            league_name: sport.title,
            sport: sport.group.toLowerCase().replace(/\s+/g, '_'),
            country: null,
            logo_url: null,
            description: sport.description,
            website: null,
            year_founded: null,
          };

          // Try to fetch logo from TheSportsDB
          try {
            // First try searching by league name
            let searchUrl = `https://www.thesportsdb.com/api/v1/json/3/search_all_leagues.php?l=${encodeURIComponent(sport.title)}`;
            let response = await fetch(searchUrl);
            
            if (response.ok) {
              const data = await response.json();
              if (data.countries && data.countries.length > 0) {
                const matchedLeague = data.countries[0]; // Take first match
                league.logo_url = matchedLeague.strBadge || matchedLeague.strLogo || null;
                league.country = matchedLeague.strCountry || null;
              }
            }
            
            // If no logo found, try searching by sport group
            if (!league.logo_url) {
              searchUrl = `https://www.thesportsdb.com/api/v1/json/3/search_all_leagues.php?s=${encodeURIComponent(sport.group)}`;
              response = await fetch(searchUrl);
              
              if (response.ok) {
                const data = await response.json();
                if (data.countries && data.countries.length > 0) {
                  // Try to find matching league by title
                  const matchedLeague = data.countries.find((l: any) => 
                    l.strLeague?.toLowerCase().includes(sport.title.toLowerCase()) ||
                    sport.title.toLowerCase().includes(l.strLeague?.toLowerCase())
                  );
                  
                  if (matchedLeague) {
                    league.logo_url = matchedLeague.strBadge || matchedLeague.strLogo || null;
                    league.country = matchedLeague.strCountry || null;
                  }
                }
              }
            }
          } catch (error) {
            console.error(`Error fetching logo for ${sport.title}:`, error);
          }

          return league;
        })
    );

    // Upsert leagues into database
    const { data, error } = await supabase
      .from('leagues')
      .upsert(leaguesWithLogos, { onConflict: 'league_id' })
      .select();

    if (error) {
      console.error('Error upserting leagues:', error);
      throw error;
    }

    console.log(`Successfully fetched and stored ${leaguesWithLogos.length} leagues with logos`);

    return new Response(
      JSON.stringify({ 
        success: true,
        count: leaguesWithLogos.length,
        leagues: data 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in fetch-leagues function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
