import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Patterns to find HLS/video URLs in page content
const STREAM_PATTERNS = [
  // HLS patterns - most specific first
  /source\s*[:=]\s*["']([^"']*\.m3u8[^"']*)['"]/gi,
  /src\s*[:=]\s*["']([^"']*\.m3u8[^"']*)['"]/gi,
  /file\s*[:=]\s*["']([^"']*\.m3u8[^"']*)['"]/gi,
  /playlist\s*[:=]\s*["']([^"']*\.m3u8[^"']*)['"]/gi,
  /hls\s*[:=]\s*["']([^"']*\.m3u8[^"']*)['"]/gi,
  /streamUrl\s*[:=]\s*["']([^"']*\.m3u8[^"']*)['"]/gi,
  /video_url\s*[:=]\s*["']([^"']*\.m3u8[^"']*)['"]/gi,
  
  // Generic m3u8 URL pattern
  /["']?(https?:\/\/[^"'\s<>]*\.m3u8[^"'\s<>]*)['"]/gi,
  
  // MP4 fallback patterns
  /source\s*[:=]\s*["']([^"']*\.mp4[^"']*)['"]/gi,
  /src\s*[:=]\s*["']([^"']*\.mp4[^"']*)['"]/gi,
  /file\s*[:=]\s*["']([^"']*\.mp4[^"']*)['"]/gi,
];

// User agents to try
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
];

async function fetchWithRetry(url: string, referer?: string): Promise<string | null> {
  for (const userAgent of USER_AGENTS) {
    try {
      const headers: Record<string, string> = {
        'User-Agent': userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Cache-Control': 'no-cache',
      };
      
      if (referer) {
        headers['Referer'] = referer;
        headers['Origin'] = new URL(referer).origin;
      }

      const response = await fetch(url, {
        headers,
        redirect: 'follow',
        signal: AbortSignal.timeout(10000),
      });

      if (response.ok) {
        const content = await response.text();
        console.log(`✅ Fetched ${url.substring(0, 80)}... (${content.length} bytes)`);
        return content;
      }
      
      console.log(`⚠️ HTTP ${response.status} for ${url.substring(0, 60)}...`);
    } catch (error) {
      console.log(`⚠️ Fetch error with UA ${userAgent.substring(0, 30)}...: ${error.message}`);
    }
  }
  return null;
}

function extractUrls(content: string, baseUrl: string): { url: string; type: 'hls' | 'mp4' }[] {
  const results: { url: string; type: 'hls' | 'mp4' }[] = [];
  const seen = new Set<string>();

  for (const pattern of STREAM_PATTERNS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(content)) !== null) {
      let url = match[1];
      if (!url || url.length < 10) continue;

      // Make URL absolute
      if (url.startsWith('//')) {
        url = 'https:' + url;
      } else if (url.startsWith('/')) {
        try {
          const base = new URL(baseUrl);
          url = base.origin + url;
        } catch {
          continue;
        }
      } else if (!url.startsWith('http')) {
        try {
          const base = new URL(baseUrl);
          url = base.origin + '/' + url;
        } catch {
          continue;
        }
      }

      // Clean up URL
      url = url.replace(/\\/g, '');

      if (seen.has(url)) continue;
      seen.add(url);

      const type = url.includes('.m3u8') ? 'hls' : 'mp4';
      results.push({ url, type });
      console.log(`🎯 Found ${type.toUpperCase()}: ${url.substring(0, 100)}...`);
    }
  }

  // Prioritize HLS over MP4
  results.sort((a, b) => {
    if (a.type === 'hls' && b.type !== 'hls') return -1;
    if (a.type !== 'hls' && b.type === 'hls') return 1;
    return 0;
  });

  return results;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { embedUrl, referer } = await req.json();

    if (!embedUrl) {
      return new Response(
        JSON.stringify({ success: false, error: 'embedUrl is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🔍 Extracting stream from: ${embedUrl}`);

    // Check if URL is already a direct stream
    if (embedUrl.includes('.m3u8')) {
      console.log('✅ URL is already HLS');
      return new Response(
        JSON.stringify({ success: true, streamUrl: embedUrl, type: 'hls', source: 'direct' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch the embed page
    const pageContent = await fetchWithRetry(embedUrl, referer);
    
    if (!pageContent) {
      console.log('❌ Failed to fetch embed page');
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch embed page' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract stream URLs
    const streams = extractUrls(pageContent, embedUrl);

    if (streams.length === 0) {
      // Try to find nested iframe and follow it
      const iframeMatch = pageContent.match(/iframe[^>]*src=["']([^"']+)["']/i);
      if (iframeMatch) {
        console.log(`🔄 Found nested iframe: ${iframeMatch[1].substring(0, 60)}...`);
        
        let nestedUrl = iframeMatch[1];
        if (nestedUrl.startsWith('//')) nestedUrl = 'https:' + nestedUrl;
        if (!nestedUrl.startsWith('http')) {
          const base = new URL(embedUrl);
          nestedUrl = base.origin + (nestedUrl.startsWith('/') ? '' : '/') + nestedUrl;
        }

        const nestedContent = await fetchWithRetry(nestedUrl, embedUrl);
        if (nestedContent) {
          const nestedStreams = extractUrls(nestedContent, nestedUrl);
          if (nestedStreams.length > 0) {
            console.log(`✅ Found stream in nested iframe`);
            return new Response(
              JSON.stringify({ 
                success: true, 
                streamUrl: nestedStreams[0].url, 
                type: nestedStreams[0].type,
                source: 'nested',
                alternatives: nestedStreams.slice(1, 5)
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }
      }

      console.log('❌ No stream URLs found');
      return new Response(
        JSON.stringify({ success: false, error: 'No stream URLs found in embed page' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ Extracted ${streams.length} stream(s)`);
    return new Response(
      JSON.stringify({ 
        success: true, 
        streamUrl: streams[0].url, 
        type: streams[0].type,
        source: 'extracted',
        alternatives: streams.slice(1, 5)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Extraction error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
