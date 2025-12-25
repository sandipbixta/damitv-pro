import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CleanStream {
  id: string;
  name: string;
  url: string;
  logo?: string;
  category: string;
  currentProgram?: string;
  startTime?: string;
  endTime?: string;
  isLive: boolean;
  headers?: Record<string, string>;
}

interface EPGProgram {
  channel: string;
  title: string;
  start: string;
  stop: string;
}

// Parse M3U playlist
function parseM3U(content: string): CleanStream[] {
  const lines = content.split('\n');
  const streams: CleanStream[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith('#EXTINF:')) {
      const nameMatch = line.match(/,(.+)$/);
      const logoMatch = line.match(/tvg-logo="([^"]+)"/);
      const groupMatch = line.match(/group-title="([^"]+)"/);
      const idMatch = line.match(/tvg-id="([^"]+)"/);
      
      const name = nameMatch ? nameMatch[1].trim() : 'Unknown';
      const logo = logoMatch ? logoMatch[1] : undefined;
      const category = groupMatch ? groupMatch[1] : 'Sports';
      const id = idMatch ? idMatch[1] : name.toLowerCase().replace(/\s+/g, '-');
      
      // Find URL
      for (let j = i + 1; j < lines.length; j++) {
        const urlLine = lines[j].trim();
        if (urlLine && !urlLine.startsWith('#')) {
          if (urlLine.startsWith('http')) {
            streams.push({
              id,
              name,
              url: urlLine,
              logo,
              category,
              isLive: true,
              headers: { 'Referer': 'https://cookiewebplay.xyz/' }
            });
          }
          break;
        }
      }
    }
  }
  
  return streams;
}

// Parse simple EPG/XML format
function parseEPG(xmlContent: string): EPGProgram[] {
  const programs: EPGProgram[] = [];
  
  // Simple regex-based parsing for programme elements
  const programmeRegex = /<programme[^>]*start="([^"]+)"[^>]*stop="([^"]+)"[^>]*channel="([^"]+)"[^>]*>[\s\S]*?<title[^>]*>([^<]+)<\/title>[\s\S]*?<\/programme>/gi;
  
  let match;
  while ((match = programmeRegex.exec(xmlContent)) !== null) {
    programs.push({
      start: match[1],
      stop: match[2],
      channel: match[3],
      title: match[4]
    });
  }
  
  return programs;
}

// Check if a program is currently live
function isCurrentlyLive(start: string, stop: string): boolean {
  const now = new Date();
  const startDate = parseEPGDate(start);
  const stopDate = parseEPGDate(stop);
  return now >= startDate && now <= stopDate;
}

// Parse EPG date format (YYYYMMDDHHmmss +0000)
function parseEPGDate(dateStr: string): Date {
  const match = dateStr.match(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/);
  if (match) {
    return new Date(`${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6]}Z`);
  }
  return new Date(dateStr);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔄 Fetching ad-free sports streams with EPG...');
    
    const allStreams: CleanStream[] = [];
    const epgPrograms: EPGProgram[] = [];
    
    // Fetch AbbaSport M3U (ad-free streams)
    try {
      console.log('📡 Fetching AbbaSport M3U...');
      const m3uRes = await fetch('https://raw.githubusercontent.com/konanda-sg/abbasport-m3u/main/output/abbasport.m3u', {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      });
      
      if (m3uRes.ok) {
        const content = await m3uRes.text();
        const streams = parseM3U(content);
        console.log(`✅ AbbaSport: ${streams.length} streams`);
        allStreams.push(...streams);
      }
    } catch (e) {
      console.error('AbbaSport M3U error:', e);
    }

    // Fetch AbbaSport EPG (schedule data)
    try {
      console.log('📡 Fetching AbbaSport EPG...');
      const epgRes = await fetch('https://raw.githubusercontent.com/konanda-sg/abbasport-m3u/main/output/epg.xml', {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      
      if (epgRes.ok) {
        const epgContent = await epgRes.text();
        const programs = parseEPG(epgContent);
        console.log(`✅ EPG: ${programs.length} programs`);
        epgPrograms.push(...programs);
      }
    } catch (e) {
      console.error('EPG fetch error:', e);
    }

    // Fetch IPTV-org sports (backup, also ad-free)
    try {
      console.log('📡 Fetching IPTV-org sports...');
      const iptvRes = await fetch('https://iptv-org.github.io/iptv/categories/sports.m3u', {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      
      if (iptvRes.ok) {
        const content = await iptvRes.text();
        const streams = parseM3U(content);
        // Only add unique streams
        const existingUrls = new Set(allStreams.map(s => s.url));
        const newStreams = streams.filter(s => !existingUrls.has(s.url));
        console.log(`✅ IPTV-org: ${newStreams.length} new streams`);
        allStreams.push(...newStreams);
      }
    } catch (e) {
      console.error('IPTV-org error:', e);
    }

    // Match EPG programs to streams
    const now = new Date();
    for (const stream of allStreams) {
      const matchingProgram = epgPrograms.find(p => {
        const channelMatch = p.channel.toLowerCase().includes(stream.id.toLowerCase()) ||
                            stream.name.toLowerCase().includes(p.channel.toLowerCase());
        return channelMatch && isCurrentlyLive(p.start, p.stop);
      });
      
      if (matchingProgram) {
        stream.currentProgram = matchingProgram.title;
        stream.startTime = parseEPGDate(matchingProgram.start).toISOString();
        stream.endTime = parseEPGDate(matchingProgram.stop).toISOString();
      }
    }

    // Sort: streams with current programs first
    allStreams.sort((a, b) => {
      if (a.currentProgram && !b.currentProgram) return -1;
      if (!a.currentProgram && b.currentProgram) return 1;
      return a.name.localeCompare(b.name);
    });

    // Filter sports-related streams
    const sportsKeywords = ['sport', 'espn', 'fox', 'sky', 'bein', 'dazn', 'nba', 'nfl', 'mlb', 'soccer', 'football', 'tennis', 'cricket', 'rugby', 'f1', 'racing', 'golf', 'ufc', 'wwe', 'boxing', 'hockey', 'tnt', 'usa network', 'nbcsn'];
    
    const sportsStreams = allStreams.filter(s => 
      sportsKeywords.some(kw => 
        s.name.toLowerCase().includes(kw) || 
        s.category.toLowerCase().includes(kw) ||
        (s.currentProgram?.toLowerCase().includes(kw))
      )
    );

    console.log(`📊 Total sports streams: ${sportsStreams.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        streams: sportsStreams.slice(0, 100),
        total: sportsStreams.length,
        epgCount: epgPrograms.length,
        lastUpdated: now.toISOString()
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
