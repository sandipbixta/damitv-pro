import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createHmac } from "node:crypto";

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
  eventType?: 'match_live' | 'goal_scored' | 'match_end';
  homeScore?: number;
  awayScore?: number;
  scorer?: string;
  minute?: string;
}

// ========== TheSportsDB Image Fetching ==========
async function fetchSportsDBEventImage(homeTeam: string, awayTeam: string): Promise<string | null> {
  const apiKey = Deno.env.get('THESPORTSDB_API_KEY');
  if (!apiKey) {
    console.log('⚠️ TheSportsDB API key not configured');
    return null;
  }

  const baseUrl = `https://www.thesportsdb.com/api/v1/json/${apiKey}`;

  try {
    const searchTerms = [homeTeam, awayTeam];

    for (const term of searchTerms) {
      try {
        const teamSearchUrl = `${baseUrl}/searchteams.php?t=${encodeURIComponent(term)}`;
        const teamResponse = await fetch(teamSearchUrl);
        
        if (teamResponse.ok) {
          const teamData = await teamResponse.json();
          const team = teamData?.teams?.[0];
          if (team?.strBadge) {
            console.log(`✅ Using team badge: ${team.strBadge}`);
            return team.strBadge;
          }
        }
      } catch (e) {
        console.log(`Search failed for team "${term}":`, e);
      }
    }

    return null;
  } catch (error) {
    console.error('❌ Error fetching TheSportsDB image:', error);
    return null;
  }
}

// ========== Telegram Posting ==========
async function postToTelegram(
  message: string,
  imageUrl?: string
): Promise<{ success: boolean; error?: string }> {
  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  const chatId = Deno.env.get('TELEGRAM_CHAT_ID');

  if (!botToken || !chatId) {
    console.log('⚠️ Telegram credentials not configured');
    return { success: false, error: 'Telegram credentials not configured' };
  }

  try {
    let response;
    
    if (imageUrl) {
      // Send photo with caption
      const url = `https://api.telegram.org/bot${botToken}/sendPhoto`;
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          photo: imageUrl,
          caption: message,
          parse_mode: 'HTML'
        })
      });
    } else {
      // Send text message only
      const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML'
        })
      });
    }

    const data = await response.json();
    
    if (!response.ok || !data.ok) {
      console.error('❌ Telegram API error:', data);
      return { success: false, error: data.description || 'Telegram API error' };
    }

    console.log('✅ Posted to Telegram successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Telegram posting error:', error);
    return { success: false, error: error.message };
  }
}

// ========== Twitter/X Posting ==========
function generateOAuthSignature(
  method: string,
  url: string,
  params: Record<string, string>,
  consumerSecret: string,
  tokenSecret: string
): string {
  const signatureBaseString = `${method}&${encodeURIComponent(url)}&${encodeURIComponent(
    Object.entries(params)
      .sort()
      .map(([k, v]) => `${k}=${v}`)
      .join("&")
  )}`;
  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`;
  const hmacSha1 = createHmac("sha1", signingKey);
  return hmacSha1.update(signatureBaseString).digest("base64");
}

function generateOAuthHeader(method: string, url: string): string | null {
  const apiKey = Deno.env.get("TWITTER_CONSUMER_KEY")?.trim();
  const apiSecret = Deno.env.get("TWITTER_CONSUMER_SECRET")?.trim();
  const accessToken = Deno.env.get("TWITTER_ACCESS_TOKEN")?.trim();
  const accessTokenSecret = Deno.env.get("TWITTER_ACCESS_TOKEN_SECRET")?.trim();

  if (!apiKey || !apiSecret || !accessToken || !accessTokenSecret) {
    return null;
  }

  const oauthParams = {
    oauth_consumer_key: apiKey,
    oauth_nonce: Math.random().toString(36).substring(2),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: accessToken,
    oauth_version: "1.0",
  };

  const signature = generateOAuthSignature(
    method,
    url,
    oauthParams,
    apiSecret,
    accessTokenSecret
  );

  const signedOAuthParams = {
    ...oauthParams,
    oauth_signature: signature,
  };

  const entries = Object.entries(signedOAuthParams).sort((a, b) =>
    a[0].localeCompare(b[0])
  );

  return (
    "OAuth " +
    entries
      .map(([k, v]) => `${encodeURIComponent(k)}="${encodeURIComponent(v)}"`)
      .join(", ")
  );
}

async function postToTwitter(tweetText: string): Promise<{ success: boolean; error?: string }> {
  const url = "https://api.x.com/2/tweets";
  const oauthHeader = generateOAuthHeader("POST", url);

  if (!oauthHeader) {
    console.log('⚠️ Twitter credentials not configured');
    return { success: false, error: 'Twitter credentials not configured' };
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: oauthHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: tweetText }),
    });

    const responseText = await response.text();
    console.log('Twitter response:', response.status, responseText);

    if (!response.ok) {
      return { success: false, error: `Twitter API error: ${response.status} - ${responseText}` };
    }

    console.log('✅ Posted to Twitter successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Twitter posting error:', error);
    return { success: false, error: error.message };
  }
}

// ========== Message Formatting ==========
function formatMatchLiveMessage(data: MatchData, streamUrl: string): { telegram: string; twitter: string } {
  const emoji = getSportEmoji(data.sport);
  
  const telegram = `${emoji} <b>LIVE NOW!</b>

⚽ <b>${data.homeTeam}</b> vs <b>${data.awayTeam}</b>
${data.competition ? `🏆 ${data.competition}\n` : ''}
📺 Watch live: ${streamUrl}

#LiveStream #Sports #DamiTV`;

  const twitter = `${emoji} LIVE NOW!

${data.homeTeam} vs ${data.awayTeam}
${data.competition ? `🏆 ${data.competition}\n` : ''}
📺 Watch: ${streamUrl}

#LiveStream #Sports`;

  return { telegram, twitter };
}

