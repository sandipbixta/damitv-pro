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
  id?: string;
  title: string;
  teams?: { home: string; away: string };
  category?: string;
  status?: string;
  watchUrl?: string;
  streams: ExtractedStream[];
}

// Patterns to find HLS and video URLs
const HLS_PATTERNS = [
  /["']([^"']*\.m3u8[^"']*)['"]/gi,
  /source["\s]*:["\s]*["']([^"']*\.m3u8[^"']*)['"]/gi,
  /src["\s]*:["\s]*["']([^"']*\.m3u8[^"']*)['"]/gi,
  /file["\s]*:["\s]*["']([^"']*\.m3u8[^"']*)['"]/gi,
  /hls["\s]*:["\s]*["']([^"']*)['"]/gi,
  /streamUrl["\s]*:["\s]*["']([^"']*)['"]/gi,
];

const EMBED_PATTERNS = [
  /<iframe[^>]*src=["']([^"']+)["'][^>]*>/gi,
  /embedUrl["\s]*:["\s]*["']([^"']+)['"]/gi,
  /playerUrl["\s]*:["\s]*["']([^"']+)['"]/gi,
];

function extractUrls(content: string): ExtractedStream[] {
  const streams: ExtractedStream[] = [];
  const seenUrls = new Set<string>();

  for (const pattern of HLS_PATTERNS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(content)) !== null) {
      let url = match[1];
      if (url && url.length > 10 && !seenUrls.has(url)) {
        if (url.startsWith('//')) url = 'https:' + url;
        if (url.includes('.m3u8') || url.includes('hls') || url.includes('stream')) {
          seenUrls.add(url);
          streams.push({ url, type: url.includes('.m3u8') ? 'hls' : 'unknown', source: 'scraped' });
        }
      }
    }
  }

  for (const pattern of EMBED_PATTERNS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(content)) !== null) {
      let url = match[1];
      if (url && url.length > 10 && !seenUrls.has(url)) {
        if (url.startsWith('//')) url = 'https:' + url;
        if (!url.includes('google') && !url.includes('facebook') && !url.includes('twitter') && !url.includes('ads')) {
          seenUrls.add(url);
          streams.push({ url, type: 'embed', source: 'scraped' });
        }
      }
    }
  }

  return streams;
}

// Extract match data from Nuxt __NUXT__ payload
function extractNuxtData(html: string): any[] {
  const matches: any[] = [];
  
  // Look for __NUXT__ or window.__NUXT__ data
  const nuxtPatterns = [
    /window\.__NUXT__\s*=\s*({[\s\S]*?});?\s*<\/script>/i,
    /__NUXT__\s*=\s*({[\s\S]*?});?\s*<\/script>/i,
    /data:\s*\[({[\s\S]*?})\]/gi,
  ];

  for (const pattern of nuxtPatterns) {
    pattern.lastIndex = 0;
    const match = pattern.exec(html);
    if (match) {
      try {
        console.log('🔍 Found potential Nuxt data');
        // Try to parse it (this may fail for complex payloads)
        const jsonStr = match[1];
        if (jsonStr.length < 50000) { // Avoid parsing huge payloads
          console.log('📦 Nuxt payload sample:', jsonStr.slice(0, 300));
        }
      } catch (e) {
        console.log('Failed to parse Nuxt data:', e.message);
      }
    }
  }

  // Look for match data patterns in the HTML
  const matchPatterns = [
    /"matches"\s*:\s*\[([\s\S]*?)\]/gi,
    /"events"\s*:\s*\[([\s\S]*?)\]/gi,
    /"liveEvents"\s*:\s*\[([\s\S]*?)\]/gi,
    /"fixtures"\s*:\s*\[([\s\S]*?)\]/gi,
  ];

  for (const pattern of matchPatterns) {
    pattern.lastIndex = 0;
    const match = pattern.exec(html);
    if (match) {
      console.log('🎯 Found match array data');
    }
  }

  return matches;
}

