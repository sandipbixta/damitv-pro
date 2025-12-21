import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MatchInfo {
  title?: string;
  teams?: string[];
  league?: string;
  time?: string;
  status?: string;
}

interface ExtractedStream {
  url: string;
  type: 'hls' | 'mp4' | 'unknown';
  quality?: string;
  source?: string;
  matchInfo?: MatchInfo;
}

// Enhanced regex patterns for HLS extraction
const HLS_PATTERNS = [
  /["']([^"']*\.m3u8[^"']*)['"]/gi,
  /file\s*:\s*["']([^"']*\.m3u8[^"']*)['"]/gi,
  /sources\s*:\s*\[\s*\{\s*file\s*:\s*["']([^"']*\.m3u8[^"']*)['"]/gi,
  /src\s*:\s*["']([^"']*\.m3u8[^"']*)['"]/gi,
  /source\s*:\s*["']([^"']*\.m3u8[^"']*)['"]/gi,
  /playlist\s*:\s*["']([^"']*\.m3u8[^"']*)['"]/gi,
  /stream\s*:\s*["']([^"']*\.m3u8[^"']*)['"]/gi,
  /hls\s*:\s*["']([^"']*\.m3u8[^"']*)['"]/gi,
  /hlsUrl\s*:\s*["']([^"']*\.m3u8[^"']*)['"]/gi,
  /manifestUrl\s*:\s*["']([^"']*\.m3u8[^"']*)['"]/gi,
  /atob\s*\(\s*["']([A-Za-z0-9+/=]+)['"]\s*\)/gi,
  /data-(?:src|stream|hls|video)\s*=\s*["']([^"']*\.m3u8[^"']*)['"]/gi,
  /(?:var|let|const)\s+\w+\s*=\s*["']([^"']*\.m3u8[^"']*)['"]/gi,
];

const MP4_PATTERNS = [
  /["']([^"']*\.mp4[^"']*)['"]/gi,
  /file\s*:\s*["']([^"']*\.mp4[^"']*)['"]/gi,
  /src\s*:\s*["']([^"']*\.mp4[^"']*)['"]/gi,
];

function decodeBase64Url(encoded: string): string | null {
  try {
    const decoded = atob(encoded);
    if (decoded.includes('.m3u8') || decoded.includes('.mp4')) {
      return decoded;
    }
    return null;
  } catch {
    return null;
  }
}

function makeAbsoluteUrl(url: string, baseUrl: string): string {
  try {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    if (url.startsWith('//')) {
      return 'https:' + url;
    }
    if (url.startsWith('/')) {
      const base = new URL(baseUrl);
      return base.origin + url;
    }
    const base = new URL(baseUrl);
    return base.origin + '/' + url;
  } catch {
    return url;
  }
}

// Extract match information from the page
function extractMatchesFromPage(content: string): Map<string, MatchInfo> {
  const matches = new Map<string, MatchInfo>();
  
  // Pattern 1: Match cards with data attributes
  const cardPattern = /<(?:div|article|section)[^>]*class=["'][^"']*(?:match|event|game|fixture)[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|article|section)>/gi;
  
  // Pattern 2: Look for match titles near stream URLs
  const titlePatterns = [
    /<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi,
    /<(?:span|div|p)[^>]*class=["'][^"']*(?:title|name|team|match)[^"']*["'][^>]*>(.*?)<\/(?:span|div|p)>/gi,
    /data-title=["']([^"']+)["']/gi,
    /data-match=["']([^"']+)["']/gi,
  ];
  
  // Pattern 3: Team names (common patterns)
  const teamPattern = /(?:^|\s)([A-Z][a-zA-Z\s]+(?:\s(?:FC|United|City|Athletic|CF|SC|AC|AS|SS|Real|Atletico|Inter|Juventus|Bayern|Borussia|Paris|Manchester|Liverpool|Chelsea|Arsenal|Tottenham|Barcelona|Madrid))?)\s*(?:vs?\.?|[-–—]|\svs\s)\s*([A-Z][a-zA-Z\s]+(?:\s(?:FC|United|City|Athletic|CF|SC|AC|AS|SS|Real|Atletico|Inter|Juventus|Bayern|Borussia|Paris|Manchester|Liverpool|Chelsea|Arsenal|Tottenham|Barcelona|Madrid))?)/gi;
  
  // Pattern 4: Time patterns
  const timePattern = /(\d{1,2}:\d{2}(?:\s*(?:AM|PM|am|pm))?)/g;
  
  // Pattern 5: Status patterns
  const statusPattern = /\b(LIVE|Live|live|UPCOMING|Upcoming|FINISHED|FT|HT|1H|2H)\b/g;

  // Extract from JSON data in scripts
  const jsonPattern = /<script[^>]*>([\s\S]*?)<\/script>/gi;
  let scriptMatch;
  while ((scriptMatch = jsonPattern.exec(content)) !== null) {
    const scriptContent = scriptMatch[1];
    
    // Look for match data objects
    const matchDataPattern = /["']?(?:match|event|game|fixture)["']?\s*:\s*\{([^}]+)\}/gi;
    let dataMatch;
    while ((dataMatch = matchDataPattern.exec(scriptContent)) !== null) {
      const matchData = dataMatch[1];
      
      // Extract stream URL from this context
      const urlMatch = /["']?(?:url|stream|hls|source|file)["']?\s*:\s*["']([^"']+\.m3u8[^"']*)["']/i.exec(matchData);
      if (urlMatch) {
        const streamUrl = urlMatch[1];
        const info: MatchInfo = {};
        
        // Extract title
        const titleMatch = /["']?(?:title|name)["']?\s*:\s*["']([^"']+)["']/i.exec(matchData);
        if (titleMatch) info.title = titleMatch[1];
        
        // Extract teams
        const homeMatch = /["']?(?:home|team1|homeTeam)["']?\s*:\s*["']([^"']+)["']/i.exec(matchData);
        const awayMatch = /["']?(?:away|team2|awayTeam)["']?\s*:\s*["']([^"']+)["']/i.exec(matchData);
        if (homeMatch && awayMatch) {
          info.teams = [homeMatch[1], awayMatch[1]];
        }
        
        // Extract league
        const leagueMatch = /["']?(?:league|competition|tournament)["']?\s*:\s*["']([^"']+)["']/i.exec(matchData);
        if (leagueMatch) info.league = leagueMatch[1];
        
        matches.set(streamUrl, info);
      }
    }
  }

  // Also try to extract from HTML structure
  const matchBlocks = content.match(/<(?:div|li|article)[^>]*class=["'][^"']*(?:match|event|stream|channel)[^"']*["'][^>]*>[\s\S]*?<\/(?:div|li|article)>/gi) || [];
  
  for (const block of matchBlocks) {
    // Find stream URL in this block
    const urlMatch = /["']([^"']*\.m3u8[^"']*)["']/i.exec(block);
    if (!urlMatch) continue;
    
    const streamUrl = urlMatch[1];
    const info: MatchInfo = {};
    
    // Extract title from headings
    const headingMatch = /<h[1-6][^>]*>(.*?)<\/h[1-6]>/i.exec(block);
    if (headingMatch) {
      info.title = headingMatch[1].replace(/<[^>]+>/g, '').trim();
    }
    
    // Extract team names
    const teamsMatch = teamPattern.exec(block.replace(/<[^>]+>/g, ' '));
    if (teamsMatch) {
      info.teams = [teamsMatch[1].trim(), teamsMatch[2].trim()];
    }
    
    // Extract time
    const timeMatch = timePattern.exec(block);
    if (timeMatch) {
      info.time = timeMatch[1];
    }
    
    // Extract status
    const statusMatch = statusPattern.exec(block);
    if (statusMatch) {
      info.status = statusMatch[1];
    }
    
    if (Object.keys(info).length > 0) {
      matches.set(streamUrl, info);
    }
  }

  return matches;
}

function extractStreamsFromContent(content: string, baseUrl: string): ExtractedStream[] {
  const streams: ExtractedStream[] = [];
  const foundUrls = new Set<string>();
  
  // First, extract match info from the page
  const matchInfoMap = extractMatchesFromPage(content);

  // Extract HLS streams
  for (const pattern of HLS_PATTERNS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(content)) !== null) {
      let url = match[1];
      
      if (pattern.source.includes('atob')) {
        const decoded = decodeBase64Url(url);
        if (decoded) {
          url = decoded;
        } else {
          continue;
        }
      }
      
      if (url && url.length > 5 && !foundUrls.has(url)) {
        const absoluteUrl = makeAbsoluteUrl(url, baseUrl);
        if (absoluteUrl.includes('.m3u8')) {
          foundUrls.add(absoluteUrl);
          
          // Try to find match info for this URL
          let matchInfo = matchInfoMap.get(url) || matchInfoMap.get(absoluteUrl);
          
          // If no direct match, try to infer from URL path
          if (!matchInfo) {
            matchInfo = inferMatchInfoFromUrl(absoluteUrl);
          }
          
          streams.push({
            url: absoluteUrl,
            type: 'hls',
            quality: url.includes('720') ? '720p' : url.includes('1080') ? '1080p' : url.includes('480') ? '480p' : 'auto',
            source: 'regex',
            matchInfo,
          });
        }
      }
    }
  }

  // Extract MP4 streams as fallback
  for (const pattern of MP4_PATTERNS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const url = match[1];
      if (url && url.length > 5 && !foundUrls.has(url)) {
        const absoluteUrl = makeAbsoluteUrl(url, baseUrl);
        if (absoluteUrl.includes('.mp4') && !absoluteUrl.includes('placeholder')) {
          foundUrls.add(absoluteUrl);
          streams.push({
            url: absoluteUrl,
            type: 'mp4',
            quality: url.includes('720') ? '720p' : url.includes('1080') ? '1080p' : 'auto',
            source: 'regex',
          });
        }
      }
    }
  }

  return streams;
}

// Infer match info from URL patterns
function inferMatchInfoFromUrl(url: string): MatchInfo | undefined {
  try {
    const urlPath = new URL(url).pathname.toLowerCase();
    const info: MatchInfo = {};
    
    // Common channel/stream identifiers
    const channelPatterns: Record<string, string> = {
      'football': 'Football',
      'soccer': 'Football',
      'bsy': 'Sports Channel',
      'device': 'Live Stream',
      'nba': 'NBA Basketball',
      'nfl': 'NFL Football',
      'premier': 'Premier League',
      'laliga': 'La Liga',
      'bundesliga': 'Bundesliga',
      'seriea': 'Serie A',
      'champions': 'Champions League',
      'ufc': 'UFC',
      'boxing': 'Boxing',
      'cricket': 'Cricket',
      'tennis': 'Tennis',
    };
    
    for (const [key, value] of Object.entries(channelPatterns)) {
      if (urlPath.includes(key)) {
        info.league = value;
        break;
      }
    }
    
    // Extract channel number if present
    const channelNum = urlPath.match(/(\d+)/);
    if (channelNum) {
      info.title = `Channel ${channelNum[1]}`;
    }
    
    return Object.keys(info).length > 0 ? info : undefined;
  } catch {
    return undefined;
  }
}

async function fetchWithTimeout(url: string, timeout = 10000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': url,
      },
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Extracting HLS from:', url);

    const response = await fetchWithTimeout(url);
    
    if (!response.ok) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to fetch page: ${response.status} ${response.statusText}` 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const content = await response.text();
    console.log(`Fetched ${content.length} bytes from ${url}`);

    const streams = extractStreamsFromContent(content, url);
    console.log(`Found ${streams.length} streams`);

    // Also look for iframe sources
    const iframePattern = /<iframe[^>]*src=["']([^"']+)["'][^>]*>/gi;
    const iframes: string[] = [];
    let iframeMatch;
    while ((iframeMatch = iframePattern.exec(content)) !== null) {
      const iframeSrc = makeAbsoluteUrl(iframeMatch[1], url);
      if (!iframeSrc.includes('google') && !iframeSrc.includes('facebook') && !iframeSrc.includes('twitter')) {
        iframes.push(iframeSrc);
      }
    }

    // Try to extract from iframes too (first 3 only)
    for (const iframeSrc of iframes.slice(0, 3)) {
      try {
        console.log('Checking iframe:', iframeSrc);
        const iframeResponse = await fetchWithTimeout(iframeSrc, 5000);
        if (iframeResponse.ok) {
          const iframeContent = await iframeResponse.text();
          const iframeStreams = extractStreamsFromContent(iframeContent, iframeSrc);
          for (const stream of iframeStreams) {
            stream.source = 'iframe: ' + new URL(iframeSrc).hostname;
            if (!streams.find(s => s.url === stream.url)) {
              streams.push(stream);
            }
          }
        }
      } catch (e) {
        console.log('Failed to fetch iframe:', iframeSrc);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        streams,
        iframes,
        pageLength: content.length,
        message: streams.length > 0 ? `Found ${streams.length} stream(s)` : 'No streams found. The page may use JavaScript to load streams dynamically.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error extracting HLS:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to extract streams' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});