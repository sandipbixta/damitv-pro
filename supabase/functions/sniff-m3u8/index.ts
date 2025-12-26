import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import puppeteer from "https://deno.land/x/puppeteer@16.2.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CapturedStream {
  url: string;
  type: string;
  timestamp: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const browserlessToken = Deno.env.get('BROWSERLESS_TOKEN');
  
  if (!browserlessToken) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'BROWSERLESS_TOKEN not configured. Get one at browserless.io',
        streams: [] 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { 
      url = 'https://90sport.com/livesports',
      clickSelector = null,
      waitTime = 10000
    } = body;

    console.log(`🚀 Starting m3u8 sniffer for: ${url}`);

    const capturedStreams: CapturedStream[] = [];
    const capturedUrls = new Set<string>();

    // Connect to Browserless
    console.log('🔌 Connecting to Browserless...');
    const browser = await puppeteer.connect({
      browserWSEndpoint: `wss://chrome.browserless.io?token=${browserlessToken}`,
    });

    console.log('✅ Connected to Browserless');
    const page = await browser.newPage();

    // Enable request interception
    await page.setRequestInterception(true);

    // Intercept all requests
    page.on('request', (request) => {
      const requestUrl = request.url();
      
      // Check for m3u8 or HLS-related URLs
      if (
        requestUrl.includes('.m3u8') ||
        requestUrl.includes('/hls/') ||
        requestUrl.includes('playlist')
      ) {
        if (!capturedUrls.has(requestUrl)) {
          capturedUrls.add(requestUrl);
          capturedStreams.push({
            url: requestUrl,
            type: requestUrl.includes('.m3u8') ? 'm3u8' : 'hls',
            timestamp: new Date().toISOString()
          });
          console.log(`🎯 Captured: ${requestUrl.slice(0, 100)}...`);
        }
      }
      
      request.continue();
    });

    // Also capture from responses
    page.on('response', async (response) => {
      const responseUrl = response.url();
      
      if (responseUrl.includes('.m3u8') && !capturedUrls.has(responseUrl)) {
        capturedUrls.add(responseUrl);
        capturedStreams.push({
          url: responseUrl,
          type: 'm3u8',
          timestamp: new Date().toISOString()
        });
        console.log(`🎯 Captured from response: ${responseUrl.slice(0, 100)}...`);
      }
    });

    // Navigate to the page
    console.log(`📄 Navigating to: ${url}`);
    await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });

    console.log('✅ Page loaded');
    await page.waitForTimeout(3000);

    // If a click selector is provided, click it
    if (clickSelector) {
      try {
        console.log(`🖱️ Clicking: ${clickSelector}`);
        await page.waitForSelector(clickSelector, { timeout: 5000 });
        await page.click(clickSelector);
        await page.waitForTimeout(waitTime);
      } catch (e) {
        console.log(`⚠️ Could not click: ${e.message}`);
      }
    }

    // Try to find and click Watch buttons
    try {
      const watchButton = await page.$x("//button[contains(., 'Watch')] | //a[contains(., 'Watch')]");
      if (watchButton.length > 0) {
        console.log('🖱️ Found Watch button, clicking...');
        await watchButton[0].click();
        await page.waitForTimeout(waitTime);
      }
    } catch {
      console.log('⚠️ No Watch button found');
    }

    // Get page source and look for m3u8
    const content = await page.content();
    const m3u8Regex = /["']([^"']*\.m3u8[^"']*)['"]/gi;
    let match;
    while ((match = m3u8Regex.exec(content)) !== null) {
      let foundUrl = match[1];
      if (foundUrl.startsWith('//')) foundUrl = 'https:' + foundUrl;
      
      if (!capturedUrls.has(foundUrl) && foundUrl.length > 10) {
        capturedUrls.add(foundUrl);
        capturedStreams.push({
          url: foundUrl,
          type: 'm3u8-source',
          timestamp: new Date().toISOString()
        });
        console.log(`📝 Found in source: ${foundUrl.slice(0, 100)}...`);
      }
    }

    await browser.close();
    console.log(`✅ Done! Found ${capturedStreams.length} streams`);

    return new Response(
      JSON.stringify({
        success: true,
        url,
        count: capturedStreams.length,
        streams: capturedStreams.filter(s => s.url.includes('.m3u8')),
        allCaptured: capturedStreams
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
