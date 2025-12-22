import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MatchData {
  matchId: string;
  matchTitle: string;
  homeTeam: string;
  awayTeam: string;
  competition?: string;
  sport?: string;
  streamUrl: string;
  kickoffTime?: string;
  message?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📨 Social webhook triggered - forwarding to Make.com');
    
    const MAKE_WEBHOOK_URL = Deno.env.get('MAKE_WEBHOOK_URL');
    
    if (!MAKE_WEBHOOK_URL) {
      console.error('❌ MAKE_WEBHOOK_URL not configured');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Make.com webhook URL not configured' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const matchData: MatchData = await req.json();
    
    console.log('Received match data:', JSON.stringify(matchData, null, 2));

    // Validate required fields
    if (!matchData.matchId || !matchData.matchTitle) {
      console.error('❌ Missing required fields');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'matchId and matchTitle are required' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Prepare payload for Make.com
    const makePayload = {
      matchId: matchData.matchId,
      matchTitle: matchData.matchTitle,
      homeTeam: matchData.homeTeam || '',
      awayTeam: matchData.awayTeam || '',
      competition: matchData.competition || '',
      sport: matchData.sport || 'Football',
      streamUrl: matchData.streamUrl || `https://damitv.netlify.app/match/${matchData.matchId}`,
      kickoffTime: matchData.kickoffTime || new Date().toISOString(),
      message: matchData.message || `🔴 LIVE NOW: ${matchData.matchTitle}\n\n📺 Watch free: ${matchData.streamUrl || `https://damitv.netlify.app/match/${matchData.matchId}`}\n\n#DamiTV #LiveSports #FreeStreaming`,
      timestamp: new Date().toISOString(),
      isLive: true
    };

    console.log('📤 Sending to Make.com:', JSON.stringify(makePayload, null, 2));

    // Forward to Make.com webhook
    const makeResponse = await fetch(MAKE_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(makePayload),
    });

    const makeResponseText = await makeResponse.text();
    console.log('📥 Make.com response:', makeResponse.status, makeResponseText);

    if (!makeResponse.ok) {
      console.error('❌ Make.com webhook failed:', makeResponse.status);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Make.com webhook failed: ${makeResponse.status}`,
          details: makeResponseText
        }),
        { 
          status: 502, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('✅ Successfully forwarded to Make.com');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Match data sent to Make.com for social posting',
        matchId: matchData.matchId,
        matchTitle: matchData.matchTitle
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Webhook error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
