import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Enhanced regex patterns to extract HLS URLs from various embed players
const HLS_PATTERNS = [
  // Standard source/file patterns
  /source["\s]*:["\s]*["']([^"']*\.m3u8[^"']*)['"]/gi,
  /src["\s]*:["\s]*["']([^"']*\.m3u8[^"']*)['"]/gi,
  /file["\s]*:["\s]*["']([^"']*\.m3u8[^"']*)['"]/gi,
  /playlist["\s]*:["\s]*["']([^"']*\.m3u8[^"']*)['"]/gi,
  
  // JWPlayer patterns
  /jwplayer\s*\([^)]*\)\s*\.setup\s*\(\s*\{[^}]*file\s*:\s*["']([^"']*\.m3u8[^"']*)['"]/gi,
  /jwplayer\s*\([^)]*\)\s*\.setup\s*\(\s*\{[^}]*sources\s*:\s*\[[^\]]*["']([^"']*\.m3u8[^"']*)['"]/gi,
  
  // Video.js patterns
  /videojs\s*\([^)]*\)[^}]*sources\s*:\s*\[[^\]]*["']([^"']*\.m3u8[^"']*)['"]/gi,
  /videojs\s*\([^)]*\)[^}]*src\s*:\s*["']([^"']*\.m3u8[^"']*)['"]/gi,
  
  // HLS.js patterns
  /hls\.loadSource\s*\(\s*["']([^"']*\.m3u8[^"']*)['"]/gi,
  /new\s+Hls\s*\([^)]*\)[^}]*loadSource\s*\(\s*["']([^"']*\.m3u8[^"']*)['"]/gi,
  
  // Plyr patterns
  /plyr\.source\s*=\s*\{[^}]*src\s*:\s*["']([^"']*\.m3u8[^"']*)['"]/gi,
  /new\s+Plyr\s*\([^)]*\)[^}]*source\s*:\s*["']([^"']*\.m3u8[^"']*)['"]/gi,
  
  // Clappr patterns
  /new\s+Clappr\.Player\s*\([^)]*source\s*:\s*["']([^"']*\.m3u8[^"']*)['"]/gi,
  /new\s+Clappr\s*\([^)]*source\s*:\s*["']([^"']*\.m3u8[^"']*)['"]/gi,
  
  // FlowPlayer patterns
  /flowplayer\s*\([^)]*\)\s*\.\s*load\s*\(\s*["']([^"']*\.m3u8[^"']*)['"]/gi,
  
  // Generic HTML5 video patterns
  /<source[^>]*src=["']([^"']*\.m3u8[^"']*)["'][^>]*>/gi,
  /<video[^>]*src=["']([^"']*\.m3u8[^"']*)["'][^>]*>/gi,
  
  // Variable assignment patterns
  /(?:var|let|const)\s+\w+\s*=\s*["']([^"']*\.m3u8[^"']*)['"]/gi,
  /streamUrl\s*=\s*["']([^"']*\.m3u8[^"']*)['"]/gi,
  /videoUrl\s*=\s*["']([^"']*\.m3u8[^"']*)['"]/gi,
  /hlsUrl\s*=\s*["']([^"']*\.m3u8[^"']*)['"]/gi,
  /m3u8Url\s*=\s*["']([^"']*\.m3u8[^"']*)['"]/gi,
  
  // JSON patterns
  /"(?:url|src|file|stream|source)"\s*:\s*"([^"]*\.m3u8[^"]*)"/gi,
  /'(?:url|src|file|stream|source)'\s*:\s*'([^']*\.m3u8[^']*)'/gi,
  
  // Generic URL patterns (last resort)
  /["']([^"']*\.m3u8(?:\?[^"']*)?)['"]/gi,
  /https?:\/\/[^\s"'<>]*\.m3u8[^\s"'<>]*/gi,
];

// Patterns for base64 encoded URLs
const BASE64_PATTERNS = [
  /atob\s*\(\s*["']([A-Za-z0-9+/=]+)["']\s*\)/g,
  /decodeURIComponent\s*\(\s*escape\s*\(\s*atob\s*\(\s*["']([A-Za-z0-9+/=]+)["']\s*\)/g,
  /["']([A-Za-z0-9+/=]{50,})["']/g, // Long base64 strings
];

// In-memory cache for extracted streams (10 minute TTL)
const extractionCache = new Map<string, { url: string | null; timestamp: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

function getCachedExtraction(embedUrl: string): string | null | undefined {
  const cached = extractionCache.get(embedUrl);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`📦 Cache hit for: ${embedUrl}`);
    return cached.url;
  }
  return undefined;
}

function setCachedExtraction(embedUrl: string, hlsUrl: string | null) {
  extractionCache.set(embedUrl, { url: hlsUrl, timestamp: Date.now() });
}

function decodeBase64(encoded: string): string | null {
  try {
    const decoded = atob(encoded);
    // Check if it looks like a URL
    if (decoded.includes('http') || decoded.includes('.m3u8')) {
      return decoded;
    }
  } catch {
    // Not valid base64
  }
  return null;
}

function makeAbsoluteUrl(url: string, baseUrl: string): string {
  if (!url) return '';
  
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
    // Relative URL
    const base = new URL(baseUrl);
    return new URL(url, base.origin + base.pathname).href;
  } catch {
    return url;
  }
}

function extractHlsUrls(content: string, embedUrl: string): string[] {
  const foundUrls: Set<string> = new Set();
  
  // First, try to decode base64 encoded URLs
  for (const pattern of BASE64_PATTERNS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const decoded = decodeBase64(match[1]);
      if (decoded && decoded.includes('.m3u8')) {
        const absoluteUrl = makeAbsoluteUrl(decoded, embedUrl);
        if (absoluteUrl) {
          foundUrls.add(absoluteUrl);
          console.log(`🔑 Found base64 encoded HLS: ${absoluteUrl}`);
        }
      }
    }
  }
  
  // Then try all HLS patterns
  for (const pattern of HLS_PATTERNS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const url = match[1] || match[0];
      if (url && url.includes('.m3u8') && url.length > 10) {
        // Clean up the URL
        const cleanUrl = url
          .replace(/\\"/g, '"')
          .replace(/\\\//g, '/')
          .replace(/\\u002F/g, '/')
          .trim();
        
        const absoluteUrl = makeAbsoluteUrl(cleanUrl, embedUrl);
        if (absoluteUrl && absoluteUrl.includes('.m3u8')) {
          foundUrls.add(absoluteUrl);
        }
      }
    }
  }
  
  return Array.from(foundUrls);
}

async function fetchEmbedContent(embedUrl: string): Promise<string> {
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  ];
  
  const headers = {
    'User-Agent': userAgents[0],
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Referer': embedUrl,
    'DNT': '1',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
  };
  
  // Try direct fetch first
  try {
    const response = await fetch(embedUrl, {
      headers,
      redirect: 'follow',
    });
    
    if (response.ok) {
      return await response.text();
    }
  } catch (err) {
    console.log(`Direct fetch failed for ${embedUrl}: ${err}`);
  }
  
  // Try with mobile user agent
  try {
    headers['User-Agent'] = userAgents[1];
    const response = await fetch(embedUrl, {
      headers,
      redirect: 'follow',
    });
    
    if (response.ok) {
      return await response.text();
    }
  } catch (err) {
    console.log(`Mobile fetch failed for ${embedUrl}: ${err}`);
  }
  
  throw new Error('Failed to fetch embed content');
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { embedUrl } = await req.json();
    
    if (!embedUrl) {
      return new Response(
        JSON.stringify({ error: 'embedUrl is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`🔍 Extracting HLS from: ${embedUrl}`);
    
    // Check cache first
    const cached = getCachedExtraction(embedUrl);
    if (cached !== undefined) {
      return new Response(
        JSON.stringify({ 
          hlsUrl: cached, 
          cached: true,
          source: 'cache'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // If the URL is already an HLS stream, return it directly
    if (embedUrl.includes('.m3u8')) {
      console.log(`✅ URL is already HLS: ${embedUrl}`);
      setCachedExtraction(embedUrl, embedUrl);
      return new Response(
        JSON.stringify({ 
          hlsUrl: embedUrl, 
          cached: false,
          source: 'direct'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Fetch and parse the embed page
    let content: string;
    try {
      content = await fetchEmbedContent(embedUrl);
    } catch (err) {
      console.error(`❌ Failed to fetch embed: ${err}`);
      setCachedExtraction(embedUrl, null);
      return new Response(
        JSON.stringify({ 
          hlsUrl: null, 
          error: 'Failed to fetch embed page',
          cached: false
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Extract HLS URLs
    const hlsUrls = extractHlsUrls(content, embedUrl);
    
    if (hlsUrls.length > 0) {
      // Return the first (best) HLS URL
      const bestUrl = hlsUrls[0];
      console.log(`✅ Extracted HLS URL: ${bestUrl}`);
      console.log(`📊 Total HLS URLs found: ${hlsUrls.length}`);
      
      setCachedExtraction(embedUrl, bestUrl);
      
      return new Response(
        JSON.stringify({ 
          hlsUrl: bestUrl,
          allUrls: hlsUrls,
          cached: false,
          source: 'extracted'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`❌ No HLS URLs found in: ${embedUrl}`);
    setCachedExtraction(embedUrl, null);
    
    return new Response(
      JSON.stringify({ 
        hlsUrl: null, 
        cached: false,
        source: 'not_found'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('❌ Extraction error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        hlsUrl: null
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
