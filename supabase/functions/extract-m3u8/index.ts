import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mobile User-Agent to get mobile-optimized streams
const MOBILE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1';

interface ExtractedStream {
  url: string;
  type: string;
  quality?: string;
  referer?: string;
}

// Decode Base64 if encoded
function tryBase64Decode(str: string): string {
  try {
    // Check if it looks like base64
    if (/^[A-Za-z0-9+/=]+$/.test(str) && str.length > 20) {
      const decoded = atob(str);
      // Check if decoded looks like a URL
      if (decoded.startsWith('http') || decoded.includes('.m3u8')) {
        return decoded;
      }
    }
  } catch {
    // Not base64
  }
  return str;
}

// Extract all stream URLs from page content
function extractStreams(html: string, pageUrl: string): ExtractedStream[] {
  const streams: ExtractedStream[] = [];
  const seenUrls = new Set<string>();

  // Patterns for finding m3u8/stream URLs
  const patterns = [
    // Direct m3u8 URLs
    /["']([^"']*\.m3u8[^"']*)['"]/gi,
    // HLS source patterns
    /source\s*[:=]\s*["']([^"']+)['"]/gi,
    /file\s*[:=]\s*["']([^"']+)['"]/gi,
    /src\s*[:=]\s*["']([^"']+)['"]/gi,
    // Video element sources
    /<source[^>]+src=["']([^"']+)/gi,
    // Player configurations
    /hls\s*:\s*["']([^"']+)['"]/gi,
    /stream[_-]?url\s*[:=]\s*["']([^"']+)['"]/gi,
    /video[_-]?url\s*[:=]\s*["']([^"']+)['"]/gi,
    // Embed URLs that might redirect to streams
    /embed[^"']*["']([^"']+)['"]/gi,
    // Partner stream URLs (like 90sport uses)
    /partner-stream[^"']*["']?([^"'\s>]+)/gi,
    // CDN patterns
    /cdn[^"']*\.m3u8[^"']*['"]/gi,
    // Data URL patterns (sometimes base64 encoded)
    /data-(?:url|src|stream)\s*=\s*["']([^"']+)['"]/gi,
  ];

  for (const pattern of patterns) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(html)) !== null) {
      let url = match[1];
      if (!url) continue;

      // Clean up URL
      url = url.trim();
      if (url.startsWith('//')) url = 'https:' + url;
      
      // Try to decode if base64
      url = tryBase64Decode(url);

      // Skip invalid URLs
      if (url.length < 10) continue;
      if (url.includes('google') || url.includes('facebook')) continue;
      if (url.includes('ads') || url.includes('analytics')) continue;
      if (seenUrls.has(url)) continue;

      // Determine stream type
      let type = 'unknown';
      if (url.includes('.m3u8')) type = 'm3u8';
      else if (url.includes('.mp4')) type = 'mp4';
      else if (url.includes('.ts')) type = 'ts';
      else if (url.includes('embed')) type = 'embed';
      else if (url.includes('stream') || url.includes('hls')) type = 'hls';

      if (type !== 'unknown') {
        seenUrls.add(url);
        streams.push({
          url,
          type,
          referer: pageUrl
        });
      }
    }
  }

  // Look for base64 encoded streams in data attributes or scripts
  const base64Patterns = [
    /data:application\/vnd\.apple\.mpegurl;base64,([A-Za-z0-9+/=]+)/gi,
    /atob\(['"]([A-Za-z0-9+/=]+)['"]\)/gi,
    /base64['":\s]+['"]([A-Za-z0-9+/=]+)['"]/gi,
  ];

  for (const pattern of base64Patterns) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(html)) !== null) {
      const decoded = tryBase64Decode(match[1]);
      if (decoded.includes('.m3u8') || decoded.startsWith('http')) {
        if (!seenUrls.has(decoded)) {
          seenUrls.add(decoded);
          streams.push({
            url: decoded,
            type: 'm3u8',
            referer: pageUrl
          });
        }
      }
    }
  }

  return streams;
}

// Extract iframe sources that might contain streams
function extractIframes(html: string): string[] {
  const iframes: string[] = [];
  const iframePattern = /<iframe[^>]+src=["']([^"']+)/gi;
  
  let match;
  while ((match = iframePattern.exec(html)) !== null) {
    let src = match[1];
    if (src.startsWith('//')) src = 'https:' + src;
    if (src.includes('embed') || src.includes('player') || src.includes('stream')) {
      iframes.push(src);
    }
  }
  
  return iframes;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { url, followIframes = true, maxDepth = 2 } = body;

    if (!url) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'URL is required',
          streams: [] 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🚀 Extracting m3u8 from: ${url}`);

    const allStreams: ExtractedStream[] = [];
    const allIframes: string[] = [];
    const visitedUrls = new Set<string>();

    // Recursive function to fetch and extract
    async function fetchAndExtract(pageUrl: string, depth: number) {
      if (depth > maxDepth || visitedUrls.has(pageUrl)) return;
      visitedUrls.add(pageUrl);

      console.log(`📄 Fetching (depth ${depth}): ${pageUrl.slice(0, 80)}...`);

      try {
        const response = await fetch(pageUrl, {
          headers: {
            'User-Agent': MOBILE_UA,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': url,
            'Origin': new URL(url).origin,
          }
        });

        if (!response.ok) {
          console.log(`⚠️ HTTP ${response.status} for ${pageUrl}`);
          return;
        }

        const contentType = response.headers.get('content-type') || '';
        
        // If it's an m3u8 directly, add it
        if (contentType.includes('mpegurl') || pageUrl.includes('.m3u8')) {
          allStreams.push({
            url: pageUrl,
            type: 'm3u8',
            referer: url
          });
          console.log(`🎯 Direct m3u8: ${pageUrl.slice(0, 80)}...`);
          return;
        }

        const html = await response.text();
        console.log(`📝 Got ${html.length} bytes`);
        
        // Log first 2000 chars for debugging
        console.log(`📄 HTML preview: ${html.slice(0, 2000)}`);

        // Extract streams from page
        const streams = extractStreams(html, pageUrl);
        for (const stream of streams) {
          if (!allStreams.some(s => s.url === stream.url)) {
            allStreams.push(stream);
            console.log(`✅ Found ${stream.type}: ${stream.url.slice(0, 80)}...`);
          }
        }

        // Extract and follow iframes if enabled
        if (followIframes && depth < maxDepth) {
          const iframes = extractIframes(html);
          for (const iframeSrc of iframes) {
            if (!visitedUrls.has(iframeSrc)) {
              allIframes.push(iframeSrc);
              await fetchAndExtract(iframeSrc, depth + 1);
            }
          }
        }

      } catch (error) {
        console.log(`❌ Error fetching ${pageUrl}: ${error.message}`);
      }
    }

    // Start extraction
    await fetchAndExtract(url, 0);

    // Filter to only m3u8 streams
    const m3u8Streams = allStreams.filter(s => 
      s.type === 'm3u8' || s.url.includes('.m3u8')
    );

    console.log(`✅ Done! Found ${m3u8Streams.length} m3u8 streams, ${allStreams.length} total`);

    return new Response(
      JSON.stringify({
        success: true,
        url,
        m3u8Count: m3u8Streams.length,
        totalCount: allStreams.length,
        streams: m3u8Streams,
        allStreams,
        iframes: allIframes
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        streams: [] 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
