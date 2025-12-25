import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Multiple M3U8 sources to try
const M3U8_SOURCES = [
  'https://raw.githubusercontent.com/byte-capsule/Starter-Starter-Pro-Sports-M3U8/main/all.m3u8',
  'https://raw.githubusercontent.com/Free-TV/IPTV/master/playlists/playlist_sports.m3u8',
  'https://iptv-org.github.io/iptv/categories/sports.m3u8',
];

interface StreamInfo {
  name: string;
  url: string;
  logo?: string;
  group?: string;
}

function parseM3U8(content: string): StreamInfo[] {
  const lines = content.split('\n');
  const streams: StreamInfo[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith('#EXTINF:')) {
      // Parse the EXTINF line for metadata
      const nameMatch = line.match(/,(.+)$/);
      const logoMatch = line.match(/tvg-logo="([^"]+)"/);
      const groupMatch = line.match(/group-title="([^"]+)"/);
      
      const name = nameMatch ? nameMatch[1].trim() : 'Unknown Channel';
      const logo = logoMatch ? logoMatch[1] : undefined;
      const group = groupMatch ? groupMatch[1] : undefined;
      
      // Next non-empty, non-comment line should be the URL
      for (let j = i + 1; j < lines.length; j++) {
        const urlLine = lines[j].trim();
        if (urlLine && !urlLine.startsWith('#')) {
          if (urlLine.startsWith('http')) {
            streams.push({ name, url: urlLine, logo, group });
          }
          break;
        }
      }
    }
  }
  
  return streams;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Fetching sports streams from multiple sources...');
    
    const allStreams: StreamInfo[] = [];
    const errors: string[] = [];
    
    // Try each source
    for (const source of M3U8_SOURCES) {
      try {
        console.log(`Trying source: ${source}`);
        const response = await fetch(source, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        });
        
        if (response.ok) {
          const content = await response.text();
          const streams = parseM3U8(content);
          console.log(`Found ${streams.length} streams from ${source}`);
          allStreams.push(...streams);
        } else {
          errors.push(`${source}: ${response.status}`);
        }
      } catch (error) {
        console.error(`Error fetching ${source}:`, error);
        errors.push(`${source}: ${error.message}`);
      }
    }
    
    // Filter for sports-related streams and remove duplicates
    const sportsKeywords = ['sport', 'espn', 'fox', 'sky', 'bein', 'dazn', 'nba', 'nfl', 'mlb', 'nhl', 'soccer', 'football', 'tennis', 'golf', 'racing', 'f1', 'ufc', 'wwe', 'cricket', 'rugby'];
    
    const uniqueStreams = allStreams.filter((stream, index, self) => 
      self.findIndex(s => s.url === stream.url) === index
    );
    
    // Prioritize streams with sports keywords in name
    const sortedStreams = uniqueStreams.sort((a, b) => {
      const aIsSports = sportsKeywords.some(kw => a.name.toLowerCase().includes(kw) || (a.group?.toLowerCase().includes(kw)));
      const bIsSports = sportsKeywords.some(kw => b.name.toLowerCase().includes(kw) || (b.group?.toLowerCase().includes(kw)));
      if (aIsSports && !bIsSports) return -1;
      if (!aIsSports && bIsSports) return 1;
      return 0;
    });
    
    console.log(`Total unique streams found: ${sortedStreams.length}`);
    
    return new Response(
      JSON.stringify({
        success: true,
        streams: sortedStreams.slice(0, 100), // Limit to 100 streams
        total: sortedStreams.length,
        sources_tried: M3U8_SOURCES.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in fetch-sports-streams:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
