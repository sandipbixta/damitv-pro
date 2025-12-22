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
    console.log('Starting scheduled team stats update...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const apiKey = Deno.env.get('ODDS_API_KEY');
    if (!apiKey) {
      throw new Error('ODDS_API_KEY not configured');
    }

    // Get all unique team names from existing stats
    const { data: existingTeams, error: fetchError } = await supabase
      .from('team_stats')
      .select('team_name, sport');

    if (fetchError) {
      console.error('Error fetching teams:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${existingTeams?.length || 0} teams to update`);

    let updatedCount = 0;
    let failedCount = 0;

    // Update each team's stats
    for (const team of existingTeams || []) {
      try {
        console.log(`Updating stats for ${team.team_name} (${team.sport})`);
        
        // Fetch sports to find the right sport key
        const sportsUrl = `https://api.the-odds-api.com/v4/sports?apiKey=${apiKey}`;
        const sportsResponse = await fetch(sportsUrl);
        const sportsData = await sportsResponse.json();

        const matchingSport = sportsData.find((s: any) => 
          s.group.toLowerCase() === team.sport.toLowerCase()
        );

        if (matchingSport) {
          // Fetch recent scores for this sport
          const scoresUrl = `https://api.the-odds-api.com/v4/sports/${matchingSport.key}/scores?apiKey=${apiKey}&daysFrom=30`;
          const scoresResponse = await fetch(scoresUrl);
          const scoresData = await scoresResponse.json();

          // Filter events for this team
          const teamEvents = scoresData.filter((event: any) => 
            event.home_team === team.team_name || event.away_team === team.team_name
          );

          // Calculate stats
          let wins = 0, draws = 0, losses = 0;
          let goalsScored = 0, goalsConceded = 0;

          teamEvents.forEach((event: any) => {
            if (event.scores) {
              const isHome = event.home_team === team.team_name;
              const teamScore = isHome ? event.scores[0]?.score : event.scores[1]?.score;
              const opponentScore = isHome ? event.scores[1]?.score : event.scores[0]?.score;

              if (teamScore !== undefined && opponentScore !== undefined) {
                goalsScored += teamScore;
                goalsConceded += opponentScore;
                if (teamScore > opponentScore) wins++;
                else if (teamScore < opponentScore) losses++;
                else draws++;
              }
            }
          });

          // Update team stats
          const { error: updateError } = await supabase
            .from('team_stats')
            .update({
              matches_played: teamEvents.length,
              wins,
              draws,
              losses,
              goals_scored: goalsScored,
              goals_conceded: goalsConceded,
              win_rate: teamEvents.length > 0 ? (wins / teamEvents.length) * 100 : 0,
              average_goals: teamEvents.length > 0 ? goalsScored / teamEvents.length : 0,
              total_points: (wins * 3) + draws,
              updated_at: new Date().toISOString(),
            })
            .eq('team_name', team.team_name)
            .eq('sport', team.sport);

          if (updateError) {
            console.error(`Failed to update ${team.team_name}:`, updateError);
            failedCount++;
          } else {
            updatedCount++;
          }
        }

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`Error updating ${team.team_name}:`, error);
        failedCount++;
      }
    }

    console.log(`Update complete: ${updatedCount} successful, ${failedCount} failed`);

    return new Response(
      JSON.stringify({ 
        success: true,
        updated: updatedCount,
        failed: failedCount,
        total: existingTeams?.length || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in scheduled stats update:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});