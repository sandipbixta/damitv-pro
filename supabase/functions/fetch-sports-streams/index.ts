import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StreamInfo {
  name: string;
  url: string;
  logo?: string;
  group?: string;
  headers?: Record<string, string>;
}

// Parse M3U/M3U8 playlist format
function parseM3U(content: string): StreamInfo[] {
  const lines = content.split('\n');
  const streams: StreamInfo[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith('#EXTINF:')) {
      const nameMatch = line.match(/,(.+)$/);
      const logoMatch = line.match(/tvg-logo="([^"]+)"/);
      const groupMatch = line.match(/group-title="([^"]+)"/);
      
      const name = nameMatch ? nameMatch[1].trim() : 'Unknown Channel';
      const logo = logoMatch ? logoMatch[1] : undefined;
      const group = groupMatch ? groupMatch[1] : undefined;
      
      // Find the URL line
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

// Parse TSports/FanCode JSON format
function parseJsonStreams(data: any[]): StreamInfo[] {
  return data.map(item => ({
    name: item.name || item.channel_name || 'Live Stream',
    url: item.url || item.m3u8_url || item.link,
    logo: item.logo || item.icon,
    group: item.category || item.group || 'Sports',
    headers: item.headers || undefined,
  })).filter(s => s.url);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔄 Fetching sports streams from multiple sources...');
    
    const allStreams: StreamInfo[] = [];
    const errors: string[] = [];

    // Source 1: IPTV-org Sports (most reliable)
    try {
      console.log('📡 Fetching from IPTV-org...');
      const res = await fetch('https://iptv-org.github.io/iptv/categories/sports.m3u', {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      });
      if (res.ok) {
        const content = await res.text();
        const streams = parseM3U(content);
        console.log(`✅ IPTV-org: ${streams.length} streams`);
        allStreams.push(...streams);
      }
    } catch (e) {
      console.error('IPTV-org error:', e);
      errors.push('IPTV-org failed');
    }

    // Source 2: TSports Grabber (JSON with headers)
    try {
      console.log('📡 Fetching from TSports...');
      const res = await fetch('https://raw.githubusercontent.com/byte-capsule/TSports-m3u8-Grabber/main/TSports_m3u8_headers.Json', {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });
      if (res.ok) {
        const data = await res.json();
        const streams = parseJsonStreams(data);
        console.log(`✅ TSports: ${streams.length} streams`);
        allStreams.push(...streams);
      }
    } catch (e) {
      console.error('TSports error:', e);
      errors.push('TSports failed');
    }

    // Source 3: FanCode (JSON with headers)
    try {
      console.log('📡 Fetching from FanCode...');
      const res = await fetch('https://raw.githubusercontent.com/byte-capsule/FanCode-Hls-Fetcher/main/Fancode_hls_m3u8.Json', {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });
      if (res.ok) {
        const data = await res.json();
        const streams = parseJsonStreams(data);
        console.log(`✅ FanCode: ${streams.length} streams`);
        allStreams.push(...streams);
      }
    } catch (e) {
      console.error('FanCode error:', e);
      errors.push('FanCode failed');
    }

    // Source 4: AbbaSport M3U
    try {
      console.log('📡 Fetching from AbbaSport...');
      const res = await fetch('https://raw.githubusercontent.com/konanda-sg/abbasport-m3u/refs/heads/main/output/abbasport.m3u', {
        headers: { 
          'User-Agent': 'Mozilla/5.0',
          'Referer': 'https://cookiewebplay.xyz/'
        },
      });
      if (res.ok) {
        const content = await res.text();
        const streams = parseM3U(content);
        // Add referer header requirement to these streams
        streams.forEach(s => {
          s.headers = { 'Referer': 'https://cookiewebplay.xyz/' };
        });
        console.log(`✅ AbbaSport: ${streams.length} streams`);
        allStreams.push(...streams);
      }
    } catch (e) {
      console.error('AbbaSport error:', e);
      errors.push('AbbaSport failed');
    }

    // Source 5: Free-TV IPTV sports
    try {
      console.log('📡 Fetching from Free-TV...');
      const res = await fetch('https://raw.githubusercontent.com/Free-TV/IPTV/master/playlists/playlist_sports.m3u8', {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });
      if (res.ok) {
        const content = await res.text();
        const streams = parseM3U(content);
        console.log(`✅ Free-TV: ${streams.length} streams`);
        allStreams.push(...streams);
      }
    } catch (e) {
      console.error('Free-TV error:', e);
      errors.push('Free-TV failed');
    }

    // Remove duplicates by URL
    const uniqueStreams = allStreams.filter((stream, index, self) =>
      index === self.findIndex(s => s.url === stream.url)
    );

    // Sort: prioritize sports keywords
    const sportsKeywords = ['sport', 'espn', 'fox', 'sky', 'bein', 'dazn', 'nba', 'nfl', 'mlb', 'nhl', 'soccer', 'football', 'tennis', 'golf', 'f1', 'ufc', 'wwe', 'cricket', 'rugby', 'tsports', 'fancode', 'live'];
    
    uniqueStreams.sort((a, b) => {
      const aScore = sportsKeywords.filter(kw => a.name.toLowerCase().includes(kw)).length;
      const bScore = sportsKeywords.filter(kw => b.name.toLowerCase().includes(kw)).length;
      return bScore - aScore;
    });

    console.log(`📊 Total unique streams: ${uniqueStreams.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        streams: uniqueStreams.slice(0, 150),
        total: uniqueStreams.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Fatal error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
