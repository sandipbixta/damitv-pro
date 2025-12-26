import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExtractedStream {
  url: string;
  type: 'hls' | 'mp4' | 'embed' | 'unknown';
  source?: string;
  quality?: string;
}

interface MatchInfo {
  title: string;
  teams?: { home: string; away: string };
  category?: string;
  status?: string;
  streams: ExtractedStream[];
}

// Patterns to find HLS and video URLs
const HLS_PATTERNS = [
  /["']([^"']*\.m3u8[^"']*)['"]/gi,
  /source["\s]*:["\s]*["']([^"']*\.m3u8[^"']*)['"]/gi,
  /src["\s]*:["\s]*["']([^"']*\.m3u8[^"']*)['"]/gi,
  /file["\s]*:["\s]*["']([^"']*\.m3u8[^"']*)['"]/gi,
  /playlist["\s]*:["\s]*["']([^"']*\.m3u8[^"']*)['"]/gi,
  /hls["\s]*:["\s]*["']([^"']*)['"]/gi,
  /stream[Uu]rl["\s]*:["\s]*["']([^"']*)['"]/gi,
  /video[Ss]rc["\s]*:["\s]*["']([^"']*)['"]/gi,
];

const EMBED_PATTERNS = [
  /<iframe[^>]*src=["']([^"']+)["'][^>]*>/gi,
  /embedUrl["\s]*:["\s]*["']([^"']+)['"]/gi,
  /player[Uu]rl["\s]*:["\s]*["']([^"']+)['"]/gi,
];

function extractUrls(content: string): ExtractedStream[] {
  const streams: ExtractedStream[] = [];
  const seenUrls = new Set<string>();

  // Extract HLS streams
  for (const pattern of HLS_PATTERNS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(content)) !== null) {
      let url = match[1];
      if (url && url.length > 10 && !seenUrls.has(url)) {
        // Make URL absolute if needed
        if (url.startsWith('//')) {
          url = 'https:' + url;
        }
        
        if (url.includes('.m3u8') || url.includes('hls') || url.includes('stream')) {
          seenUrls.add(url);
          streams.push({
            url,
            type: url.includes('.m3u8') ? 'hls' : 'unknown',
            source: 'scraped'
          });
        }
      }
    }
  }

  // Extract embed URLs
  for (const pattern of EMBED_PATTERNS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(content)) !== null) {
      let url = match[1];
      if (url && url.length > 10 && !seenUrls.has(url)) {
        if (url.startsWith('//')) {
          url = 'https:' + url;
        }
        
        // Filter out common non-stream iframes
        if (!url.includes('google') && !url.includes('facebook') && 
            !url.includes('twitter') && !url.includes('ads')) {
          seenUrls.add(url);
          streams.push({
            url,
            type: 'embed',
            source: 'scraped'
          });
        }
      }
    }
  }

  return streams;
}

async function scrapeWith90sportApi(): Promise<MatchInfo[]> {
  const matches: MatchInfo[] = [];
  
  try {
    // Try to find the internal API
    const apiEndpoints = [
      'https://90sport.com/api/matches',
      'https://90sport.com/api/live',
      'https://90sport.com/api/v1/matches',
      'https://90sport.com/_nuxt/api/matches',
    ];

    for (const endpoint of apiEndpoints) {
      try {
        console.log(`Trying API endpoint: ${endpoint}`);
        const response = await fetch(endpoint, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log(`Got response from ${endpoint}:`, JSON.stringify(data).slice(0, 200));
          
          if (Array.isArray(data)) {
            for (const match of data) {
              matches.push({
                title: match.title || match.name || 'Unknown Match',
                category: match.category || match.sport,
                status: match.status,
                streams: []
              });
            }
          }
        }
      } catch (e) {
        console.log(`API ${endpoint} failed:`, e.message);
      }
    }
  } catch (error) {
    console.error('Error in API scraping:', error);
  }
  
  return matches;
}

async function scrapeWithFirecrawl(url: string): Promise<{ content: string; links: string[] }> {
  const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
  
  if (!apiKey) {
    console.log('⚠️ Firecrawl API key not configured, using fallback');
    throw new Error('Firecrawl API key not configured');
  }

  console.log(`🔥 Scraping ${url} with Firecrawl`);

  const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
      formats: ['markdown', 'html', 'links'],
      onlyMainContent: false,
      waitFor: 3000, // Wait for JS to load
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Firecrawl error:', error);
    throw new Error(`Firecrawl request failed: ${response.status}`);
  }

  const data = await response.json();
  console.log('✅ Firecrawl scrape successful');
  
  return {
    content: data.data?.html || data.data?.markdown || '',
    links: data.data?.links || []
  };
}

