import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MatchData {
  matchId?: string;
  matchTitle?: string;
  homeTeam: string;
  awayTeam: string;
  competition?: string;
  sport?: string;
  streamUrl?: string;
  kickoffTime?: string;
  poster?: string;
  isTest?: boolean;
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

function normalizeMakeWebhookUrl(raw: string): string | null {
  const v = raw.trim();
  if (!v) return null;

  // Already a full URL
  if (v.startsWith('http://') || v.startsWith('https://')) return v;

  // Common mis-entry: "<token>@hook.us2.make.com" → "https://hook.us2.make.com/<token>"
  if (v.includes('@hook.')) {
    const [token, host] = v.split('@');
    if (token && host) return `https://${host}/${token}`;
  }

  // If only a token was provided, assume Make host
  if (/^[a-zA-Z0-9]+$/.test(v)) {
    return `https://hook.us2.make.com/${v}`;
  }

  // Best effort fallback
  return v;
}

function isValidHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📨 Social webhook triggered - forwarding to Make.com');
    
    const rawMakeWebhookUrl = Deno.env.get('MAKE_WEBHOOK_URL');
    const MAKE_WEBHOOK_URL = rawMakeWebhookUrl ? normalizeMakeWebhookUrl(rawMakeWebhookUrl) : null;

    if (!MAKE_WEBHOOK_URL || !isValidHttpUrl(MAKE_WEBHOOK_URL)) {
      console.error('❌ MAKE_WEBHOOK_URL not configured or invalid');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Make.com webhook URL not configured or invalid. Expected: https://hook.us2.make.com/<token>'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const matchData: MatchData = await req.json();
    
    console.log('📥 Received match data:', JSON.stringify(matchData, null, 2));

    // Validate required fields
    if (!matchData.homeTeam || !matchData.awayTeam) {
      console.error('❌ Missing required fields: homeTeam and awayTeam');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'homeTeam and awayTeam are required' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Build matchTitle from teams
    const matchTitle = matchData.matchTitle || `${matchData.homeTeam} vs ${matchData.awayTeam}`;

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

    // Build stream URL
    const matchId = matchData.matchId || `${matchData.homeTeam.toLowerCase().replace(/\s+/g, '-')}-vs-${matchData.awayTeam.toLowerCase().replace(/\s+/g, '-')}`;
    const streamUrl = matchData.streamUrl || `https://damitv.netlify.app/match/${matchId}`;

    // Clean, structured payload for Make.com - EXACTLY what Telegram needs
    const makePayload = {
      homeTeam: matchData.homeTeam,
      awayTeam: matchData.awayTeam,
      matchTitle: matchTitle,
      imageUrl: imageUrl,
      streamUrl: streamUrl
    };

    console.log('📤 Sending clean payload to Make.com:', JSON.stringify(makePayload, null, 2));

    // Forward to Make.com webhook with proper headers
    const makeResponse = await fetch(MAKE_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(makePayload),
    });

    const makeResponseText = await makeResponse.text();
    console.log('📥 Make.com response:', makeResponse.status, makeResponseText);

    if (!makeResponse.ok) {
      console.error('❌ Make.com webhook failed:', makeResponse.status);
      
      // Treat rate limiting / queue full as a soft failure
      const isRateLimited = makeResponse.status === 400 || makeResponse.status === 429;
      const isQueueFull = makeResponseText.toLowerCase().includes('queue is full');
      
      if (isRateLimited || isQueueFull) {
        console.log('⚠️ Make.com rate limited or queue full - treating as soft failure');
        return new Response(
          JSON.stringify({ 
            success: true, 
            warning: 'Make.com queue is full - notification skipped',
            payload: makePayload
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Make.com webhook failed: ${makeResponse.status}`,
          details: makeResponseText,
          payload: makePayload
        }),
        { 
          status: 502, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('✅ Successfully forwarded to Make.com');
    console.log('📦 Payload sent:', JSON.stringify(makePayload));

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Match data sent to Make.com for Telegram posting',
        payload: makePayload
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
