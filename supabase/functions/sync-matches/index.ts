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

// Generate AI content for a match
async function generateMatchContent(
  homeTeam: string,
  awayTeam: string,
  league: string,
  venue: string,
  matchTime: string
): Promise<{ seoPreview: string; faqs: FAQ[] }> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  
  if (!LOVABLE_API_KEY) {
    console.log("⚠️ LOVABLE_API_KEY not configured, using fallback content");
    return generateFallbackContent(homeTeam, awayTeam, league);
  }

  try {
    const prompt = `Generate SEO content for a sports match:
Match: ${homeTeam} vs ${awayTeam}
League: ${league}
Venue: ${venue}
Time: ${matchTime}

Generate:
1. A 200-word "Expert Preview" analyzing the match, recent form, key players, and prediction
2. 4 FAQs about watching this match live

Respond in JSON format:
{
  "seoPreview": "200-word expert preview text...",
  "faqs": [
    {"question": "Q1?", "answer": "A1"},
    {"question": "Q2?", "answer": "A2"},
    {"question": "Q3?", "answer": "A3"},
    {"question": "Q4?", "answer": "A4"}
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
          { role: "system", content: "You are a sports analyst writing SEO-optimized match previews. Always respond with valid JSON." },
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
    
    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
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

// Fallback content when AI is unavailable
function generateFallbackContent(homeTeam: string, awayTeam: string, league: string): { seoPreview: string; faqs: FAQ[] } {
  return {
    seoPreview: `Watch ${homeTeam} vs ${awayTeam} live in the ${league}. This highly anticipated match promises exciting action as both teams look to secure vital points. ${homeTeam} will be looking to capitalize on home advantage while ${awayTeam} aims to upset the odds on the road. Key players from both sides will be under pressure to deliver match-winning performances. With both teams in competitive form, expect an intense battle from start to finish. Fans worldwide can stream this match live on DamiTV with multiple HD stream options. Don't miss a single moment of what could be a season-defining encounter between these two rivals.`,
    faqs: [
      {
        question: `What time does ${homeTeam} vs ${awayTeam} start?`,
        answer: `Check the match page for the exact kickoff time in your local timezone. We recommend joining 10 minutes early to ensure your stream is ready.`
      },
      {
        question: `How can I watch ${homeTeam} vs ${awayTeam} live?`,
        answer: `You can stream the match live on DamiTV. We provide multiple verified stream links with HD quality options for the best viewing experience.`
      },
      {
        question: `Is ${homeTeam} vs ${awayTeam} free to watch?`,
        answer: `Yes, DamiTV offers free access to live sports streams. Simply visit the match page and select from our verified stream sources.`
      },
      {
        question: `What channel is showing ${homeTeam} vs ${awayTeam}?`,
        answer: `The match is available on various sports networks. DamiTV aggregates working stream links so you can watch regardless of your location.`
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

    if (!THESPORTSDB_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing required environment variables");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get date from request or use today
    const { date } = await req.json().catch(() => ({}));
    const targetDate = date || new Date().toISOString().split("T")[0];
    
    console.log(`🔄 Syncing matches for date: ${targetDate}`);

    // Fetch events from TheSportsDB
    const sportsdbUrl = `https://www.thesportsdb.com/api/v2/json/eventsday/${targetDate}`;
    const response = await fetch(sportsdbUrl, {
      headers: { "X-API-KEY": THESPORTSDB_API_KEY },
    });

    if (!response.ok) {
      throw new Error(`TheSportsDB API error: ${response.status}`);
    }

    const data = await response.json();
    const events: SportsDBEvent[] = data.events || [];
    
    console.log(`📥 Fetched ${events.length} events from TheSportsDB`);

    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    for (const event of events) {
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
        console.log(`🤖 Generating content for: ${event.strHomeTeam} vs ${event.strAwayTeam}`);
        const { seoPreview, faqs } = await generateMatchContent(
          event.strHomeTeam,
          event.strAwayTeam,
          event.strLeague,
          event.strVenue || "TBA",
          matchTime.toISOString()
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
        date: targetDate,
        total: events.length,
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
