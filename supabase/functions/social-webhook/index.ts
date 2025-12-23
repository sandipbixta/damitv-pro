import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

// ========== Supabase Client ==========
function getSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  return createClient(supabaseUrl, supabaseKey);
}

// ========== Check if already notified ==========
async function isAlreadyNotified(matchId: string, notificationType: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('notified_matches')
    .select('id')
    .eq('match_id', matchId)
    .eq('notification_type', notificationType)
    .maybeSingle();
  
  if (error) {
    console.error('Error checking notification status:', error);
    return false;
  }
  
  return !!data;
}

// ========== Mark as notified (with optional message_id) ==========
async function markAsNotified(
  matchId: string, 
  matchTitle: string, 
  notificationType: string,
  messageId?: number
): Promise<void> {
  const supabase = getSupabaseClient();
  
  const record: any = {
    match_id: matchId,
    match_title: matchTitle,
    notification_type: notificationType,
    notified_at: new Date().toISOString()
  };
  
  // Store message_id in match_title for goal updates (hacky but works without schema change)
  if (messageId && notificationType === 'goal_message') {
    record.match_title = `${matchTitle}|msg_id:${messageId}`;
  }
  
  const { error } = await supabase
    .from('notified_matches')
    .upsert(record, { onConflict: 'match_id' });
  
  if (error) {
    console.error('Error marking notification:', error);
  }
}

// ========== Get stored message ID for editing ==========
async function getStoredMessageId(matchId: string): Promise<number | null> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('notified_matches')
    .select('match_title')
    .eq('match_id', `goal_${matchId}`)
    .eq('notification_type', 'goal_message')
    .maybeSingle();
  
  if (error || !data) return null;
  
  // Extract message_id from match_title
  const match = data.match_title?.match(/\|msg_id:(\d+)/);
  return match ? parseInt(match[1]) : null;
}

// ========== TheSportsDB Team Badge Fetching ==========
async function fetchTeamBadge(teamName: string): Promise<string | null> {
  const apiKey = Deno.env.get('THESPORTSDB_API_KEY');
  if (!apiKey) {
    console.log('⚠️ TheSportsDB API key not configured');
    return null;
  }

  const baseUrl = `https://www.thesportsdb.com/api/v1/json/${apiKey}`;

  try {
    const teamSearchUrl = `${baseUrl}/searchteams.php?t=${encodeURIComponent(teamName)}`;
    const teamResponse = await fetch(teamSearchUrl);
    
    if (teamResponse.ok) {
      const teamData = await teamResponse.json();
      const team = teamData?.teams?.[0];
      if (team?.strBadge) {
        console.log(`✅ Found badge for ${teamName}: ${team.strBadge}`);
        return team.strBadge;
      }
    }
  } catch (e) {
    console.log(`Search failed for team "${teamName}":`, e);
  }

  return null;
}

// Fetch both team badges
async function fetchBothTeamBadges(homeTeam: string, awayTeam: string): Promise<{ homeBadge: string | null; awayBadge: string | null }> {
  const [homeBadge, awayBadge] = await Promise.all([
    fetchTeamBadge(homeTeam),
    fetchTeamBadge(awayTeam)
  ]);
  
  console.log(`🏟️ Badges fetched - Home: ${homeBadge ? 'Yes' : 'No'}, Away: ${awayBadge ? 'Yes' : 'No'}`);
  return { homeBadge, awayBadge };
}

// ========== Inline Keyboard for Watch Live Button ==========
function createWatchLiveKeyboard(streamUrl: string) {
  return {
    inline_keyboard: [
      [{ text: '📺 Watch Live', url: streamUrl }]
    ]
  };
}

