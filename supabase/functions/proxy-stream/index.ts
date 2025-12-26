import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const streamUrl = url.searchParams.get('url');
    const userAgent = url.searchParams.get('ua') || 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    const referer = url.searchParams.get('referer') || '';

    if (!streamUrl) {
      console.error('❌ No stream URL provided');
      return new Response(
        JSON.stringify({ error: 'Missing url parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🎬 Proxying stream:', streamUrl);
    console.log('📋 User-Agent:', userAgent);
    if (referer) console.log('🔗 Referer:', referer);

    // Build headers for the upstream request
    const headers: Record<string, string> = {
      'User-Agent': userAgent,
      'Accept': '*/*',
      'Accept-Language': 'en-US,en;q=0.9',
    };

    if (referer) {
      headers['Referer'] = referer;
      headers['Origin'] = new URL(referer).origin;
    }

    // Fetch the stream
    const response = await fetch(streamUrl, {
      headers,
      redirect: 'follow',
    });

    if (!response.ok) {
      console.error(`❌ Upstream error: ${response.status} ${response.statusText}`);
      return new Response(
        JSON.stringify({ error: `Upstream error: ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const contentType = response.headers.get('content-type') || '';
    console.log('✅ Response content-type:', contentType);

    // Get the base URL for rewriting relative URLs in m3u8
    const baseUrl = streamUrl.substring(0, streamUrl.lastIndexOf('/') + 1);
    const proxyBaseUrl = `${url.origin}${url.pathname}`;

    // Check if it's an HLS manifest
    if (streamUrl.includes('.m3u8') || contentType.includes('mpegurl') || contentType.includes('m3u8')) {
      let manifest = await response.text();
      console.log('📄 Processing M3U8 manifest, length:', manifest.length);

      // Rewrite relative URLs to go through our proxy
      const lines = manifest.split('\n');
      const rewrittenLines = lines.map(line => {
        const trimmedLine = line.trim();
        
        // Skip empty lines and comments (except EXT tags)
        if (!trimmedLine || (trimmedLine.startsWith('#') && !trimmedLine.includes('URI='))) {
          // Handle URI= in #EXT-X-KEY or #EXT-X-MAP tags
          if (trimmedLine.includes('URI="')) {
            return trimmedLine.replace(/URI="([^"]+)"/g, (match, uri) => {
              const absoluteUrl = uri.startsWith('http') ? uri : baseUrl + uri;
              const proxiedUrl = `${proxyBaseUrl}?url=${encodeURIComponent(absoluteUrl)}&ua=${encodeURIComponent(userAgent)}${referer ? `&referer=${encodeURIComponent(referer)}` : ''}`;
              return `URI="${proxiedUrl}"`;
            });
          }
          return line;
        }
        
        // Skip EXT tags that don't contain URIs
        if (trimmedLine.startsWith('#EXT')) {
          return line;
        }
        
        // This is a URL line (segment or sub-playlist)
        const absoluteUrl = trimmedLine.startsWith('http') ? trimmedLine : baseUrl + trimmedLine;
        return `${proxyBaseUrl}?url=${encodeURIComponent(absoluteUrl)}&ua=${encodeURIComponent(userAgent)}${referer ? `&referer=${encodeURIComponent(referer)}` : ''}`;
      });

      manifest = rewrittenLines.join('\n');

      return new Response(manifest, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/vnd.apple.mpegurl',
          'Cache-Control': 'no-cache',
        },
      });
    }

    // For segment files (.ts, .aac, etc.), stream directly
    const body = await response.arrayBuffer();
    console.log('📦 Streaming segment, size:', body.byteLength);

    return new Response(body, {
      headers: {
        ...corsHeaders,
        'Content-Type': contentType || 'video/mp2t',
        'Cache-Control': 'max-age=3600',
      },
    });

  } catch (error) {
    console.error('❌ Proxy error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