// Extract watch links from the page
function extractWatchLinks(html: string, markdown: string): string[] {
  const links: string[] = [];
  const seenLinks = new Set<string>();

  // Pattern for watch/live links
  const patterns = [
    /href=["']([^"']*\/watch\/[^"']+)["']/gi,
    /href=["']([^"']*\/live\/[^"']+)["']/gi,
    /href=["']([^"']*\/stream\/[^"']+)["']/gi,
    /href=["']([^"']*\/match\/[^"']+)["']/gi,
    /\(([^)]*90sport\.com\/watch\/[^)]+)\)/gi,
    /\(([^)]*90sport\.com\/live\/[^)]+)\)/gi,
  ];

  const combined = html + '\n' + markdown;

  for (const pattern of patterns) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(combined)) !== null) {
      let url = match[1];
      if (url.startsWith('/')) {
        url = 'https://90sport.com' + url;
      }
      if (!seenLinks.has(url)) {
        seenLinks.add(url);
        links.push(url);
      }
    }
  }

  console.log(`🔗 Found ${links.length} watch links`);
  return links;
}

// Parse match cards from markdown
function parseMatchesFromMarkdown(markdown: string): MatchInfo[] {
  const matches: MatchInfo[] = [];

  // Look for "Watch" buttons/links pattern
  const watchPattern = /\[Watch\]\((https?:\/\/[^)]+)\)/gi;
  let match;
  
  while ((match = watchPattern.exec(markdown)) !== null) {
    const watchUrl = match[1];
    matches.push({
      title: 'Live Match',
      watchUrl,
      streams: []
    });
  }

  // Look for VS patterns (Team A vs Team B)
  const vsPattern = /([A-Za-z\s]+)\s+vs\.?\s+([A-Za-z\s]+)/gi;
  while ((match = vsPattern.exec(markdown)) !== null) {
    const home = match[1].trim();
    const away = match[2].trim();
    if (home.length > 2 && away.length > 2 && home.length < 40 && away.length < 40) {
      const existing = matches.find(m => m.title === 'Live Match' && !m.teams);
      if (existing) {
        existing.title = `${home} vs ${away}`;
        existing.teams = { home, away };
      } else {
        matches.push({
          title: `${home} vs ${away}`,
          teams: { home, away },
          streams: []
        });
      }
    }
  }

  return matches;
}

async function scrapeWithFirecrawl(url: string): Promise<{ html: string; markdown: string; links: string[] }> {
  const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
  
  if (!apiKey) {
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
      formats: ['markdown', 'html', 'rawHtml', 'links'],
      onlyMainContent: false,
      waitFor: 10000, // Wait 10s for full JS load
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Firecrawl error:', error);
    throw new Error(`Firecrawl failed: ${response.status}`);
  }

  const data = await response.json();
  const html = data.data?.rawHtml || data.data?.html || '';
  const markdown = data.data?.markdown || '';
  const links = data.data?.links || [];
  
  console.log(`✅ Scraped ${html.length} chars HTML, ${markdown.length} chars MD, ${links.length} links`);
  
  // Log markdown sample for debugging
  if (markdown.length > 0) {
    console.log('📝 Markdown sample:', markdown.slice(0, 1000));
  }
  
  return { html, markdown, links };
}

