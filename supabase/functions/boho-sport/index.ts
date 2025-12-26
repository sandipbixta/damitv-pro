import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const BOHO_API = "https://streamapi.cc/sport";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    
    const apiUrl = endpoint ? `${BOHO_API}/${endpoint}` : BOHO_API;
    
    console.log('🔄 Fetching BOHOSport:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/html, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://streamapi.cc/',
        'Origin': 'https://streamapi.cc',
      },
    });

    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      // Try to parse as JSON anyway
      try {
        data = JSON.parse(text);
      } catch {
        data = { raw: text, success: false };
      }
    }
    
    console.log('✅ BOHOSport response status:', response.status);
    console.log('📦 BOHOSport data type:', typeof data);
    console.log('📦 BOHOSport data preview:', JSON.stringify(data).substring(0, 500));

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
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
