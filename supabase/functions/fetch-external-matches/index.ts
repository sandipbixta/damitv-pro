import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MatchData {
  id: string;
  title: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  time: string;
  status: string;
  streamUrl: string;
  thumbnail?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const sport = url.searchParams.get('sport') || 'football';
    
    console.log(`Fetching live matches for sport: ${sport}`);

    // Scrape sportslive.run main page to get match listings
    const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: `https://sportslive.run/?sport=${sport}`,
        formats: ['html'],
        waitFor: 5000,
      }),
    });

    const scrapeData = await scrapeResponse.json();

    if (!scrapeResponse.ok || !scrapeData.success) {
      console.error('Firecrawl error:', scrapeData);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch matches' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const html = scrapeData.data?.html || '';
    console.log(`Scraped ${html.length} bytes`);

    const matches: MatchData[] = [];

    // Extract match cards from HTML
    // Pattern to find match blocks with team names and stream URLs
    const matchPatterns = [
      // Look for match containers with team info
      /<(?:div|article|li)[^>]*class=["'][^"']*(?:match|event|game|fixture|card)[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|article|li)>/gi,
    ];

    // Extract HLS streams first
    const hlsPattern = /["']([^"']*\.m3u8[^"']*)['"]/gi;
    const streamUrls: string[] = [];
    let hlsMatch;
    while ((hlsMatch = hlsPattern.exec(html)) !== null) {
      const url = hlsMatch[1];
      if (url.includes('.m3u8') && !streamUrls.includes(url)) {
        streamUrls.push(url.startsWith('//') ? 'https:' + url : url);
      }
    }

    console.log(`Found ${streamUrls.length} stream URLs`);

    // Extract match info from structured data or HTML patterns
    // Look for match titles with "vs" pattern
    const matchTitlePattern = /([A-Z][a-zA-Z\s.'-]+(?:FC|United|City|CF|SC|AC)?)\s*(?:vs\.?|v\.?|[-–—])\s*([A-Z][a-zA-Z\s.'-]+(?:FC|United|City|CF|SC|AC)?)/gi;
    
    // Find all team matchups in the page
    const teamMatchups: { home: string; away: string }[] = [];
    let titleMatch;
    while ((titleMatch = matchTitlePattern.exec(html)) !== null) {
      const home = titleMatch[1].trim();
      const away = titleMatch[2].trim();
      // Filter out common non-team strings
      if (home.length > 2 && away.length > 2 && 
          !home.toLowerCase().includes('cookie') &&
          !away.toLowerCase().includes('cookie') &&
          !home.toLowerCase().includes('privacy') &&
          !away.toLowerCase().includes('privacy')) {
        // Check if this matchup already exists
        const exists = teamMatchups.some(m => 
          m.home.toLowerCase() === home.toLowerCase() && 
          m.away.toLowerCase() === away.toLowerCase()
        );
        if (!exists) {
          teamMatchups.push({ home, away });
        }
      }
    }

    console.log(`Found ${teamMatchups.length} match titles`);

    // Extract time patterns
    const timePattern = /(\d{1,2}:\d{2}(?:\s*(?:AM|PM|am|pm))?)/g;
    const times: string[] = [];
    let timeMatch;
    while ((timeMatch = timePattern.exec(html)) !== null) {
      if (!times.includes(timeMatch[1])) {
        times.push(timeMatch[1]);
      }
    }

    // Extract league names
    const leaguePatterns = [
      /(Premier League|La Liga|Serie A|Bundesliga|Ligue 1|Champions League|Europa League|MLS|NFL|NBA|NHL|MLB|UFC|Boxing|Cricket|Tennis)/gi,
    ];
    const leagues: string[] = [];
    for (const pattern of leaguePatterns) {
      let leagueMatch;
      while ((leagueMatch = pattern.exec(html)) !== null) {
        if (!leagues.includes(leagueMatch[1])) {
          leagues.push(leagueMatch[1]);
        }
      }
    }

    // Extract status (LIVE, upcoming, etc)
    const statusPattern = /\b(LIVE|Live|HT|FT|1H|2H)\b/g;
    const statuses: string[] = [];
    let statusMatch;
    while ((statusMatch = statusPattern.exec(html)) !== null) {
      statuses.push(statusMatch[1]);
    }

    // Combine extracted data into match objects
    // Match streams with team matchups
    const numMatches = Math.min(teamMatchups.length, streamUrls.length);
    
    for (let i = 0; i < numMatches; i++) {
      const matchup = teamMatchups[i];
      const streamUrl = streamUrls[i];
      
      matches.push({
        id: `external-${Date.now()}-${i}`,
        title: `${matchup.home} vs ${matchup.away}`,
        homeTeam: matchup.home,
        awayTeam: matchup.away,
        league: leagues[i % leagues.length] || 'Sports',
        time: times[i] || 'Live',
        status: statuses[i] || 'LIVE',
        streamUrl: streamUrl,
      });
    }

    // If we have streams but no matchups, create generic entries
    if (matches.length === 0 && streamUrls.length > 0) {
      streamUrls.forEach((streamUrl, i) => {
        // Try to infer info from URL
        let title = `Live Stream ${i + 1}`;
        let league = 'Sports';
        
        if (streamUrl.includes('football')) {
          league = 'Football';
          title = `Football Stream ${i + 1}`;
        } else if (streamUrl.includes('bsy')) {
          league = 'Sports Channel';
          title = `Sports Channel ${i + 1}`;
        } else if (streamUrl.includes('device')) {
          league = 'Live Stream';
          title = `Live Channel ${i + 1}`;
        }

        matches.push({
          id: `external-${Date.now()}-${i}`,
          title,
          homeTeam: 'Live',
          awayTeam: 'Stream',
          league,
          time: 'Now',
          status: 'LIVE',
          streamUrl,
        });
      });
    }

    console.log(`Returning ${matches.length} matches`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        matches,
        totalStreams: streamUrls.length,
        totalMatchups: teamMatchups.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching matches:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch matches' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
