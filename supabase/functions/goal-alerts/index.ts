import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StreamedMatch {
  id: string;
  title: string;
  category: string;
  date: string;
  poster?: string;
}

interface LiveScore {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: string;
  minute?: string;
  homeGoalDetails?: string;
  awayGoalDetails?: string;
  league?: string;
  thumb?: string;
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
  
  // Use a unique key combining matchId and type for goal notifications
  const uniqueId = notificationType === 'goal_scored' 
    ? `${matchId}_goal_${Date.now()}` 
    : matchId;
  
  const record: any = {
    match_id: uniqueId,
    match_title: matchTitle,
    notification_type: notificationType,
    notified_at: new Date().toISOString()
  };
  
  // Store message_id in match_title for goal updates
  if (messageId && notificationType === 'goal_message') {
    record.match_id = `goal_msg_${matchId}`;
    record.match_title = `${matchTitle}|msg_id:${messageId}`;
  }
  
  const { error } = await supabase
    .from('notified_matches')
    .upsert(record, { onConflict: 'match_id' });
  
  if (error && !error.message.includes('duplicate')) {
    console.error('Error marking notification:', error);
  }
}

// ========== Get stored message ID for editing ==========
async function getStoredMessageId(matchId: string): Promise<number | null> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('notified_matches')
    .select('match_title')
    .eq('match_id', `goal_msg_${matchId}`)
    .eq('notification_type', 'goal_message')
    .maybeSingle();
  
  if (error || !data) return null;
  
  // Extract message_id from match_title
  const match = data.match_title?.match(/\|msg_id:(\d+)/);
  return match ? parseInt(match[1]) : null;
}

// ========== Get cached score ==========
async function getCachedScore(matchId: string): Promise<{ homeScore: number; awayScore: number } | null> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('notified_matches')
    .select('match_title')
    .eq('match_id', `score_${matchId}`)
    .maybeSingle();
  
  if (error || !data) return null;
  
  // Parse score from match_title (format: "homeScore-awayScore")
  const scores = data.match_title?.split('-').map(Number);
  if (scores && scores.length === 2 && !isNaN(scores[0]) && !isNaN(scores[1])) {
    return { homeScore: scores[0], awayScore: scores[1] };
  }
  return null;
}

// ========== Cache score ==========
async function cacheScore(matchId: string, homeScore: number, awayScore: number): Promise<void> {
  const supabase = getSupabaseClient();
  
  await supabase
    .from('notified_matches')
    .upsert({
      match_id: `score_${matchId}`,
      match_title: `${homeScore}-${awayScore}`,
      notification_type: 'score_cache',
      notified_at: new Date().toISOString()
    }, { onConflict: 'match_id' });
}