// ========== Telegram Posting with Inline Buttons ==========
async function postToTelegramWithBothLogos(
  message: string,
  streamUrl: string,
  homeBadge?: string | null,
  awayBadge?: string | null
): Promise<{ success: boolean; error?: string; messageId?: number }> {
  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  const chatId = Deno.env.get('TELEGRAM_CHAT_ID');

  if (!botToken || !chatId) {
    console.log('⚠️ Telegram credentials not configured');
    return { success: false, error: 'Telegram credentials not configured' };
  }

  const replyMarkup = createWatchLiveKeyboard(streamUrl);

  try {
    let response;
    let messageId: number | undefined;
    
    // If both badges available, send as media group with 2 photos
    if (homeBadge && awayBadge) {
      console.log('📸 Sending media group with both team logos');
      const url = `https://api.telegram.org/bot${botToken}/sendMediaGroup`;
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          media: [
            {
              type: 'photo',
              media: homeBadge,
              caption: message,
              parse_mode: 'HTML'
            },
            {
              type: 'photo',
              media: awayBadge
            }
          ]
        })
      });
      
      // Media group doesn't support inline keyboards, send follow-up message with button
      const mediaData = await response.json();
      if (mediaData.ok && mediaData.result?.[0]?.message_id) {
        messageId = mediaData.result[0].message_id;
        // Send button as reply
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: '👆 Click below to watch the match live!',
            reply_markup: replyMarkup,
            reply_to_message_id: messageId
          })
        });
      }
      
      if (!response.ok || !mediaData.ok) {
        console.error('❌ Telegram API error:', mediaData);
        return { success: false, error: mediaData.description || 'Telegram API error' };
      }
      
      console.log('✅ Posted to Telegram successfully');
      return { success: true, messageId };
      
    } else if (homeBadge || awayBadge) {
      // Only one badge available, send single photo with inline button
      const imageUrl = homeBadge || awayBadge;
      console.log('📸 Sending single photo with one team logo');
      const url = `https://api.telegram.org/bot${botToken}/sendPhoto`;
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          photo: imageUrl,
          caption: message,
          parse_mode: 'HTML',
          reply_markup: replyMarkup
        })
      });
    } else {
      // No badges, send text only with inline button
      console.log('📝 Sending text message only (no logos found)');
      const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML',
          reply_markup: replyMarkup
        })
      });
    }

    const data = await response.json();
    
    if (!response.ok || !data.ok) {
      console.error('❌ Telegram API error:', data);
      return { success: false, error: data.description || 'Telegram API error' };
    }

    messageId = data.result?.message_id;
    console.log('✅ Posted to Telegram successfully, message_id:', messageId);
    return { success: true, messageId };
  } catch (error) {
    console.error('❌ Telegram posting error:', error);
    return { success: false, error: error.message };
  }
}

// ========== Edit Telegram Message (for goal updates) ==========
async function editTelegramMessage(
  messageId: number,
  newCaption: string,
  streamUrl: string
): Promise<{ success: boolean; error?: string }> {
  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  const chatId = Deno.env.get('TELEGRAM_CHAT_ID');

  if (!botToken || !chatId) {
    return { success: false, error: 'Telegram credentials not configured' };
  }

  try {
    const url = `https://api.telegram.org/bot${botToken}/editMessageCaption`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        caption: newCaption,
        parse_mode: 'HTML',
        reply_markup: createWatchLiveKeyboard(streamUrl)
      })
    });

    const data = await response.json();
    
    if (!response.ok || !data.ok) {
      console.error('❌ Edit message error:', data);
      return { success: false, error: data.description || 'Edit failed' };
    }

    console.log('✅ Message edited successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Edit message error:', error);
    return { success: false, error: error.message };
  }
}

// ========== Message Formatting ==========
function formatMatchLiveMessage(data: MatchData, streamUrl: string): string {
  const emoji = getSportEmoji(data.sport);
  
  return `🔴 <b>LIVE NOW!</b>

${emoji} <b>${data.homeTeam}</b> vs <b>${data.awayTeam}</b>
${data.competition ? `🏆 ${data.competition}\n` : ''}
📺 Stream ready - tap the button below!

#LiveStream #Sports #DamiTV`;
}

