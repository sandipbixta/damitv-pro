import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LiveEvent {
  idLiveScore: string;
  strEvent: string;
  strHomeTeam: string;
  strAwayTeam: string;
  intHomeScore: string;
  intAwayScore: string;
  strProgress: string;
  strStatus: string;
  strLeague: string;
  strSport: string;
  strHomeGoalDetails?: string;
  strAwayGoalDetails?: string;
  strThumb?: string;
}

interface CachedScore {
  eventId: string;
  homeScore: number;
  awayScore: number;
  lastGoalDetails: string;
}

// In-memory cache for score tracking (resets on function cold start)
const scoreCache = new Map<string, CachedScore>();

async function fetchLiveScores(): Promise<LiveEvent[]> {
  const apiKey = Deno.env.get('THESPORTSDB_API_KEY');
  if (!apiKey) {
    console.log('⚠️ TheSportsDB API key not configured');
    return [];
  }

  const sports = ['Soccer', 'Basketball', 'Ice_Hockey', 'American_Football'];
  const allEvents: LiveEvent[] = [];

  for (const sport of sports) {
    try {
      const url = `https://www.thesportsdb.com/api/v1/json/${apiKey}/livescore.php?s=${sport}`;
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        if (data.events && Array.isArray(data.events)) {
          allEvents.push(...data.events);
        }
      }
    } catch (error) {
      console.error(`Failed to fetch ${sport} live scores:`, error);
    }
  }

  console.log(`📊 Fetched ${allEvents.length} live events`);
  return allEvents;
}

async function postGoalAlert(event: LiveEvent, isHomeGoal: boolean, newScore: { home: number; away: number }) {
  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  const chatId = Deno.env.get('TELEGRAM_CHAT_ID');

  if (!botToken || !chatId) {
    console.log('⚠️ Telegram credentials not configured');
    return;
  }

  const scoringTeam = isHomeGoal ? event.strHomeTeam : event.strAwayTeam;
  const goalDetails = isHomeGoal ? event.strHomeGoalDetails : event.strAwayGoalDetails;
  
  // Extract scorer from goal details (format: "Player Name 45', Player Name 67'")
  let scorer = '';
  if (goalDetails) {
    const goals = goalDetails.split(',').map(g => g.trim());
    if (goals.length > 0) {
      scorer = goals[goals.length - 1]; // Get the most recent goal
    }
  }

  const sportEmoji = getSportEmoji(event.strSport);
  const progress = event.strProgress || '';
  
  const message = `⚽ <b>GOAL!</b>

${sportEmoji} <b>${event.strHomeTeam}</b> ${newScore.home} - ${newScore.away} <b>${event.strAwayTeam}</b>
🏆 ${event.strLeague}
⏱️ ${progress}
${scorer ? `\n👤 ${scorer}` : ''}

📺 Watch live: https://damitv.netlify.app/match/${event.strSport?.toLowerCase() || 'football'}/${event.strHomeTeam.toLowerCase().replace(/\s+/g, '-')}-vs-${event.strAwayTeam.toLowerCase().replace(/\s+/g, '-')}

#Goal #${scoringTeam.replace(/\s+/g, '')} #LiveStream`;

  try {
    let response;
    
    if (event.strThumb) {
      response = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          photo: event.strThumb,
          caption: message,
          parse_mode: 'HTML'
        })
      });
    } else {
      response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
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
    if (data.ok) {
      console.log(`✅ Goal alert sent: ${event.strHomeTeam} ${newScore.home}-${newScore.away} ${event.strAwayTeam}`);
    } else {
      console.error('❌ Telegram error:', data.description);
    }
  } catch (error) {
    console.error('❌ Failed to send goal alert:', error);
  }
}

function getSportEmoji(sport?: string): string {
  const sportEmojis: Record<string, string> = {
    'Soccer': '⚽',
    'Basketball': '🏀',
    'Ice Hockey': '🏒',
    'Ice_Hockey': '🏒',
    'American Football': '🏈',
    'American_Football': '🏈',
    'Tennis': '🎾',
    'Baseball': '⚾',
    'Rugby': '🏉',
    'Cricket': '🏏',
  };
  return sportEmojis[sport || ''] || '🏆';
}

async function detectAndAlertGoals(events: LiveEvent[]) {
  let goalsDetected = 0;

  for (const event of events) {
    const eventId = event.idLiveScore;
    const homeScore = parseInt(event.intHomeScore) || 0;
    const awayScore = parseInt(event.intAwayScore) || 0;
    const goalDetails = `${event.strHomeGoalDetails || ''}-${event.strAwayGoalDetails || ''}`;

    const cached = scoreCache.get(eventId);

    if (cached) {
      // Check for new home goal
      if (homeScore > cached.homeScore) {
        console.log(`🎯 Goal detected! ${event.strHomeTeam} scored (${cached.homeScore} -> ${homeScore})`);
        await postGoalAlert(event, true, { home: homeScore, away: awayScore });
        goalsDetected++;
      }
      
      // Check for new away goal
      if (awayScore > cached.awayScore) {
        console.log(`🎯 Goal detected! ${event.strAwayTeam} scored (${cached.awayScore} -> ${awayScore})`);
        await postGoalAlert(event, false, { home: homeScore, away: awayScore });
        goalsDetected++;
      }
    }

    // Update cache
    scoreCache.set(eventId, {
      eventId,
      homeScore,
      awayScore,
      lastGoalDetails: goalDetails
    });
  }

  // Clean up old entries (matches no longer live)
  const liveEventIds = new Set(events.map(e => e.idLiveScore));
  for (const cachedId of scoreCache.keys()) {
    if (!liveEventIds.has(cachedId)) {
      scoreCache.delete(cachedId);
    }
  }

  return goalsDetected;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔔 Goal alerts check started...');
    
    // Fetch live scores from TheSportsDB
    const liveEvents = await fetchLiveScores();
    
    if (liveEvents.length === 0) {
      console.log('📭 No live events found');
      return new Response(
        JSON.stringify({ success: true, message: 'No live events', goalsDetected: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Detect goals and send alerts
    const goalsDetected = await detectAndAlertGoals(liveEvents);

    console.log(`✅ Goal check complete. Goals detected: ${goalsDetected}, Events tracked: ${scoreCache.size}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        liveEvents: liveEvents.length,
        trackedEvents: scoreCache.size,
        goalsDetected 
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