// ========== Fetch live matches from Streamed.pk ==========
async function fetchStreamedLiveMatches(): Promise<StreamedMatch[]> {
  try {
    const response = await fetch('https://streamed.pk/api/matches/live', {
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) {
      console.error('Streamed.pk API error:', response.status);
      return [];
    }
    
    const matches = await response.json();
    
    if (!Array.isArray(matches)) {
      console.error('Invalid streamed.pk response format');
      return [];
    }
    
    // Filter for football and basketball (sports with scores)
    const validMatches = matches.filter((m: any) => 
      m && m.id && m.title && 
      ['football', 'basketball', 'american-football', 'hockey'].includes(m.category?.toLowerCase())
    );
    
    console.log(`📡 Fetched ${validMatches.length} live matches from streamed.pk`);
    return validMatches;
  } catch (error) {
    console.error('Error fetching streamed.pk matches:', error);
    return [];
  }
}

// ========== Search TheSportsDB for live score ==========
async function searchSportsDBLiveScore(homeTeam: string, awayTeam: string, sport: string): Promise<LiveScore | null> {
  const apiKey = Deno.env.get('THESPORTSDB_API_KEY');
  if (!apiKey) {
    console.log('⚠️ TheSportsDB API key not configured');
    return null;
  }

  // Map sport categories to TheSportsDB sport names
  const sportMap: Record<string, string> = {
    'football': 'Soccer',
    'basketball': 'Basketball',
    'american-football': 'American_Football',
    'hockey': 'Ice_Hockey'
  };

  const sportsDBSport = sportMap[sport.toLowerCase()] || 'Soccer';

  try {
    // Fetch live scores for the sport
    const url = `https://www.thesportsdb.com/api/v1/json/${apiKey}/livescore.php?s=${sportsDBSport}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    
    if (!data.events || !Array.isArray(data.events)) {
      return null;
    }

    // Try to find matching event
    const normalizeTeam = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const homeNorm = normalizeTeam(homeTeam);
    const awayNorm = normalizeTeam(awayTeam);

    for (const event of data.events) {
      const eventHome = normalizeTeam(event.strHomeTeam || '');
      const eventAway = normalizeTeam(event.strAwayTeam || '');
      
      // Check if teams match (fuzzy matching)
      const homeMatch = eventHome.includes(homeNorm) || homeNorm.includes(eventHome) ||
                       eventHome.split('').filter((c: string) => homeNorm.includes(c)).length > homeNorm.length * 0.6;
      const awayMatch = eventAway.includes(awayNorm) || awayNorm.includes(eventAway) ||
                       eventAway.split('').filter((c: string) => awayNorm.includes(c)).length > awayNorm.length * 0.6;
      
      if (homeMatch && awayMatch) {
        console.log(`✅ Found live score: ${event.strHomeTeam} ${event.intHomeScore}-${event.intAwayScore} ${event.strAwayTeam}`);
        return {
          homeTeam: event.strHomeTeam,
          awayTeam: event.strAwayTeam,
          homeScore: parseInt(event.intHomeScore) || 0,
          awayScore: parseInt(event.intAwayScore) || 0,
          status: event.strStatus || event.strProgress || 'Live',
          minute: event.strProgress,
          homeGoalDetails: event.strHomeGoalDetails,
          awayGoalDetails: event.strAwayGoalDetails,
          league: event.strLeague,
          thumb: event.strThumb
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error searching TheSportsDB:', error);
    return null;
  }
}

// ========== Inline Keyboard for Watch Live Button ==========
function createWatchLiveKeyboard(streamUrl: string) {
  return {
    inline_keyboard: [
      [{ text: '📺 Watch Live', url: streamUrl }]
    ]
  };
}

// ========== Post to Telegram with inline button ==========
async function postToTelegram(
  message: string, 
  streamUrl: string,
  imageUrl?: string
): Promise<{ success: boolean; messageId?: number }> {
  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  const chatId = Deno.env.get('TELEGRAM_CHAT_ID');

  if (!botToken || !chatId) {
    console.log('⚠️ Telegram credentials not configured');
    return { success: false };
  }

  const replyMarkup = createWatchLiveKeyboard(streamUrl);

  try {
    let response;
    
    if (imageUrl) {
      response = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
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
      response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
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
    if (data.ok) {
      console.log('✅ Posted to Telegram successfully, message_id:', data.result?.message_id);
      return { success: true, messageId: data.result?.message_id };
    } else {
      console.error('❌ Telegram error:', data.description);
      return { success: false };
    }
  } catch (error) {
    console.error('❌ Failed to post to Telegram:', error);
    return { success: false };
  }
}

// ========== Edit Telegram Message (for goal updates like VAR) ==========
async function editTelegramMessage(
  messageId: number,
  newCaption: string,
  streamUrl: string
): Promise<{ success: boolean }> {
  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  const chatId = Deno.env.get('TELEGRAM_CHAT_ID');

  if (!botToken || !chatId) {
    return { success: false };
  }

  try {
    // Try editMessageCaption first (for photos)
    let response = await fetch(`https://api.telegram.org/bot${botToken}/editMessageCaption`, {
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

    let data = await response.json();
    
    // If caption edit fails (text-only message), try editMessageText
    if (!data.ok && data.description?.includes('no caption')) {
      response = await fetch(`https://api.telegram.org/bot${botToken}/editMessageText`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          message_id: messageId,
          text: newCaption,
          parse_mode: 'HTML',
          reply_markup: createWatchLiveKeyboard(streamUrl)
        })
      });
      data = await response.json();
    }

    if (data.ok) {
      console.log('✅ Message edited successfully');
      return { success: true };
    } else {
      console.error('❌ Edit message error:', data.description);
      return { success: false };
    }
  } catch (error) {
    console.error('❌ Edit message error:', error);
    return { success: false };
  }
}

// ========== Get sport emoji ==========
function getSportEmoji(sport: string): string {
  const emojis: Record<string, string> = {
    'football': '⚽',
    'basketball': '🏀',
    'american-football': '🏈',
    'hockey': '🏒',
    'tennis': '🎾',
    'baseball': '⚾'
  };
  return emojis[sport.toLowerCase()] || '🏆';
}

// ========== Extract teams from title ==========
function extractTeams(title: string): { home: string; away: string } | null {
  const patterns = [' vs ', ' v ', ' VS ', ' - ', ' vs. '];
  for (const pattern of patterns) {
    if (title.includes(pattern)) {
      const parts = title.split(pattern);
      if (parts.length >= 2) {
        return { home: parts[0].trim(), away: parts[1].trim() };
      }
    }
  }
  return null;
}

// ========== Build stream URL ==========
function buildStreamUrl(sport: string, matchId: string, homeTeam: string, awayTeam: string): string {
  const slugify = (text: string) => text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
  
  const slug = `${slugify(homeTeam)}-vs-${slugify(awayTeam)}-live-stream`;
  return `https://damitv.pro/match/${sport}/${matchId}/${slug}`;
}

// ========== Submit URL to Google Indexing ==========
async function submitToGoogleIndexing(url: string): Promise<boolean> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('⚠️ Supabase credentials not configured for indexing');
    return false;
  }

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/google-indexing`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({
        action: 'submit',
        url: url,
        type: 'URL_UPDATED'
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log(`🔍 Google indexed: ${url}`);
      return true;
    } else {
      console.log(`⚠️ Google indexing failed: ${result.message}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Google indexing error:', error);
    return false;
  }
}

