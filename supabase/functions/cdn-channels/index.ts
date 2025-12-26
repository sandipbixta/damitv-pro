import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Cache for channels
let cachedChannels: any[] = [];
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const now = Date.now();
    
    // Return cached data if valid
    if (cachedChannels.length > 0 && (now - cacheTimestamp) < CACHE_TTL) {
      console.log(`📺 Returning ${cachedChannels.length} cached channels`);
      return new Response(
        JSON.stringify({ channels: cachedChannels, total_channels: cachedChannels.length, cached: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Updated API URL with correct format
    const CDN_API_URL = 'https://api.cdn-live.tv/api/v1/channels/?user=damitv&plan=vip';
    
    console.log('📺 Fetching channels from CDN API:', CDN_API_URL);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
    
    const response = await fetch(CDN_API_URL, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`CDN API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Map channels to consistent format
    const channels = (data.channels || []).map((ch: any) => ({
      id: `${ch.name.toLowerCase().replace(/\s+/g, '-')}-${ch.code}`,
      name: ch.name,
      code: ch.code,
      url: ch.url,
      image: ch.image,
      logo: ch.image,
      active: ch.active,
      viewers: ch.viewers || 0,
    }));
    
    // Update cache
    cachedChannels = channels;
    cacheTimestamp = now;
    
    console.log(`📺 Fetched ${channels.length} channels successfully`);

    return new Response(
      JSON.stringify({ channels, total_channels: channels.length, cached: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('📺 Error fetching CDN channels:', error);
    
    // Return cached data on error
    if (cachedChannels.length > 0) {
      return new Response(
        JSON.stringify({ channels: cachedChannels, total_channels: cachedChannels.length, cached: true, fallback: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ error: error.message, channels: [], total_channels: 0 }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});