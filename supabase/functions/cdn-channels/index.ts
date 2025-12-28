import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Cache for channels
let cachedChannels: any[] = [];
let channelsCacheTimestamp = 0;

// Cache for soccer events
let cachedSoccerEvents: any[] = [];
let soccerCacheTimestamp = 0;

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const endpoint = url.searchParams.get('endpoint') || 'channels';
    const now = Date.now();

    // Handle soccer events endpoint
    if (endpoint === 'soccer-events') {
      // Return cached data if valid
      if (cachedSoccerEvents.length > 0 && (now - soccerCacheTimestamp) < CACHE_TTL) {
        console.log(`⚽ Returning ${cachedSoccerEvents.length} cached soccer events`);
        return new Response(
          JSON.stringify({ events: cachedSoccerEvents, total: cachedSoccerEvents.length, cached: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const SOCCER_API_URL = 'https://api.cdn-live.tv/api/v1/events/sports/soccer/?user=damitv&plan=vip';
      
      console.log('⚽ Fetching soccer events from CDN API:', SOCCER_API_URL);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const response = await fetch(SOCCER_API_URL, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Soccer API returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      console.log('⚽ Raw soccer API response keys:', Object.keys(data));
      
      // Extract events from the nested structure: {"cdn-live-tv": {"Soccer": [...]}}
      let events = [];
      if (data['cdn-live-tv'] && data['cdn-live-tv']['Soccer']) {
        events = data['cdn-live-tv']['Soccer'];
      } else if (Array.isArray(data)) {
        events = data;
      } else if (data.events && Array.isArray(data.events)) {
        events = data.events;
      } else if (data.matches && Array.isArray(data.matches)) {
        events = data.matches;
      } else if (data.data && Array.isArray(data.data)) {
        events = data.data;
      }
      
      // Update cache
      cachedSoccerEvents = events;
      soccerCacheTimestamp = now;
      
      console.log(`⚽ Fetched ${cachedSoccerEvents.length} soccer events successfully`);

      return new Response(
        JSON.stringify({ events: cachedSoccerEvents, total: cachedSoccerEvents.length, cached: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Default: Handle channels endpoint
    // Return cached data if valid
    if (cachedChannels.length > 0 && (now - channelsCacheTimestamp) < CACHE_TTL) {
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
    channelsCacheTimestamp = now;
    
    console.log(`📺 Fetched ${channels.length} channels successfully`);

    return new Response(
      JSON.stringify({ channels, total_channels: channels.length, cached: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('📺 Error fetching CDN data:', error);
    
    // Return cached data on error
    if (cachedChannels.length > 0) {
      return new Response(
        JSON.stringify({ channels: cachedChannels, total_channels: cachedChannels.length, cached: true, fallback: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ error: error.message, channels: [], events: [], total: 0 }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
