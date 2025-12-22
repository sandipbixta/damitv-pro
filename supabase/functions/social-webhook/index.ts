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
  poster?: string;
}

// Fetch event image from TheSportsDB
async function fetchSportsDBEventImage(homeTeam: string, awayTeam: string): Promise<string | null> {
  const apiKey = Deno.env.get('THESPORTSDB_API_KEY');
  if (!apiKey) {
    console.log('⚠️ TheSportsDB API key not configured');
    return null;
  }

  const baseUrl = `https://www.thesportsdb.com/api/v1/json/${apiKey}`;

  try {
    // First try to search for the event directly
    const searchTerms = [
      `${homeTeam} vs ${awayTeam}`,
      homeTeam,
      awayTeam,
    ];

    for (const term of searchTerms) {
      try {
        const encodedTerm = encodeURIComponent(term);
        const searchUrl = `${baseUrl}/searchevents.php?e=${encodedTerm}`;
        console.log(`🔍 Searching for event image: ${term}`);

        const response = await fetch(searchUrl);
        if (!response.ok) continue;

        const data = await response.json();
        const events = data?.event || [];

        if (events.length === 0) continue;

        // Find matching event with image
        const matchingEvent = events.find((e: any) => {
          const homeMatch = 
            e.strHomeTeam?.toLowerCase().includes(homeTeam.toLowerCase()) ||
            homeTeam.toLowerCase().includes(e.strHomeTeam?.toLowerCase() || '');
          const awayMatch = 
            e.strAwayTeam?.toLowerCase().includes(awayTeam.toLowerCase()) ||
            awayTeam.toLowerCase().includes(e.strAwayTeam?.toLowerCase() || '');
          return (homeMatch && awayMatch) && (e.strThumb || e.strPoster || e.strBanner);
        });

        if (matchingEvent) {
          const imageUrl = matchingEvent.strThumb || matchingEvent.strPoster || matchingEvent.strBanner;
          console.log(`✅ Found event image: ${imageUrl}`);
          return imageUrl;
        }
      } catch (e) {
        console.log(`Search failed for term "${term}":`, e);
      }
    }

    // Fallback: Get team badge as image
    console.log('🔄 Falling back to team badge search...');
    const teamSearchUrl = `${baseUrl}/searchteams.php?t=${encodeURIComponent(homeTeam)}`;
    const teamResponse = await fetch(teamSearchUrl);
    
    if (teamResponse.ok) {
      const teamData = await teamResponse.json();
      const team = teamData?.teams?.[0];
      if (team?.strBadge) {
        console.log(`✅ Using home team badge: ${team.strBadge}`);
        return team.strBadge;
      }
    }

    return null;
  } catch (error) {
    console.error('❌ Error fetching TheSportsDB image:', error);
    return null;
  }
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

    // Fetch image from TheSportsDB if not provided
    let imageUrl = matchData.poster || '';
    if (!imageUrl && matchData.homeTeam && matchData.awayTeam) {
      console.log('🖼️ Fetching match image from TheSportsDB...');
      const sportsDBImage = await fetchSportsDBEventImage(matchData.homeTeam, matchData.awayTeam);
      if (sportsDBImage) {
        imageUrl = sportsDBImage;
      }
    }

    // Default fallback image
    if (!imageUrl) {
      imageUrl = 'https://i.imgur.com/m4nV9S8.png';
    }

    const streamUrl = matchData.streamUrl || `https://damitv.netlify.app/match/${matchData.matchId}`;

    // Prepare payload for Make.com
    const makePayload = {
      matchId: matchData.matchId,
      matchTitle: matchData.matchTitle,
      homeTeam: matchData.homeTeam || '',
      awayTeam: matchData.awayTeam || '',
      competition: matchData.competition || '',
      sport: matchData.sport || 'Football',
      streamUrl: streamUrl,
      kickoffTime: matchData.kickoffTime || new Date().toISOString(),
      imageUrl: imageUrl,
      message: matchData.message || `🔴 LIVE NOW: ${matchData.matchTitle}\n\n📺 Watch free HD stream: ${streamUrl}\n\n🏆 ${matchData.competition || 'Live Sports'}\n\n#DamiTV #LiveSports #FreeStreaming #${matchData.homeTeam?.replace(/\s+/g, '') || 'Sports'} #${matchData.awayTeam?.replace(/\s+/g, '') || 'Live'}`,
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

    console.log('✅ Successfully forwarded to Make.com with image:', imageUrl);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Match data sent to Make.com for social posting',
        matchId: matchData.matchId,
        matchTitle: matchData.matchTitle,
        imageUrl: imageUrl
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