async function scrapeMatchPage(matchUrl: string): Promise<ExtractedStream[]> {
  const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
  
  if (!apiKey) {
    return [];
  }

  try {
    console.log(`🎯 Scraping match page: ${matchUrl}`);
    
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: matchUrl,
        formats: ['html', 'rawHtml'],
        onlyMainContent: false,
        waitFor: 5000, // Wait longer for player to load
      }),
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    const html = data.data?.rawHtml || data.data?.html || '';
    
    return extractUrls(html);
  } catch (error) {
    console.error('Error scraping match page:', error);
    return [];
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url = 'https://90sport.com/', scrapeMatches = true } = await req.json().catch(() => ({}));
    
    console.log(`🚀 Starting HLS scrape for: ${url}`);
    
    const results: {
      success: boolean;
      mainPageStreams: ExtractedStream[];
      matchLinks: string[];
      matchStreams: MatchInfo[];
      allHlsUrls: string[];
    } = {
      success: true,
      mainPageStreams: [],
      matchLinks: [],
      matchStreams: [],
      allHlsUrls: []
    };

    // Step 1: Scrape main page with Firecrawl
    try {
      const { content, links } = await scrapeWithFirecrawl(url);
      
      // Extract any HLS URLs from main page
      results.mainPageStreams = extractUrls(content);
      console.log(`📺 Found ${results.mainPageStreams.length} streams on main page`);
      
      // Find match links (pages that might have streams)
      const matchLinks = links.filter((link: string) => 
        link.includes('/watch/') || 
        link.includes('/live/') || 
        link.includes('/match/') ||
        link.includes('/stream/') ||
        (link.includes('90sport.com') && link.match(/\/\d+/)) // Links with IDs
      );
      
      results.matchLinks = [...new Set(matchLinks)].slice(0, 10); // Limit to 10
      console.log(`🔗 Found ${results.matchLinks.length} match links`);
      
    } catch (error) {
      console.error('Main page scrape failed:', error);
    }

    // Step 2: Try internal API
    const apiMatches = await scrapeWith90sportApi();
    results.matchStreams.push(...apiMatches);

    // Step 3: Scrape individual match pages if requested
    if (scrapeMatches && results.matchLinks.length > 0) {
      console.log(`🎬 Scraping ${results.matchLinks.length} match pages...`);
      
      for (const matchUrl of results.matchLinks.slice(0, 5)) { // Limit to 5 pages
        const streams = await scrapeMatchPage(matchUrl);
        if (streams.length > 0) {
          results.matchStreams.push({
            title: matchUrl.split('/').pop() || 'Unknown',
            streams
          });
        }
      }
    }

    // Collect all HLS URLs
    const allHls = new Set<string>();
    
    for (const stream of results.mainPageStreams) {
      if (stream.type === 'hls') {
        allHls.add(stream.url);
      }
    }
    
    for (const match of results.matchStreams) {
      for (const stream of match.streams) {
        if (stream.type === 'hls') {
          allHls.add(stream.url);
        }
      }
    }
    
    results.allHlsUrls = [...allHls];
    
    console.log(`✅ Scrape complete! Found ${results.allHlsUrls.length} HLS URLs`);

    return new Response(
      JSON.stringify(results),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Scrape error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        mainPageStreams: [],
        matchLinks: [],
        matchStreams: [],
        allHlsUrls: []
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
