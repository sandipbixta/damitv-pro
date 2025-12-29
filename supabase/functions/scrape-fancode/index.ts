import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl connector not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Scraping fancode.com for images...');

    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://www.fancode.com',
        formats: ['markdown', 'html', 'links', 'screenshot'],
        onlyMainContent: false,
        waitFor: 3000,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Firecrawl API error:', data);
      return new Response(
        JSON.stringify({ success: false, error: data.error || `Request failed with status ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract image URLs from the HTML content
    const htmlContent = data.data?.html || data.html || '';
    const imageRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    const srcsetRegex = /srcset=["']([^"']+)["']/gi;
    
    const images: string[] = [];
    let match;
    
    // Extract from src attributes
    while ((match = imageRegex.exec(htmlContent)) !== null) {
      if (match[1] && !match[1].includes('data:image')) {
        images.push(match[1]);
      }
    }
    
    // Extract from srcset attributes
    while ((match = srcsetRegex.exec(htmlContent)) !== null) {
      if (match[1]) {
        const srcsetUrls = match[1].split(',').map(s => s.trim().split(' ')[0]);
        images.push(...srcsetUrls.filter(url => url && !url.includes('data:image')));
      }
    }

    // Remove duplicates
    const uniqueImages = [...new Set(images)];

    console.log(`Found ${uniqueImages.length} images on fancode.com`);

    return new Response(
      JSON.stringify({ 
        success: true,
        images: uniqueImages,
        screenshot: data.data?.screenshot || data.screenshot,
        metadata: data.data?.metadata || data.metadata,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error scraping fancode.com:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
