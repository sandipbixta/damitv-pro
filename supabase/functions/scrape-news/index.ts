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

    const url = 'https://www.marca.com/en/football.html';
    console.log('Scraping Marca football news from:', url);

    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['markdown', 'html', 'links'],
        onlyMainContent: true,
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

    // Parse the scraped content to extract news articles
    const content = data.data?.markdown || data.markdown || '';
    const html = data.data?.html || data.html || '';
    
    // Extract images from HTML
    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*alt=["']([^"']*)["']/gi;
    const images: { src: string; alt: string }[] = [];
    let match;
    while ((match = imgRegex.exec(html)) !== null) {
      if (match[1] && !match[1].includes('data:image') && !match[1].includes('pixel')) {
        images.push({ src: match[1], alt: match[2] || '' });
      }
    }

    // Parse markdown to extract article-like sections
    const articles: { title: string; description: string; link: string; image?: string }[] = [];
    
    // Extract links that look like article links
    const links = data.data?.links || data.links || [];
    const articleLinks = links.filter((link: string) => 
      link.includes('/football/') && 
      !link.includes('.html?') &&
      link.match(/\/\d{4}\/\d{2}\/\d{2}\//)
    ).slice(0, 20);

    // Parse markdown sections (headlines)
    const headlineRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let headlineMatch;
    while ((headlineMatch = headlineRegex.exec(content)) !== null) {
      const title = headlineMatch[1].trim();
      const link = headlineMatch[2];
      
      if (title.length > 20 && link.includes('marca.com')) {
        // Find a relevant image
        const relevantImage = images.find(img => 
          img.alt.toLowerCase().includes(title.split(' ')[0].toLowerCase()) ||
          title.toLowerCase().includes(img.alt.split(' ')[0].toLowerCase())
        );
        
        articles.push({
          title,
          description: '',
          link,
          image: relevantImage?.src || images[articles.length % images.length]?.src,
        });
      }
    }

    // If we didn't get articles from markdown, try parsing headlines from HTML
    if (articles.length === 0) {
      const headlineHtmlRegex = /<h[23][^>]*>[\s\S]*?<a[^>]+href=["']([^"']+)["'][^>]*>([^<]+)<\/a>/gi;
      while ((headlineMatch = headlineHtmlRegex.exec(html)) !== null) {
        const link = headlineMatch[1];
        const title = headlineMatch[2].trim();
        
        if (title.length > 15) {
          articles.push({
            title,
            description: '',
            link: link.startsWith('http') ? link : `https://www.marca.com${link}`,
            image: images[articles.length % images.length]?.src,
          });
        }
      }
    }

    console.log(`Scraped ${articles.length} articles and ${images.length} images from Marca`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        articles: articles.slice(0, 15),
        images: images.slice(0, 20),
        rawMarkdown: content.substring(0, 5000),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error scraping news:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to scrape news';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
