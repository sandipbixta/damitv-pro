import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const WESTREAM_API = 'https://westream.top';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

interface WeStreamMatch {
  id: string;
  title: string;
  category: string;
  date: number;
  popular: boolean;
  teams?: {
    home?: { name: string; badge?: string };
    away?: { name: string; badge?: string };
  };
  sources: { source: string; id: string }[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Fetching matches from WeStream API...');
    
    const response = await fetch(`${WESTREAM_API}/matches`, {
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`WeStream API returned ${response.status}`);
    }

    const matches: WeStreamMatch[] = await response.json();
    console.log(`Fetched ${matches.length} matches`);

    // Transform to simplified format with stream URLs
    const result = matches.map((match) => {
      // Get the first source to build stream URL
      const firstSource = match.sources?.[0];
      const streamUrl = firstSource 
        ? `${WESTREAM_API}/embed/${firstSource.source}/${firstSource.id}/1`
        : null;

      return {
        id: match.id,
        title: match.title,
        streamUrl,
        time: match.date, // Unix timestamp
      };
    });

    return new Response(JSON.stringify(result), {
      headers: corsHeaders,
    });
  } catch (error) {
    console.error('Error fetching matches:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: corsHeaders }
    );
  }
});
