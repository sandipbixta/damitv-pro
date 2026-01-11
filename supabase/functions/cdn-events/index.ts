import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// CDN Channels API (this one works!)
const CDN_CHANNELS_API = 'https://api.cdn-live.tv/api/v1/channels/?user=damitv&plan=vip';

interface CDNChannel {
  name: string;
  code: string;
  url: string;
  image: string | null;
  viewers?: number;
}

interface CDNApiResponse {
  total_channels: number;
  channels: CDNChannel[];
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const country = url.searchParams.get('country');
    const search = url.searchParams.get('search');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    
    console.log('Fetching CDN channels...');
    
    const response = await fetch(CDN_CHANNELS_API, {
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) {
      console.error(`CDN API error: ${response.status}`);
      return new Response(JSON.stringify({
        success: false,
        error: `CDN API returned ${response.status}`
      }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const data: CDNApiResponse = await response.json();
    console.log(`Fetched ${data.total_channels} channels`);
    
    let channels = data.channels || [];
    
    // Filter by country if specified
    if (country) {
      channels = channels.filter(ch => 
        ch.code.toLowerCase() === country.toLowerCase()
      );
    }
    
    // Filter by search term if specified
    if (search) {
      const searchLower = search.toLowerCase();
      channels = channels.filter(ch => 
        ch.name.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply limit
    channels = channels.slice(0, limit);
    
    // Transform to a consistent format with IDs and higher viewer counts for popular channels
    const transformedChannels = channels.map((ch, index) => ({
      id: `cdn-${ch.code}-${ch.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      title: ch.name,
      country: ch.code.toUpperCase(),
      embedUrl: ch.url,
      logo: ch.image,
      // Higher viewers for earlier channels (tend to be more popular) + random variation
      viewers: ch.viewers || Math.floor(Math.random() * 8000) + 2000 + Math.max(0, (200 - index) * 30),
      isLive: true,
      sport: 'tv',
    }));
    
    // Sort by viewers (highest first) to show most watched channels
    transformedChannels.sort((a, b) => b.viewers - a.viewers);
    
    return new Response(JSON.stringify({
      success: true,
      total: data.total_channels,
      count: transformedChannels.length,
      channels: transformedChannels
    }), {
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
