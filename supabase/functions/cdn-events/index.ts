import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// CDN API endpoints to try - testing various possible paths
const CDN_ENDPOINTS_TO_TRY = [
  'https://api.cdn-live.tv/api/v1/vip/damitv/events/sports/',
  'https://api.cdn-live.tv/api/v1/vip/damitv/events/',
  'https://api.cdn-live.tv/api/v1/damitv/events/',
  'https://api.cdn-live.tv/api/v1/events/',
  'https://api.cdn-live.tv/api/v1/vip/damitv/matches/',
  'https://api.cdn-live.tv/api/v1/vip/damitv/',
  'https://api.cdn-live.tv/api/v1/channels/?user=damitv&plan=vip', // This one works for channels
];

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const testMode = url.searchParams.get('test') === 'true';
    
    console.log('Testing CDN API endpoints...');
    
    const results: Record<string, any> = {};
    
    // Test all endpoints
    for (const endpoint of CDN_ENDPOINTS_TO_TRY) {
      try {
        console.log(`Testing: ${endpoint}`);
        const response = await fetch(endpoint, {
          headers: { 'Accept': 'application/json' }
        });
        
        const status = response.status;
        let data = null;
        let preview = '';
        
        if (response.ok) {
          try {
            data = await response.json();
            preview = JSON.stringify(data).substring(0, 500);
            console.log(`✅ ${endpoint}: ${status} - ${preview.substring(0, 100)}...`);
          } catch {
            const text = await response.text();
            preview = text.substring(0, 200);
            console.log(`✅ ${endpoint}: ${status} - (not JSON) ${preview.substring(0, 100)}...`);
          }
        } else {
          console.log(`❌ ${endpoint}: ${status}`);
        }
        
        results[endpoint] = {
          status,
          ok: response.ok,
          preview: preview.substring(0, 200),
          hasData: !!data,
          dataType: data ? (Array.isArray(data) ? 'array' : typeof data) : null,
          keys: data && typeof data === 'object' && !Array.isArray(data) ? Object.keys(data) : null,
          arrayLength: Array.isArray(data) ? data.length : null
        };
      } catch (error) {
        console.log(`❌ ${endpoint}: Error - ${error.message}`);
        results[endpoint] = { error: error.message };
      }
    }
    
    return new Response(JSON.stringify({
      success: true,
      message: 'API endpoint test results',
      results
    }, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