async function scrapeWatchPage(watchUrl: string): Promise<ExtractedStream[]> {
  const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
  if (!apiKey) return [];

  try {
    console.log(`🎬 Scraping watch page: ${watchUrl}`);
    
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: watchUrl,
        formats: ['rawHtml', 'html'],
        onlyMainContent: false,
        waitFor: 12000, // Wait longer for player
      }),
    });

    if (!response.ok) return [];

    const data = await response.json();
    const html = data.data?.rawHtml || data.data?.html || '';
    
    console.log(`📺 Watch page HTML: ${html.length} chars`);
    
    // Log any iframe or video sources found
    const iframeMatch = html.match(/<iframe[^>]*src=["']([^"']+)["']/i);
    if (iframeMatch) {
      console.log('🎯 Found iframe:', iframeMatch[1]);
    }
    
    const streams = extractUrls(html);
    console.log(`📺 Extracted ${streams.length} streams from watch page`);
    
    return streams;
  } catch (error) {
    console.error('Watch page error:', error);
    return [];
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { url = 'https://90sport.com/livesports', scrapeWatchPages = true } = body;
    
    console.log(`🚀 Starting scrape for: ${url}`);
    
    const results: {
      success: boolean;
      url: string;
      matches: MatchInfo[];
      watchLinks: string[];
      streams: ExtractedStream[];
      allHlsUrls: string[];
      debug: {
        htmlLength: number;
        markdownLength: number;
        linksFound: number;
      };
    } = {
      success: true,
      url,
      matches: [],
      watchLinks: [],
      streams: [],
      allHlsUrls: [],
      debug: { htmlLength: 0, markdownLength: 0, linksFound: 0 }
    };

    // Step 1: Try the 90sport API directly first
    const apiBaseUrl = 'https://sports90-api-prod-qna3x.ondigitalocean.app';
    
    try {
      console.log('🔌 Trying 90sport API...');
      
      // Try different API endpoints
      const apiEndpoints = [
        '/api/matches',
        '/api/matches/live',
        '/api/events',
        '/api/events/live',
        '/api/fixtures',
        '/api/schedule',
        '/matches',
        '/events',
      ];
      
      for (const endpoint of apiEndpoints) {
        try {
          const apiUrl = apiBaseUrl + endpoint;
          console.log(`📡 Trying: ${apiUrl}`);
          
          const apiResponse = await fetch(apiUrl, {
            headers: {
              'Accept': 'application/json',
              'Origin': 'https://90sport.com',
              'Referer': 'https://90sport.com/',
            }
          });
          
          if (apiResponse.ok) {
            const apiData = await apiResponse.json();
            console.log(`✅ API ${endpoint} returned:`, JSON.stringify(apiData).slice(0, 500));
            
            // If we got matches, process them
            if (Array.isArray(apiData)) {
              for (const match of apiData) {
                results.matches.push({
                  id: match.id || match._id,
                  title: match.title || match.name || `${match.homeTeam} vs ${match.awayTeam}`,
                  category: match.category || match.sport,
                  status: match.status,
                  watchUrl: match.watchUrl || match.streamUrl,
                  streams: match.streams || []
                });
              }
            } else if (apiData.data && Array.isArray(apiData.data)) {
              for (const match of apiData.data) {
                results.matches.push({
                  id: match.id || match._id,
                  title: match.title || match.name || `${match.homeTeam} vs ${match.awayTeam}`,
                  category: match.category || match.sport,
                  status: match.status,
                  watchUrl: match.watchUrl || match.streamUrl,
                  streams: match.streams || []
                });
              }
            }
            
            if (results.matches.length > 0) {
              console.log(`🎯 Found ${results.matches.length} matches from API`);
              break;
            }
          }
        } catch (e) {
          console.log(`API ${endpoint} failed:`, e.message);
        }
      }
    } catch (apiError) {
      console.error('API scraping failed:', apiError);
    }

    // Step 2: Scrape the page with Firecrawl
    const { html, markdown, links } = await scrapeWithFirecrawl(url);
    
    results.debug.htmlLength = html.length;
    results.debug.markdownLength = markdown.length;
    results.debug.linksFound = links.length;

    // Step 2: Extract streams from main page
    results.streams = extractUrls(html);
    
    // Step 3: Try to extract Nuxt data
    extractNuxtData(html);
    
    // Step 4: Extract watch links
    results.watchLinks = extractWatchLinks(html, markdown);
    
    // Also add links that look like watch pages
    for (const link of links) {
      if (link.includes('/watch/') || link.includes('/live/') || link.includes('/stream/')) {
        if (!results.watchLinks.includes(link)) {
          results.watchLinks.push(link);
        }
      }
    }
    
    // Step 5: Parse matches from markdown
    results.matches = parseMatchesFromMarkdown(markdown);
    
    // Step 6: Scrape individual watch pages for HLS
    if (scrapeWatchPages && results.watchLinks.length > 0) {
      console.log(`🎬 Scraping ${Math.min(results.watchLinks.length, 3)} watch pages...`);
      
      for (const watchUrl of results.watchLinks.slice(0, 3)) {
        const pageStreams = await scrapeWatchPage(watchUrl);
        
        if (pageStreams.length > 0) {
          const matchTitle = watchUrl.split('/').pop()?.replace(/-/g, ' ') || 'Unknown';
          results.matches.push({
            title: matchTitle,
            watchUrl,
            streams: pageStreams
          });
        }
        
        results.streams.push(...pageStreams);
      }
    }

    // Collect all HLS URLs
    const allHls = new Set<string>();
    for (const stream of results.streams) {
      if (stream.type === 'hls') {
        allHls.add(stream.url);
      }
    }
    for (const match of results.matches) {
      for (const stream of match.streams) {
        if (stream.type === 'hls') {
          allHls.add(stream.url);
        }
      }
    }
    results.allHlsUrls = [...allHls];

    console.log(`✅ Complete! Found ${results.streams.length} streams, ${results.allHlsUrls.length} HLS URLs`);

    return new Response(
      JSON.stringify(results),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        matches: [],
        watchLinks: [],
        streams: [],
        allHlsUrls: []
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
