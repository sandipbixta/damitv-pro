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
                    (data && (data.matches || data.events || data.data || data.live || data.embedUrl || data.embed || data.sources));
    
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

// Fetch all available streams for a match from multiple providers
async function fetchAllStreamsForMatch(matchId: string, source: string): Promise<any[]> {
  const allStreams: any[] = [];
  const streamEndpoints = [
    `stream/${source}/${matchId}`,
    `streams/${source}/${matchId}`,
    `watch/${source}/${matchId}`,
  ];

  // Try to fetch from each API base
  for (const baseUrl of API_BASES) {
    for (const endpoint of streamEndpoints) {
      const result = await tryFetch(baseUrl, endpoint);
      if (result.success) {
        // Handle different response formats
        let streams = [];
        
        if (Array.isArray(result.data)) {
          streams = result.data;
        } else if (result.data.sources && Array.isArray(result.data.sources)) {
          streams = result.data.sources;
        } else if (result.data.streams && Array.isArray(result.data.streams)) {
          streams = result.data.streams;
        } else if (result.data.embedUrl || result.data.embed) {
          streams = [result.data];
        }
        
        // Add source identifier to each stream
        streams.forEach((stream: any, index: number) => {
          // Avoid duplicates by checking embedUrl
          const embedUrl = stream.embedUrl || stream.embed || stream.url;
          const isDuplicate = allStreams.some(s => 
            (s.embedUrl === embedUrl) || 
            (s.source === stream.source && s.id === stream.id && s.streamNo === stream.streamNo)
          );
          
          if (!isDuplicate && embedUrl) {
            allStreams.push({
              ...stream,
              embedUrl: embedUrl,
              source: stream.source || source,
              id: stream.id || matchId,
              streamNo: stream.streamNo || allStreams.length + 1,
              language: stream.language || stream.lang || 'EN',
              hd: stream.hd !== false,
              apiBase: baseUrl
            });
          }
        });
        
        console.log(`📺 Found ${streams.length} streams from ${baseUrl}/${endpoint}`);
      }
    }
  }
  
  return allStreams;
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
    const fetchAll = url.searchParams.get('fetchAll') === 'true';
    
    // Also try to get from body if POST
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        endpoint = body.endpoint || endpoint;
      } catch {
        // Ignore JSON parse errors
      }
    }

    console.log(`📡 BOHOSport proxy request - endpoint: "${endpoint}", fetchAll: ${fetchAll}`);

    // Check if this is a stream request
    const isStreamRequest = endpoint.startsWith('stream/');
    
    if (isStreamRequest) {
      const parts = endpoint.split('/');
      const source = parts[1] || 'main';
      const id = parts[2] || 'unknown';
      
      // Fetch from all providers to get more stream options
      const allStreams = await fetchAllStreamsForMatch(id, source);
      
      if (allStreams.length > 0) {
        console.log(`🎉 Total unique streams found: ${allStreams.length}`);
        return new Response(JSON.stringify(allStreams), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // Fallback: try each API base with the exact endpoint (original behavior)
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