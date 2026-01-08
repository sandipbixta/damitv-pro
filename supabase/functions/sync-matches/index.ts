import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.9";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SportsDBEvent {
  idEvent: string;
  strEvent: string;
  strHomeTeam: string;
  strAwayTeam: string;
  strLeague: string;
  strVenue: string;
  strTimestamp: string;
  strThumb: string;
  strHomeTeamBadge: string;
  strAwayTeamBadge: string;
  strStatus: string;
  intHomeScore: string | null;
  intAwayScore: string | null;
  strSport: string;
}

interface FAQ {
  question: string;
  answer: string;
}

// Dynamic openers to prevent repetitive templates
const DYNAMIC_OPENERS = [
  "The stakes couldn't be higher for",
  "Fans are heading to [VENUE] today for",
  "A classic rivalry renewed as",
  "All eyes are on",
  "Anticipation reaches fever pitch as"
];

// Sport-specific keywords for authentic coverage
const SPORT_KEYWORDS: Record<string, string[]> = {
  "Baseball": ["the bullpen", "home runs", "RBIs", "the diamond"],
  "Basketball": ["fast breaks", "three-pointers", "the paint", "slam dunks"],
  "Soccer": ["clean sheets", "the pitch", "set pieces", "the final third"],
  "Football": ["clean sheets", "the pitch", "set pieces", "the final third"],
  "Ice Hockey": ["power plays", "the crease", "hat tricks", "face-offs"],
  "American Football": ["the end zone", "fourth down", "red zone", "blitz packages"],
  "Tennis": ["break points", "baseline rallies", "aces", "the net"],
  "Cricket": ["the crease", "maiden overs", "boundaries", "the wicket"],
  "Rugby": ["the try line", "scrums", "lineouts", "conversions"],
  "MMA": ["the octagon", "ground game", "striking", "submissions"],
  "Boxing": ["the ring", "power punches", "footwork", "combinations"],
  "Motorsport": ["pit stops", "pole position", "the grid", "lap times"]
};

// Popular league IDs for TheSportsDB eventsnextleague endpoint
const POPULAR_LEAGUES = [
  { id: "4328", name: "English Premier League", sport: "Soccer" },
  { id: "4391", name: "NFL", sport: "American Football" },
  { id: "4387", name: "NBA", sport: "Basketball" },
  { id: "4424", name: "MLB", sport: "Baseball" },
  { id: "4380", name: "NHL", sport: "Ice Hockey" },
  { id: "4335", name: "La Liga", sport: "Soccer" },
  { id: "4331", name: "Bundesliga", sport: "Soccer" },
  { id: "4332", name: "Serie A", sport: "Soccer" },
  { id: "4334", name: "Ligue 1", sport: "Soccer" },
  { id: "4346", name: "MLS", sport: "Soccer" },
  { id: "4359", name: "UEFA Champions League", sport: "Soccer" },
];

