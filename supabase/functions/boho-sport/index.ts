import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Working sports streaming API bases
const API_BASES = [
  "https://streamed.su/api",
  "https://embedme.top/api", 
  "https://rfrsh.me/api",
];

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Try fetching from an API base
async function tryFetch(baseUrl: string, endpoint: string): Promise<{ success: boolean; data: any; status: number }> {
  const apiUrl = endpoint ? `${baseUrl}/${endpoint}` : baseUrl;
  console.log(`🔄 Trying: ${apiUrl}`);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(apiUrl, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/html, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
      },
    });

    clearTimeout(timeoutId);

    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch {
        console.log(`⚠️ Non-JSON response from ${apiUrl}`);
        return { success: false, data: { raw: text.substring(0, 200) }, status: response.status };
      }
    }

    // Check if response has valid data
    const hasData = Array.isArray(data) || 
                    (data && (data.matches || data.events || data.data || data.live || data.embedUrl || data.embed));
    
    if (response.ok && hasData) {
      const count = Array.isArray(data) ? data.length : 'object';
      console.log(`✅ Success from ${apiUrl}: ${count} items`);
      return { success: true, data, status: response.status };
    }

    console.log(`⚠️ No valid data from ${apiUrl}`);
    return { success: false, data, status: response.status };
  } catch (error) {
    console.log(`❌ Failed ${apiUrl}: ${error.message}`);
    return { success: false, data: { error: error.message }, status: 500 };
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get endpoint from query params or request body
    const url = new URL(req.url);
    let endpoint = url.searchParams.get('endpoint') || '';
    
    // Also try to get from body if POST
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        endpoint = body.endpoint || endpoint;
      } catch {
        // Ignore JSON parse errors
      }
    }

    console.log(`📡 BOHOSport proxy request - endpoint: "${endpoint}"`);

    // Check if this is a stream request
    const isStreamRequest = endpoint.startsWith('stream/');
    
    if (isStreamRequest) {
      // For stream requests, try each API base with the exact endpoint
      for (const baseUrl of API_BASES) {
        const result = await tryFetch(baseUrl, endpoint);
        if (result.success) {
          console.log(`🎉 Found working stream endpoint: ${baseUrl}/${endpoint}`);
          return new Response(JSON.stringify(result.data), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
      
      // If stream endpoints fail, return empty with embed URL suggestion
      console.log('⚠️ No stream data found, returning default embed');
      const parts = endpoint.split('/');
      const source = parts[1] || 'main';
      const id = parts[2] || 'unknown';
      
      return new Response(JSON.stringify([{
        embedUrl: `https://streamed.su/watch/${id}`,
        source: source,
        id: id,
        streamNo: 1,
        language: 'EN',
        hd: true
      }]), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Endpoints to try for match data
    const endpointsToTry = endpoint ? [endpoint] : [
      'matches/all',
      'matches/live', 
      'matches',
      'events',
      'live',
      'schedule',
    ];

    // Try each API base with each endpoint
    for (const baseUrl of API_BASES) {
      for (const ep of endpointsToTry) {
        const result = await tryFetch(baseUrl, ep);
        
        if (result.success) {
          console.log(`🎉 Found working endpoint: ${baseUrl}/${ep}`);
          return new Response(JSON.stringify(result.data), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
    }

    // If all failed, return error with details
    console.log('❌ All API endpoints failed');
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'All sports API endpoints failed',
        tried: API_BASES.flatMap(b => endpointsToTry.map(e => `${b}/${e}`))
      }),
      { 
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('❌ BOHOSport proxy error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
