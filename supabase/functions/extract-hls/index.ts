import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExtractedStream {
  url: string;
  type: 'hls' | 'mp4' | 'unknown';
  quality?: string;
  source?: string;
}

// Enhanced regex patterns for HLS extraction
const HLS_PATTERNS = [
  // Direct m3u8 URLs
  /["']([^"']*\.m3u8[^"']*)['"]/gi,
  
  // JWPlayer configurations
  /file\s*:\s*["']([^"']*\.m3u8[^"']*)['"]/gi,
  /sources\s*:\s*\[\s*\{\s*file\s*:\s*["']([^"']*\.m3u8[^"']*)['"]/gi,
  
  // VideoJS configurations
  /src\s*:\s*["']([^"']*\.m3u8[^"']*)['"]/gi,
  /source\s*:\s*["']([^"']*\.m3u8[^"']*)['"]/gi,
  
  // Generic patterns
  /playlist\s*:\s*["']([^"']*\.m3u8[^"']*)['"]/gi,
  /stream\s*:\s*["']([^"']*\.m3u8[^"']*)['"]/gi,
  /hls\s*:\s*["']([^"']*\.m3u8[^"']*)['"]/gi,
  /hlsUrl\s*:\s*["']([^"']*\.m3u8[^"']*)['"]/gi,
  /manifestUrl\s*:\s*["']([^"']*\.m3u8[^"']*)['"]/gi,
  
  // Encoded patterns (base64)
  /atob\s*\(\s*["']([A-Za-z0-9+/=]+)['"]\s*\)/gi,
  
  // URL in data attributes
  /data-(?:src|stream|hls|video)\s*=\s*["']([^"']*\.m3u8[^"']*)['"]/gi,
  
  // Variable assignments
  /(?:var|let|const)\s+\w+\s*=\s*["']([^"']*\.m3u8[^"']*)['"]/gi,
];

// Patterns for MP4 streams as fallback
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

function extractStreamsFromContent(content: string, baseUrl: string): ExtractedStream[] {
  const streams: ExtractedStream[] = [];
  const foundUrls = new Set<string>();

  // Extract HLS streams
  for (const pattern of HLS_PATTERNS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(content)) !== null) {
      let url = match[1];
      
      // Check if it's a base64 encoded URL
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
          streams.push({
            url: absoluteUrl,
            type: 'hls',
            quality: url.includes('720') ? '720p' : url.includes('1080') ? '1080p' : url.includes('480') ? '480p' : 'auto',
            source: 'regex'
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
            source: 'regex'
          });
        }
      }
    }
  }

  return streams;
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

    // Fetch the page content
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

    // Extract streams
    const streams = extractStreamsFromContent(content, url);
    console.log(`Found ${streams.length} streams`);

    // Also look for iframe sources that might contain streams
    const iframePattern = /<iframe[^>]*src=["']([^"']+)["'][^>]*>/gi;
    const iframes: string[] = [];
    let iframeMatch;
    while ((iframeMatch = iframePattern.exec(content)) !== null) {
      const iframeSrc = makeAbsoluteUrl(iframeMatch[1], url);
      if (!iframeSrc.includes('google') && !iframeSrc.includes('facebook') && !iframeSrc.includes('twitter')) {
        iframes.push(iframeSrc);
      }
    }

    // Try to extract from iframes too (first 3 only to avoid timeout)
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