// Generate AI content for a match
async function generateMatchContent(
  homeTeam: string,
  awayTeam: string,
  league: string,
  venue: string,
  matchTime: string,
  sport: string = "Football"
): Promise<{ seoPreview: string; faqs: FAQ[] }> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  
  if (!LOVABLE_API_KEY) {
    console.log("⚠️ LOVABLE_API_KEY not configured, using fallback content");
    return generateFallbackContent(homeTeam, awayTeam, league);
  }

  // Select random opener
  const randomOpener = DYNAMIC_OPENERS[Math.floor(Math.random() * DYNAMIC_OPENERS.length)];
  
  // Get sport-specific keywords
  const sportKey = Object.keys(SPORT_KEYWORDS).find(key => 
    sport.toLowerCase().includes(key.toLowerCase())
  ) || "Football";
  const keywords = SPORT_KEYWORDS[sportKey] || SPORT_KEYWORDS["Football"];
  const keywordInstructions = keywords.slice(0, 2).join("' or '");

  try {
    const prompt = `Generate a UNIQUE SEO match preview following these STRICT rules:

MATCH DETAILS:
- Match: ${homeTeam} vs ${awayTeam}
- League: ${league}
- Venue: ${venue}
- Time: ${matchTime}
- Sport: ${sport}

WRITING RULES (MUST FOLLOW):

1. ANSWER-FIRST FORMAT (CRITICAL FOR AI OVERVIEW):
   Your preview MUST start with a 50-word "TL;DR" summary that answers:
   - WHO is playing (team names)
   - WHEN (date/time reference)
   - WHERE (venue)
   - PREDICTION (score prediction with brief reasoning)
   This first paragraph should be clippable by AI models as a standalone answer.

2. DYNAMIC OPENER: After the summary, continue with this opening style: "${randomOpener.replace('[VENUE]', venue)}"
   Do NOT use generic openings like "In this match..." or "Today's game..."

3. SPORT-SPECIFIC LANGUAGE: You MUST naturally include at least one of these terms: '${keywordInstructions}'
   Weave them naturally into your tactical analysis.

4. LOCAL HERO RULE: Identify and highlight ONE star player from ${homeTeam} (the home team).
   Mention their recent form, role, or what they bring to this match.

5. JOURNALISTIC STYLE: Use varied sentence lengths:
   - Mix short, punchy sentences (5-8 words) for impact
   - With longer, detailed analytical sentences (15-25 words)
   - Avoid robotic, uniform sentence structures

6. AUTHENTIC VOICE: Write like a seasoned sports journalist, not a template. Include:
   - Specific tactical observations
   - Recent form analysis (imagine you know their last 3 results)
   - A bold prediction with reasoning

REQUIRED OUTPUT - Respond ONLY with valid JSON:
{
  "seoPreview": "FIRST 50 WORDS: Direct summary with who/when/where/prediction. THEN: Your 150-word expert analysis following ALL rules above...",
  "faqs": [
    {"question": "What time does ${homeTeam} vs ${awayTeam} kick off?", "answer": "Detailed answer about timing with timezone info..."},
    {"question": "How can I watch ${homeTeam} vs ${awayTeam} live stream free?", "answer": "Answer about DamiTV streaming - mention HD quality and multiple sources..."},
    {"question": "Who are the key players to watch in ${homeTeam} vs ${awayTeam}?", "answer": "Mention 2-3 star players with specific stats or form..."},
    {"question": "What is the predicted score for ${homeTeam} vs ${awayTeam}?", "answer": "Your specific score prediction (e.g., 2-1) with tactical reasoning..."},
    {"question": "Where is ${homeTeam} vs ${awayTeam} being played?", "answer": "Venue name and brief stadium info..."}
  ]
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { 
            role: "system", 
            content: "You are an award-winning sports journalist with 20 years of experience covering live sports. Your writing is vivid, insightful, and never formulaic. Each preview you write feels fresh and uniquely tailored to the match. You ALWAYS respond with valid JSON only, no markdown formatting." 
          },
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      console.error("AI API error:", response.status);
      return generateFallbackContent(homeTeam, awayTeam, league);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    // Parse JSON from response (handle potential markdown code blocks)
    let jsonString = content;
    // Remove markdown code blocks if present
    if (content.includes("```json")) {
      jsonString = content.replace(/```json\n?/g, "").replace(/```\n?/g, "");
    } else if (content.includes("```")) {
      jsonString = content.replace(/```\n?/g, "");
    }
    
    const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      console.log(`✅ AI content generated for: ${homeTeam} vs ${awayTeam}`);
      return {
        seoPreview: parsed.seoPreview || generateFallbackContent(homeTeam, awayTeam, league).seoPreview,
        faqs: parsed.faqs || generateFallbackContent(homeTeam, awayTeam, league).faqs,
      };
    }
    
    return generateFallbackContent(homeTeam, awayTeam, league);
  } catch (error) {
    console.error("AI generation error:", error);
    return generateFallbackContent(homeTeam, awayTeam, league);
  }
}

// Fallback content when AI is unavailable - follows answer-first format
function generateFallbackContent(homeTeam: string, awayTeam: string, league: string): { seoPreview: string; faqs: FAQ[] } {
  return {
    seoPreview: `${homeTeam} faces ${awayTeam} in a crucial ${league} clash. Expect a competitive match with both sides pushing for victory - prediction: ${homeTeam} 2-1 ${awayTeam}. This highly anticipated match promises exciting action as both teams look to secure vital points. ${homeTeam} will be looking to capitalize on home advantage while ${awayTeam} aims to upset the odds on the road. Key players from both sides will be under pressure to deliver match-winning performances. With both teams in competitive form, expect an intense battle from start to finish. Fans worldwide can stream this match live on DamiTV with multiple HD stream options.`,
    faqs: [
      {
        question: `What time does ${homeTeam} vs ${awayTeam} kick off?`,
        answer: `Check the match page for the exact kickoff time displayed in your local timezone. We recommend joining 10 minutes early to ensure your stream is ready and stable.`
      },
      {
        question: `How can I watch ${homeTeam} vs ${awayTeam} live stream free?`,
        answer: `You can stream the match live on DamiTV completely free. We provide multiple verified stream links with HD quality options for the best viewing experience - no registration required.`
      },
      {
        question: `Who are the key players to watch in ${homeTeam} vs ${awayTeam}?`,
        answer: `Both teams feature talented squads. Watch for the home team's attacking threats and the away side's key playmakers. Check our match preview for specific player insights.`
      },
      {
        question: `What is the predicted score for ${homeTeam} vs ${awayTeam}?`,
        answer: `Our prediction: ${homeTeam} 2-1 ${awayTeam}. The home advantage typically plays a significant role, and we expect a closely contested match with the hosts edging it.`
      },
      {
        question: `Where is ${homeTeam} vs ${awayTeam} being played?`,
        answer: `This ${league} match will be played at ${homeTeam}'s home stadium. Check the match page for venue details and capacity information.`
      }
    ]
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const THESPORTSDB_API_KEY = Deno.env.get("THESPORTSDB_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    // Log API key status for debugging
    console.log("🔑 API Key configured:", !!THESPORTSDB_API_KEY);
    console.log("🔑 API Key length:", THESPORTSDB_API_KEY?.length || 0);

    if (!THESPORTSDB_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing required environment variables");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get specific league ID from request or fetch all popular leagues
    const { leagueId } = await req.json().catch(() => ({}));
    
    console.log("🔄 Starting match sync...");

    let allEvents: SportsDBEvent[] = [];
    const leaguesToFetch = leagueId 
      ? [{ id: leagueId, name: "Custom League", sport: "Football" }] 
      : POPULAR_LEAGUES;

    // Fetch events from each league using eventsnextleague.php
    for (const league of leaguesToFetch) {
      const url = `https://www.thesportsdb.com/api/v1/json/${THESPORTSDB_API_KEY}/eventsnextleague.php?id=${league.id}`;
      
      // Critical logging for debugging
      console.log("Fetching URL:", url);
      
      try {
        const response = await fetch(url);
        console.log(`📡 League ${league.name} (${league.id}) - Status: ${response.status}`);
        
        if (response.ok) {
          const data = await response.json();
          const events: SportsDBEvent[] = (data.events || []).map((e: SportsDBEvent) => ({
            ...e,
            strSport: e.strSport || league.sport // Ensure sport is set
          }));
          console.log(`📥 ${league.name}: ${events.length} upcoming events`);
          allEvents = [...allEvents, ...events];
        } else {
          console.warn(`⚠️ Failed to fetch ${league.name}: ${response.status}`);
        }
      } catch (fetchError) {
        console.error(`❌ Error fetching ${league.name}:`, fetchError);
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log(`📊 Total events fetched: ${allEvents.length}`);

    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    for (const event of allEvents) {
      // Check if match already exists
      const { data: existing } = await supabase
        .from("matches")
        .select("id, seo_preview")
        .eq("match_id", event.idEvent)
        .maybeSingle();

      const matchTime = new Date(event.strTimestamp);
      const status = event.strStatus?.toLowerCase() || "upcoming";
      const isLive = status.includes("live") || status.includes("progress");
      const isFinished = status.includes("finished") || status.includes("ft");

      if (existing) {
        // Update existing match (scores, status)
        const { error: updateError } = await supabase
          .from("matches")
          .update({
            status: isLive ? "live" : isFinished ? "finished" : "upcoming",
            home_score: event.intHomeScore ? parseInt(event.intHomeScore) : null,
            away_score: event.intAwayScore ? parseInt(event.intAwayScore) : null,
          })
          .eq("match_id", event.idEvent);

        if (updateError) {
          console.error(`Error updating ${event.idEvent}:`, updateError);
        } else {
          updated++;
        }
      } else {
        // Generate AI content for new match
        console.log(`🤖 Generating content for: ${event.strHomeTeam} vs ${event.strAwayTeam} (${event.strSport || "Football"})`);
        const { seoPreview, faqs } = await generateMatchContent(
          event.strHomeTeam,
          event.strAwayTeam,
          event.strLeague,
          event.strVenue || "TBA",
          matchTime.toISOString(),
          event.strSport || "Football"
        );

        // Insert new match
        const { error: insertError } = await supabase.from("matches").insert({
          match_id: event.idEvent,
          home_team: event.strHomeTeam,
          away_team: event.strAwayTeam,
          home_team_badge: event.strHomeTeamBadge,
          away_team_badge: event.strAwayTeamBadge,
          match_time: matchTime.toISOString(),
          league: event.strLeague,
          venue: event.strVenue || "TBA",
          status: isLive ? "live" : isFinished ? "finished" : "upcoming",
          home_score: event.intHomeScore ? parseInt(event.intHomeScore) : null,
          away_score: event.intAwayScore ? parseInt(event.intAwayScore) : null,
          seo_preview: seoPreview,
          faqs: faqs,
          sport: event.strSport || "Football",
        });

        if (insertError) {
          console.error(`Error inserting ${event.idEvent}:`, insertError);
          skipped++;
        } else {
          inserted++;
        }
      }
    }

    console.log(`✅ Sync complete: ${inserted} inserted, ${updated} updated, ${skipped} skipped`);

    return new Response(
      JSON.stringify({
        success: true,
        total: allEvents.length,
        inserted,
        updated,
        skipped,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ Sync error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