function formatGoalMessage(data: MatchData, streamUrl: string): string {
  const scoreDisplay = `${data.homeTeam} ${data.homeScore ?? 0} - ${data.awayScore ?? 0} ${data.awayTeam}`;
  const scorerInfo = data.scorer ? `\n👤 <b>${data.scorer}</b>${data.minute ? ` (${data.minute}')` : ''}` : '';
  const minuteInfo = !data.scorer && data.minute ? `\n⏱️ ${data.minute}'` : '';
  
  return `⚽ <b>GOAL!</b>

📊 <b>${scoreDisplay}</b>${scorerInfo}${minuteInfo}

📺 Watch the action live!

#Goal #LiveStream #DamiTV`;
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

// Helper to extract teams from matchTitle like "Team A vs Team B"
function extractTeamsFromTitle(title: string): { home: string; away: string } | null {
  const vsPatterns = [' vs ', ' v ', ' VS ', ' V ', ' versus ', ' - '];
  for (const pattern of vsPatterns) {
    if (title.includes(pattern)) {
      const parts = title.split(pattern);
      if (parts.length >= 2) {
        return { home: parts[0].trim(), away: parts[1].trim() };
      }
    }
  }
  return null;
}

// Generate SEO-friendly slug for match URL
function generateMatchSlug(homeTeam: string, awayTeam: string): string {
  const slugify = (text: string) => text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
  
  return `${slugify(homeTeam)}-vs-${slugify(awayTeam)}-live-stream`;
}

// Build production URL with SEO slug
function buildProductionUrl(sport: string, matchId: string, homeTeam: string, awayTeam: string): string {
  const slug = generateMatchSlug(homeTeam, awayTeam);
  return `https://damitv.pro/match/${sport}/${matchId}/${slug}`;
}

// ========== Google Indexing API ==========
async function submitToGoogleIndexing(url: string): Promise<{ success: boolean; error?: string }> {
  const privateKey = Deno.env.get('GOOGLE_INDEXING_PRIVATE_KEY');
  const clientEmail = Deno.env.get('GOOGLE_INDEXING_CLIENT_EMAIL');

  if (!privateKey || !clientEmail) {
    console.log('⚠️ Google Indexing credentials not configured');
    return { success: false, error: 'Google Indexing credentials not configured' };
  }

  try {
    // Generate JWT
    const now = Math.floor(Date.now() / 1000);
    const expiry = now + 3600;

    const header = { alg: 'RS256', typ: 'JWT' };
    const payload = {
      iss: clientEmail,
      scope: 'https://www.googleapis.com/auth/indexing',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: expiry,
    };

    const base64UrlEncode = (data: object | string): string => {
      const str = typeof data === 'string' ? data : JSON.stringify(data);
      const base64 = btoa(str);
      return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    };

    const headerEncoded = base64UrlEncode(header);
    const payloadEncoded = base64UrlEncode(payload);
    const signatureInput = `${headerEncoded}.${payloadEncoded}`;

    const pemContents = privateKey
      .replace('-----BEGIN PRIVATE KEY-----', '')
      .replace('-----END PRIVATE KEY-----', '')
      .replace(/\\n/g, '')
      .replace(/\s/g, '');

    const binaryKey = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

    const cryptoKey = await crypto.subtle.importKey(
      'pkcs8',
      binaryKey,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBytes = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      cryptoKey,
      new TextEncoder().encode(signatureInput)
    );

    const signatureEncoded = btoa(String.fromCharCode(...new Uint8Array(signatureBytes)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    const jwt = `${signatureInput}.${signatureEncoded}`;

    // Get access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('❌ Failed to get Google access token:', error);
      return { success: false, error: `Token error: ${error}` };
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Submit URL for indexing
    const indexResponse = await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        url: url,
        type: 'URL_UPDATED',
      }),
    });

    const indexResult = await indexResponse.json();

    if (!indexResponse.ok) {
      console.error('❌ Google Indexing API error:', indexResult);
      return { success: false, error: indexResult.error?.message || 'Indexing API error' };
    }

    console.log('✅ URL submitted to Google Indexing:', url);
    return { success: true };
  } catch (error) {
    console.error('❌ Google Indexing error:', error);
    return { success: false, error: error.message };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📨 Social webhook triggered - posting to Telegram');
    
    const matchData: MatchData = await req.json();
    console.log('📥 Received match data:', JSON.stringify(matchData, null, 2));

    // Try to extract teams from matchTitle if homeTeam/awayTeam are empty
    let homeTeam = matchData.homeTeam;
    let awayTeam = matchData.awayTeam;
    
    if ((!homeTeam || !awayTeam) && matchData.matchTitle) {
      const extracted = extractTeamsFromTitle(matchData.matchTitle);
      if (extracted) {
        homeTeam = homeTeam || extracted.home;
        awayTeam = awayTeam || extracted.away;
        console.log(`📋 Extracted teams from title: "${homeTeam}" vs "${awayTeam}"`);
      }
    }

    // Validate required fields
    if (!homeTeam || !awayTeam) {
      console.error('❌ Missing required fields: homeTeam and awayTeam');
      return new Response(
        JSON.stringify({ success: false, error: 'homeTeam and awayTeam are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Update matchData with extracted teams
    matchData.homeTeam = homeTeam;
    matchData.awayTeam = awayTeam;

    // Build stream URL with production domain and SEO slug
    const matchId = matchData.matchId || `${matchData.homeTeam.toLowerCase().replace(/\s+/g, '-')}-vs-${matchData.awayTeam.toLowerCase().replace(/\s+/g, '-')}`;
    const sport = matchData.sport || 'football';
    const streamUrl = buildProductionUrl(sport, matchId, matchData.homeTeam, matchData.awayTeam);
    const notificationType = matchData.eventType || 'match_live';
    const matchTitle = matchData.matchTitle || `${matchData.homeTeam} vs ${matchData.awayTeam}`;

    // Check if already notified (server-side deduplication)
    const alreadyNotified = await isAlreadyNotified(matchId, notificationType);
    if (alreadyNotified) {
      console.log(`⏭️ Already notified for ${matchTitle} (${notificationType}), skipping...`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          skipped: true, 
          reason: 'Already notified for this match' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch both team badges from TheSportsDB
    console.log('🖼️ Fetching both team badges from TheSportsDB...');
    const { homeBadge, awayBadge } = await fetchBothTeamBadges(matchData.homeTeam, matchData.awayTeam);

    // Format message based on event type
    let message: string;
    
    if (matchData.eventType === 'goal_scored') {
      message = formatGoalMessage(matchData, streamUrl);
    } else {
      // Default to match live
      message = formatMatchLiveMessage(matchData, streamUrl);
    }

    console.log('📝 Formatted message:', message);

    // Post to Telegram with both team logos and inline button
    const telegramResult = await postToTelegramWithBothLogos(message, streamUrl, homeBadge, awayBadge);

    // Submit to Google Indexing API (only for new match_live events)
    let googleIndexResult = null;
    if (notificationType === 'match_live') {
      console.log('🔍 Submitting URL to Google Indexing:', streamUrl);
      googleIndexResult = await submitToGoogleIndexing(streamUrl);
    }

    // Mark as notified if successful, including message_id for goal edits
    if (telegramResult.success) {
      await markAsNotified(matchId, matchTitle, notificationType);
      
      // Store message ID for goal updates
      if (telegramResult.messageId) {
        await markAsNotified(`goal_${matchId}`, matchTitle, 'goal_message', telegramResult.messageId);
      }
    }

    console.log('📊 Telegram result:', telegramResult);
    if (googleIndexResult) {
      console.log('📊 Google Indexing result:', googleIndexResult);
    }

    return new Response(
      JSON.stringify({
        success: telegramResult.success,
        telegram: telegramResult,
        googleIndexing: googleIndexResult,
        streamUrl,
        homeBadge,
        awayBadge
      }),
      { 
        status: telegramResult.success ? 200 : 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
      JSON.stringify({
        success: telegramResult.success,
        telegram: telegramResult,
        streamUrl,
        homeBadge,
        awayBadge
      }),
      { 
        status: telegramResult.success ? 200 : 500, 
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
