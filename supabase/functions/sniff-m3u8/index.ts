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

    // Try to find and click Watch/Play buttons
    const buttonSelectors = [
      "//button[contains(., 'Watch')]",
      "//a[contains(., 'Watch')]",
      "//button[contains(., 'Play')]",
      "//a[contains(., 'Play')]",
      "//div[contains(@class, 'play')]",
      "//button[contains(@class, 'play')]",
      "//*[contains(@class, 'video-play')]",
    ];
    
    for (const selector of buttonSelectors) {
      try {
        const elements = await page.$x(selector);
        if (elements.length > 0) {
          console.log(`🖱️ Found element with ${selector}, clicking...`);
          await elements[0].click();
          await page.waitForTimeout(5000);
        }
      } catch {
        // Continue to next selector
      }
    }

    // Look for iframes and try to get their src
    const iframes = await page.$$('iframe');
    console.log(`🔍 Found ${iframes.length} iframes`);
    
    const iframeSrcs: string[] = [];
    for (const iframe of iframes) {
      try {
        const src = await iframe.evaluate((el: HTMLIFrameElement) => el.src);
        if (src && src.length > 10) {
          iframeSrcs.push(src);
          console.log(`📺 Iframe src: ${src.slice(0, 100)}...`);
          
          // Check if iframe src contains m3u8
          if (src.includes('.m3u8') && !capturedUrls.has(src)) {
            capturedUrls.add(src);
            capturedStreams.push({
              url: src,
              type: 'm3u8-iframe',
              timestamp: new Date().toISOString()
            });
          }
        }
      } catch {
        // Iframe might not be accessible
      }
    }

    // Wait for more network activity
    console.log(`⏳ Waiting ${waitTime}ms for dynamic content...`);
    await page.waitForTimeout(waitTime);

    // Get page source and look for m3u8 patterns
    const content = await page.content();
    
    // Multiple regex patterns to find stream URLs
    const patterns = [
      /["']([^"']*\.m3u8[^"']*)['"]/gi,
      /src\s*[:=]\s*["']([^"']*\.m3u8[^"']*)['"]/gi,
      /file\s*[:=]\s*["']([^"']*\.m3u8[^"']*)['"]/gi,
      /source\s*[:=]\s*["']([^"']*\.m3u8[^"']*)['"]/gi,
      /hls\s*[:=]\s*["']([^"']*)['"]/gi,
      /stream\s*[:=]\s*["']([^"']*\.m3u8[^"']*)['"]/gi,
    ];
    
    for (const regex of patterns) {
      let match;
      while ((match = regex.exec(content)) !== null) {
        let foundUrl = match[1];
        if (foundUrl.startsWith('//')) foundUrl = 'https:' + foundUrl;
        
        if (!capturedUrls.has(foundUrl) && foundUrl.length > 10 && 
            (foundUrl.includes('.m3u8') || foundUrl.includes('/hls/'))) {
          capturedUrls.add(foundUrl);
          capturedStreams.push({
            url: foundUrl,
            type: 'm3u8-source',
            timestamp: new Date().toISOString()
          });
          console.log(`📝 Found in source: ${foundUrl.slice(0, 100)}...`);
        }
      }
    }
    
    // Look for any embed URLs that might contain streams
    const embedPatterns = [
      /embed[^"']*["']([^"']+)['"]/gi,
      /player[^"']*["']([^"']+)['"]/gi,
    ];
    
    const embedUrls: string[] = [];
    for (const regex of embedPatterns) {
      let match;
      while ((match = regex.exec(content)) !== null) {
        if (match[1] && match[1].startsWith('http')) {
          embedUrls.push(match[1]);
        }
      }
    }

    await browser.close();
    console.log(`✅ Done! Found ${capturedStreams.length} streams, ${iframeSrcs.length} iframes`);

    return new Response(
      JSON.stringify({
        success: true,
        url,
        count: capturedStreams.length,
        streams: capturedStreams.filter(s => s.url.includes('.m3u8')),
        allCaptured: capturedStreams,
        iframes: iframeSrcs,
        embedUrls: embedUrls.slice(0, 10)
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
