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
}

// Known working streams from sportslive.run (pre-extracted)
const KNOWN_STREAMS = [
  'https://live-en.aisports.cc/moviebox/device01/playlist.m3u8',
  'https://live-en.aisports.cc/moviebox/bsy_016/playlist.m3u8',
  'https://live-en.aisports.cc/moviebox/bsy_011/playlist.m3u8',
  'https://live-en.aisports.cc/moviebox/bsy_027/playlist.m3u8',
  'https://live-en.aisports.cc/moviebox/device02/playlist.m3u8',
  'https://live-en.aisports.cc/moviebox/football001/playlist.m3u8',
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      // Return pre-extracted streams if Firecrawl not available
      console.log('Firecrawl not configured, using pre-extracted streams');
      return returnPreExtractedMatches();
    }

    console.log('Fetching match listings from sportslive.run');

    // Scrape sportslive.run to get match listings
    const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://sportslive.run/',
        formats: ['html'],
        waitFor: 5000,
      }),
    });

    const scrapeData = await scrapeResponse.json();

    if (!scrapeResponse.ok || !scrapeData.success) {
      console.error('Firecrawl error, using pre-extracted streams');
      return returnPreExtractedMatches();
    }

    const html = scrapeData.data?.html || '';
    console.log(`Scraped ${html.length} bytes`);

    const matches: MatchData[] = [];

    // Extract team matchups from the page
    const matchTitlePattern = /([A-Z][a-zA-Z\s.'-]+(?:FC|United|City|CF|SC|AC)?)\s*(?:vs\.?|v\.?|[-–—])\s*([A-Z][a-zA-Z\s.'-]+(?:FC|United|City|CF|SC|AC)?)/gi;
    
    const teamMatchups: { home: string; away: string }[] = [];
    let titleMatch;
    while ((titleMatch = matchTitlePattern.exec(html)) !== null) {
      const home = titleMatch[1].trim();
      const away = titleMatch[2].trim();
      
      if (home.length > 2 && away.length > 2 && 
          !home.toLowerCase().includes('cookie') &&
          !away.toLowerCase().includes('cookie') &&
          !home.toLowerCase().includes('privacy') &&
          !away.toLowerCase().includes('privacy') &&
          !home.toLowerCase().includes('terms') &&
          !away.toLowerCase().includes('terms')) {
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

    // Extract league names
    const leaguePattern = /(Premier League|La Liga|Serie A|Bundesliga|Ligue 1|Champions League|Europa League|MLS|NFL|NBA|NHL|MLB|UFC|Boxing|Cricket|Tennis|Championship|FA Cup|EFL Cup|Copa del Rey|DFB Pokal|Coppa Italia|Coupe de France)/gi;
    const leagues: string[] = [];
    let leagueMatch;
    while ((leagueMatch = leaguePattern.exec(html)) !== null) {
      if (!leagues.includes(leagueMatch[1])) {
        leagues.push(leagueMatch[1]);
      }
    }

    // Extract times
    const timePattern = /(\d{1,2}:\d{2}(?:\s*(?:AM|PM|am|pm))?)/g;
    const times: string[] = [];
    let timeMatch;
    while ((timeMatch = timePattern.exec(html)) !== null) {
      if (!times.includes(timeMatch[1])) {
        times.push(timeMatch[1]);
      }
    }

    // Assign streams to matches
    // Use known working streams and rotate through them
    const numMatches = Math.min(teamMatchups.length, 20); // Limit to 20 matches
    
    for (let i = 0; i < numMatches; i++) {
      const matchup = teamMatchups[i];
      const streamUrl = KNOWN_STREAMS[i % KNOWN_STREAMS.length];
      
      matches.push({
        id: `match-${Date.now()}-${i}`,
        title: `${matchup.home} vs ${matchup.away}`,
        homeTeam: matchup.home,
        awayTeam: matchup.away,
        league: leagues[i % Math.max(leagues.length, 1)] || 'Football',
        time: times[i] || 'Live',
        status: 'LIVE',
        streamUrl,
      });
    }

    // If no matchups found, return pre-extracted
    if (matches.length === 0) {
      console.log('No matches found, using pre-extracted streams');
      return returnPreExtractedMatches();
    }

    console.log(`Returning ${matches.length} matches`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        matches,
        source: 'live',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching matches:', error);
    return returnPreExtractedMatches();
  }
});

function returnPreExtractedMatches(): Response {
  const defaultMatches: MatchData[] = KNOWN_STREAMS.map((url, i) => {
    let league = 'Sports';
    let title = `Live Stream ${i + 1}`;
    
    if (url.includes('football')) {
      league = 'Football';
      title = `Football Stream ${i + 1}`;
    } else if (url.includes('bsy')) {
      league = 'Sports Channel';
      title = `Sports Channel ${i + 1}`;
    } else if (url.includes('device')) {
      league = 'Live Stream';
      title = `Live Channel ${i + 1}`;
    }

    return {
      id: `default-${i}`,
      title,
      homeTeam: 'Live',
      awayTeam: 'Stream',
      league,
      time: 'Now',
      status: 'LIVE',
      streamUrl: url,
    };
  });

  return new Response(
    JSON.stringify({ 
      success: true, 
      matches: defaultMatches,
      source: 'cached',
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}