// ========== Main processing ==========
async function processLiveMatches() {
  console.log('🔔 Starting live match & goal detection...');
  
  // 1. Fetch live matches from streamed.pk
  const liveMatches = await fetchStreamedLiveMatches();
  
  if (liveMatches.length === 0) {
    console.log('📭 No live matches found on streamed.pk');
    return { matchesProcessed: 0, goalsDetected: 0, newLiveMatches: 0 };
  }

  let goalsDetected = 0;
  let newLiveMatches = 0;

  // 2. Process each match
  for (const match of liveMatches) {
    const teams = extractTeams(match.title);
    if (!teams) {
      console.log(`⏭️ Skipping match without vs pattern: ${match.title}`);
      continue;
    }

    const sport = match.category?.toLowerCase() || 'football';
    const streamUrl = buildStreamUrl(sport, match.id, teams.home, teams.away);
    const sportEmoji = getSportEmoji(sport);

    // 3. Check if this is a NEW live match (not yet notified)
    const alreadyNotifiedLive = await isAlreadyNotified(match.id, 'match_live');
    
    if (!alreadyNotifiedLive) {
      // New live match - send notification with 🔴 LIVE indicator
      const message = `🔴 <b>LIVE NOW!</b>

${sportEmoji} <b>${teams.home}</b> vs <b>${teams.away}</b>

📺 Tap the button below to watch!

#LiveStream #Sports #DamiTV`;

      const result = await postToTelegram(message, streamUrl, match.poster);
      if (result.success) {
        await markAsNotified(match.id, match.title, 'match_live');
        newLiveMatches++;
        console.log(`🆕 New live match notified: ${match.title}`);
        
        // Auto-submit to Google Indexing
        await submitToGoogleIndexing(streamUrl);
      }
    }

    // 4. Search TheSportsDB for live score
    const liveScore = await searchSportsDBLiveScore(teams.home, teams.away, sport);
    
    if (liveScore) {
      // Get cached score
      const cachedScore = await getCachedScore(match.id);
      
      if (cachedScore) {
        // Check for new goals
        const homeGoals = liveScore.homeScore - cachedScore.homeScore;
        const awayGoals = liveScore.awayScore - cachedScore.awayScore;
        const totalNewGoals = homeGoals + awayGoals;
        
        if (totalNewGoals > 0) {
          // Goal(s) scored - check if we should edit or send new message
          const existingMessageId = await getStoredMessageId(match.id);
          
          const scorer = homeGoals > 0 
            ? liveScore.homeGoalDetails?.split(',').pop()?.trim() 
            : liveScore.awayGoalDetails?.split(',').pop()?.trim();
          
          const goalMessage = `⚽ <b>GOAL!</b>

📊 <b>${liveScore.homeTeam}</b> ${liveScore.homeScore} - ${liveScore.awayScore} <b>${liveScore.awayTeam}</b>
${liveScore.league ? `🏆 ${liveScore.league}\n` : ''}${liveScore.minute ? `⏱️ ${liveScore.minute}\n` : ''}${scorer ? `👤 <b>${scorer}</b>\n` : ''}
📺 Watch the action live!

#Goal #LiveStream #DamiTV`;

          let result: { success: boolean; messageId?: number };
          
          if (existingMessageId) {
            // Edit existing goal message (e.g., VAR update or score correction)
            console.log(`✏️ Editing existing goal message ${existingMessageId}`);
            const editResult = await editTelegramMessage(existingMessageId, goalMessage, streamUrl);
            result = { success: editResult.success, messageId: existingMessageId };
          } else {
            // Send new goal message
            result = await postToTelegram(goalMessage, streamUrl, liveScore.thumb);
          }
          
          if (result.success) {
            const scoringTeam = homeGoals > 0 ? liveScore.homeTeam : liveScore.awayTeam;
            await markAsNotified(match.id, `${scoringTeam} goal`, 'goal_scored');
            
            // Store message ID for future edits
            if (result.messageId) {
              await markAsNotified(match.id, match.title, 'goal_message', result.messageId);
            }
            
            goalsDetected += totalNewGoals;
            console.log(`⚽ Goal! ${scoringTeam} scored. Total: ${liveScore.homeScore}-${liveScore.awayScore}`);
          }
        }
      }
      
      // Update cached score
      await cacheScore(match.id, liveScore.homeScore, liveScore.awayScore);
    }
  }

  console.log(`✅ Processed ${liveMatches.length} matches. New live: ${newLiveMatches}, Goals: ${goalsDetected}`);
  
  return { 
    matchesProcessed: liveMatches.length, 
    goalsDetected, 
    newLiveMatches 
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const result = await processLiveMatches();

    return new Response(
      JSON.stringify({ 
        success: true, 
        ...result
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Goal alerts error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
