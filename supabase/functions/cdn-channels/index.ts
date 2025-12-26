import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const CDN_API_URL = 'https://api.cdn-live.tv/api/v1/vip/damitv/channels/';
    
    console.log('📺 Fetching channels from CDN API');
    
    const response = await fetch(CDN_API_URL, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`CDN API returned ${response.status}`);
    }

    const data = await response.json();
    
    console.log(`📺 Fetched ${data.total_channels || 0} channels`);

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('📺 Error fetching CDN channels:', error);
    return new Response(
      JSON.stringify({ error: error.message, channels: [], total_channels: 0 }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});