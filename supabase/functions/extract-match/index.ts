import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MatchInfo {
  title?: string;
  homeTeam?: string;
  awayTeam?: string;
  league?: string;
  time?: string;
  status?: string;
  score?: string;
}

interface ExtractedMatch {
  matchInfo: MatchInfo;
  streams: {
    url: string;
    quality?: string;
    source?: string;
  }[];
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

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl connector not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Scraping match page with Firecrawl:', url);

    // Use Firecrawl to scrape the page (handles JavaScript rendering)
    const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['html', 'markdown'],
        waitFor: 3000, // Wait for JS to render
      }),
    });

    const scrapeData = await scrapeResponse.json();

    if (!scrapeResponse.ok || !scrapeData.success) {
      console.error('Firecrawl API error:', scrapeData);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: scrapeData.error || 'Failed to scrape page' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const html = scrapeData.data?.html || '';
    const markdown = scrapeData.data?.markdown || '';
    const metadata = scrapeData.data?.metadata || {};

    console.log(`Scraped ${html.length} bytes of HTML`);

    // Extract match info
    const matchInfo: MatchInfo = {};

    // Try to get title from metadata or page
    if (metadata.title) {
      matchInfo.title = metadata.title;
    }

    // Extract team names from various patterns
    const teamPatterns = [
      // "Team A vs Team B" or "Team A - Team B"
      /([A-Z][a-zA-Z\s.]+(?:FC|United|City|CF|SC)?)\s*(?:vs\.?|[-–—]|v\.?)\s*([A-Z][a-zA-Z\s.]+(?:FC|United|City|CF|SC)?)/i,
      // From title
      /title["\s:>]+([^<"]+)\s*(?:vs\.?|[-–—]|v\.?)\s*([^<"]+)/i,
    ];

    for (const pattern of teamPatterns) {
      const match = pattern.exec(html) || pattern.exec(markdown);
      if (match) {
        matchInfo.homeTeam = match[1].trim();
        matchInfo.awayTeam = match[2].trim();
        if (!matchInfo.title) {
          matchInfo.title = `${matchInfo.homeTeam} vs ${matchInfo.awayTeam}`;
        }
        break;
      }
    }

    // Extract league/competition
    const leaguePatterns = [
      /(?:league|competition|tournament)["\s:>]+([^<"]+)/i,
      /(Premier League|La Liga|Serie A|Bundesliga|Ligue 1|Champions League|Europa League|MLS|NFL|NBA|NHL|MLB)/i,
    ];

    for (const pattern of leaguePatterns) {
      const match = pattern.exec(html) || pattern.exec(markdown);
      if (match) {
        matchInfo.league = match[1].trim();
        break;
      }
    }

    // Extract status (LIVE, upcoming, etc)
    const statusMatch = /\b(LIVE|Live|live|HT|FT|1H|2H|Upcoming|In Progress)\b/.exec(html);
    if (statusMatch) {
      matchInfo.status = statusMatch[1];
    }

    // Extract score if available
    const scoreMatch = /(\d+)\s*[-–:]\s*(\d+)/.exec(html);
    if (scoreMatch && matchInfo.homeTeam) {
      matchInfo.score = `${scoreMatch[1]} - ${scoreMatch[2]}`;
    }

    // Extract HLS streams
    const hlsPatterns = [
      /["']([^"']*\.m3u8[^"']*)['"]/gi,
      /(?:src|file|source|stream|hls|url)\s*[=:]\s*["']([^"']*\.m3u8[^"']*)['"]/gi,
    ];

    const streams: { url: string; quality?: string; source?: string }[] = [];
    const foundUrls = new Set<string>();

    for (const pattern of hlsPatterns) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(html)) !== null) {
        let streamUrl = match[1];
        
        // Make URL absolute
        if (streamUrl.startsWith('//')) {
          streamUrl = 'https:' + streamUrl;
        } else if (streamUrl.startsWith('/')) {
          try {
            const base = new URL(url);
            streamUrl = base.origin + streamUrl;
          } catch {}
        }

        if (streamUrl.includes('.m3u8') && !foundUrls.has(streamUrl)) {
          foundUrls.add(streamUrl);
          streams.push({
            url: streamUrl,
            quality: streamUrl.includes('720') ? '720p' : streamUrl.includes('1080') ? '1080p' : 'auto',
            source: 'firecrawl',
          });
        }
      }
    }

    console.log(`Found ${streams.length} HLS streams`);

    const result: ExtractedMatch = {
      matchInfo,
      streams,
    };

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: result,
        message: streams.length > 0 
          ? `Found ${streams.length} stream(s) for ${matchInfo.title || 'this match'}`
          : 'No streams found. The page may load streams after user interaction.',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error extracting match:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to extract match data' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
