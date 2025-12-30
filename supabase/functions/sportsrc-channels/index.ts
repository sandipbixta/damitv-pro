import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// SportSRC API base
const SPORTSRC_API = 'https://api.sportsrc.org';

// Cache for channels
let cachedChannels: any[] = [];
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface SportSRCMatch {
  id: string;
  title: string;
  time: number | string;
  category: string;
  poster?: string;
  sources?: any[];
  teams?: {
    home?: { name: string; badge?: string };
    away?: { name: string; badge?: string };
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const now = Date.now();
    
    // Return cached data if valid
    if (cachedChannels.length > 0 && (now - cacheTimestamp) < CACHE_TTL) {
      console.log(`📺 Returning ${cachedChannels.length} cached SportSRC channels`);
      return new Response(
        JSON.stringify({ channels: cachedChannels, total_channels: cachedChannels.length, cached: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch all categories from SportSRC
    console.log('📺 Fetching sports categories from SportSRC...');
    
    const categoriesResponse = await fetch(`${SPORTSRC_API}/?data=sports`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
    });

    let categories: string[] = [];
    if (categoriesResponse.ok) {
      const categoriesData = await categoriesResponse.json();
      if (Array.isArray(categoriesData)) {
        categories = categoriesData.map((c: any) => c.id || c.name || c).filter(Boolean);
      }
    }
    
    // Fallback categories if API doesn't return any
    if (categories.length === 0) {
      categories = ['football', 'basketball', 'cricket', 'tennis', 'fight', 'hockey', 'motorsport'];
    }
    
    console.log(`📺 Found ${categories.length} categories: ${categories.join(', ')}`);

    // Fetch matches from each category and filter for 24/7 channels (time === 0)
    const allChannels: any[] = [];
    
    for (const category of categories) {
      try {
        const matchesUrl = `${SPORTSRC_API}/?data=matches&category=${category}`;
        console.log(`📺 Fetching matches for category: ${category}`);
        
        const matchesResponse = await fetch(matchesUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json',
          },
        });

        if (!matchesResponse.ok) continue;

        const matchesData = await matchesResponse.json();
        let matches: SportSRCMatch[] = [];

        if (Array.isArray(matchesData)) {
          matches = matchesData;
        } else if (matchesData.matches && Array.isArray(matchesData.matches)) {
          matches = matchesData.matches;
        } else if (matchesData.data && Array.isArray(matchesData.data)) {
          matches = matchesData.data;
        }

        // Filter for 24/7 channels (time === 0 or time === "0")
        const channels = matches.filter((m: SportSRCMatch) => {
          const time = typeof m.time === 'string' ? parseInt(m.time, 10) : m.time;
          return time === 0;
        });

        console.log(`📺 Found ${channels.length} 24/7 channels in ${category}`);

        // Transform to channel format
        for (const channel of channels) {
          allChannels.push({
            id: `sportsrc-${channel.id}`,
            name: channel.title,
            title: channel.title,
            code: category,
            country: category.charAt(0).toUpperCase() + category.slice(1),
            category: category,
            image: channel.poster || null,
            logo: channel.poster || null,
            embedUrl: `https://sportsrc.org/embed/${channel.id}`,
            sources: channel.sources || [],
            isLive247: true,
            active: true,
            viewers: 0,
          });
        }
      } catch (error) {
        console.error(`📺 Error fetching ${category} matches:`, error);
      }
    }

    // Update cache
    cachedChannels = allChannels;
    cacheTimestamp = now;
    
    console.log(`📺 Total SportSRC 24/7 channels: ${allChannels.length}`);

    return new Response(
      JSON.stringify({ 
        channels: allChannels, 
        total_channels: allChannels.length, 
        cached: false,
        source: 'sportsrc'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('📺 Error fetching SportSRC channels:', error);
    
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
