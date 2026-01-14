import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");

interface PerplexityRequest {
  type: "live" | "fixtures" | "standings" | "news";
}

const schemas = {
  live: {
    type: "json_schema",
    json_schema: {
      name: "live_scores",
      schema: {
        type: "object",
        properties: {
          matches: {
            type: "array",
            items: {
              type: "object",
              properties: {
                comp: { type: "string" },
                match: { type: "string" },
                score: { type: "string" },
                time: { type: "string" },
                status: { type: "string" },
                venue: { type: "string" }
              },
              required: ["comp", "match", "score", "time", "status", "venue"],
              additionalProperties: false
            }
          }
        },
        required: ["matches"],
        additionalProperties: false
      }
    }
  },
  fixtures: {
    type: "json_schema",
    json_schema: {
      name: "fixtures",
      schema: {
        type: "object",
        properties: {
          fixtures: {
            type: "array",
            items: {
              type: "object",
              properties: {
                comp: { type: "string" },
                teams: { type: "string" },
                kickoff: { type: "string" },
                status: { type: "string" }
              },
              required: ["comp", "teams", "kickoff", "status"],
              additionalProperties: false
            }
          }
        },
        required: ["fixtures"],
        additionalProperties: false
      }
    }
  },
  standings: {
    type: "json_schema",
    json_schema: {
      name: "standings",
      schema: {
        type: "object",
        properties: {
          standings: {
            type: "array",
            items: {
              type: "object",
              properties: {
                pos: { type: "number" },
                team: { type: "string" },
                pld: { type: "number" },
                w: { type: "number" },
                d: { type: "number" },
                l: { type: "number" },
                gf: { type: "number" },
                ga: { type: "number" },
                pts: { type: "number" }
              },
              required: ["pos", "team", "pld", "w", "d", "l", "gf", "ga", "pts"],
              additionalProperties: false
            }
          }
        },
        required: ["standings"],
        additionalProperties: false
      }
    }
  },
  news: {
    type: "json_schema",
    json_schema: {
      name: "news",
      schema: {
        type: "object",
        properties: {
          articles: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                summary: { type: "string" },
                url: { type: "string" }
              },
              required: ["title", "summary", "url"],
              additionalProperties: false
            }
          }
        },
        required: ["articles"],
        additionalProperties: false
      }
    }
  }
};

const prompts = {
  live: "Get the latest 5 live or recently completed sports matches in Australia right now, prioritizing A-League, AFL, EPL matches involving Australian interest, and cricket. Include competition name, team names (formatted as 'Team A vs Team B'), current score, match time/minute, status (LIVE/FT/HT), and venue. If no live matches, include most recent completed matches from today.",
  fixtures: "Get the next 5 upcoming sports fixtures in Australia for the next 24 hours in AEDT timezone, prioritizing A-League, AFL, EPL, and cricket. Include competition, teams (formatted as 'Team A vs Team B'), kickoff time in AEDT (format: 'HH:MM AEDT'), and status (Scheduled/Upcoming).",
  standings: "Get the current A-League Men's 2024-25 season standings table for the top 8 teams. Include position, team name, matches played, wins, draws, losses, goals for, goals against, and points.",
  news: "Get the top 3 Australian sports news headlines from today, focusing on A-League, AFL, cricket, or EPL news relevant to Australian fans. Include headline title, brief 1-2 sentence summary, and source URL."
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!PERPLEXITY_API_KEY) {
      throw new Error("PERPLEXITY_API_KEY is not configured");
    }

    const { type } = await req.json() as PerplexityRequest;

    if (!type || !schemas[type]) {
      throw new Error("Invalid request type");
    }

    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar-pro",
        messages: [
          {
            role: "system",
            content: "You are a sports data expert. Respond ONLY with valid JSON matching the exact schema provided. Use real-time web data for Australian sports (A-League ID=148, AFL, cricket, EPL). Provide accurate scores, fixtures, and standings. All times should be in AEDT (Australian Eastern Daylight Time). Current date context: " + new Date().toISOString()
          },
          {
            role: "user",
            content: prompts[type]
          }
        ],
        response_format: schemas[type],
        temperature: 0.1,
        max_tokens: 2000
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Perplexity API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error("No content in response");
    }

    const parsedContent = JSON.parse(content);

    return new Response(JSON.stringify({ 
      data: parsedContent,
      citations: data.citations || []
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Sports dashboard error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
