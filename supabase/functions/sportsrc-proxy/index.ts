import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

type SportsRCData = "sports" | "matches" | "detail" | "results";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);

    const urlParams = {
      data: url.searchParams.get("data") ?? undefined,
      category: url.searchParams.get("category") ?? undefined,
      id: url.searchParams.get("id") ?? undefined,
      league: url.searchParams.get("league") ?? undefined,
    };

    let bodyParams: Record<string, unknown> = {};
    if (req.method !== "GET") {
      const raw = await req.text();
      if (raw) {
        try {
          bodyParams = JSON.parse(raw);
        } catch {
          bodyParams = {};
        }
      }
    }

    const merged = {
      ...urlParams,
      ...(bodyParams as Record<string, unknown>),
    } as {
      data?: string;
      category?: string;
      id?: string;
      league?: string;
    };

    const data = merged.data as SportsRCData | undefined;

    if (!data) {
      return jsonResponse({ success: false, error: "Missing 'data' parameter" }, 400);
    }

    const allowed: SportsRCData[] = ["sports", "matches", "detail", "results"];
    if (!allowed.includes(data)) {
      return jsonResponse(
        {
          success: false,
          error: `Invalid 'data' parameter. Allowed: ${allowed.join(", ")}`,
        },
        400,
      );
    }

    if ((data === "matches" || data === "detail") && !merged.category) {
      return jsonResponse({ success: false, error: "Missing 'category' parameter" }, 400);
    }

    if (data === "detail" && !merged.id) {
      return jsonResponse({ success: false, error: "Missing 'id' parameter" }, 400);
    }

    // For results: category can be leagues|tables|scores. league is required for tables/scores.
    if (data === "results" && (merged.category === "tables" || merged.category === "scores") && !merged.league) {
      return jsonResponse(
        { success: false, error: "Missing 'league' parameter (required for tables/scores)" },
        400,
      );
    }

    const upstream = new URL("https://api.sportsrc.org/");
    upstream.searchParams.set("data", data);
    if (merged.category) upstream.searchParams.set("category", merged.category);
    if (merged.id) upstream.searchParams.set("id", merged.id);
    if (merged.league) upstream.searchParams.set("league", merged.league);

    console.log("🔁 sportsrc-proxy ->", upstream.toString());

    const upstreamRes = await fetch(upstream.toString(), {
      headers: {
        Accept: "application/json, text/plain, */*",
        "User-Agent": "LovableSportsRCProxy/1.0",
      },
      redirect: "follow",
    });

    const upstreamText = await upstreamRes.text();
    let parsed: unknown = upstreamText;
    try {
      parsed = JSON.parse(upstreamText);
    } catch {
      // keep text
    }

    if (!upstreamRes.ok) {
      return jsonResponse(
        {
          success: false,
          error: `Upstream HTTP ${upstreamRes.status}`,
          upstream: {
            status: upstreamRes.status,
            statusText: upstreamRes.statusText,
            body: parsed,
          },
        },
        upstreamRes.status,
      );
    }

    return jsonResponse({
      success: true,
      data: parsed,
      upstream: {
        status: upstreamRes.status,
      },
    });
  } catch (error) {
    console.error("❌ sportsrc-proxy error:", error);
    return jsonResponse(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      500,
    );
  }
});