function formatGoalMessage(data: MatchData, streamUrl: string): { telegram: string; twitter: string } {
  const emoji = '⚽';
  const scoreDisplay = `${data.homeTeam} ${data.homeScore ?? 0} - ${data.awayScore ?? 0} ${data.awayTeam}`;
  const scorerInfo = data.scorer ? `\n👤 ${data.scorer}${data.minute ? ` (${data.minute}')` : ''}` : '';
  
  const telegram = `${emoji} <b>GOAL!</b>

📊 <b>${scoreDisplay}</b>${scorerInfo}

📺 Watch live: ${streamUrl}

#Goal #LiveStream #DamiTV`;

  const twitter = `${emoji} GOAL!

${scoreDisplay}${scorerInfo}

📺 ${streamUrl}

#Goal #LiveStream`;

  return { telegram, twitter };
}

function getSportEmoji(sport?: string): string {
  const sportEmojis: Record<string, string> = {
    'football': '⚽',
    'soccer': '⚽',
    'basketball': '🏀',
    'tennis': '🎾',
    'american-football': '🏈',
    'hockey': '🏒',
    'baseball': '⚾',
    'golf': '⛳',
    'boxing': '🥊',
    'mma': '🥊',
    'fight': '🥊',
    'cricket': '🏏',
    'rugby': '🏉',
    'darts': '🎯',
    'motorsport': '🏎️',
    'f1': '🏎️',
  };
  return sportEmojis[sport?.toLowerCase() || ''] || '🏆';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📨 Social webhook triggered - posting to Telegram & X');
    
    const matchData: MatchData = await req.json();
    console.log('📥 Received match data:', JSON.stringify(matchData, null, 2));

    // Validate required fields
    if (!matchData.homeTeam || !matchData.awayTeam) {
      console.error('❌ Missing required fields: homeTeam and awayTeam');
      return new Response(
        JSON.stringify({ success: false, error: 'homeTeam and awayTeam are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build stream URL
    const matchId = matchData.matchId || `${matchData.homeTeam.toLowerCase().replace(/\s+/g, '-')}-vs-${matchData.awayTeam.toLowerCase().replace(/\s+/g, '-')}`;
    const streamUrl = matchData.streamUrl || `https://damitv.netlify.app/match/${matchData.sport || 'football'}/${matchId}`;

    // Fetch image if not provided
    let imageUrl = matchData.poster || '';
    if (!imageUrl) {
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

    // Format messages based on event type
    let messages: { telegram: string; twitter: string };
    
    if (matchData.eventType === 'goal_scored') {
      messages = formatGoalMessage(matchData, streamUrl);
    } else {
      // Default to match live
      messages = formatMatchLiveMessage(matchData, streamUrl);
    }

    console.log('📝 Formatted messages:', messages);

    // Post to both platforms in parallel
    const [telegramResult, twitterResult] = await Promise.all([
      postToTelegram(messages.telegram, imageUrl),
      postToTwitter(messages.twitter)
    ]);

    console.log('📊 Results - Telegram:', telegramResult, 'Twitter:', twitterResult);

    const response = {
      success: telegramResult.success || twitterResult.success,
      telegram: telegramResult,
      twitter: twitterResult,
      streamUrl,
      imageUrl
    };

    return new Response(
      JSON.stringify(response),
      { 
        status: response.success ? 200 : 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Webhook error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
