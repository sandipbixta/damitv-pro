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

    const content = data.data?.markdown || data.markdown || '';
    const html = data.data?.html || data.html || '';
    
    // Extract all images with their context
    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*(?:alt=["']([^"']*)["'])?[^>]*>/gi;
    const images: { src: string; alt: string }[] = [];
    let match;
    while ((match = imgRegex.exec(html)) !== null) {
      const src = match[1];
      if (src && !src.includes('data:image') && !src.includes('pixel') && !src.includes('logo') && !src.includes('icon')) {
        images.push({ src, alt: match[2] || '' });
      }
    }

    // Extract articles from anchor tags with their associated images
    const articles: { title: string; description: string; link: string; image: string; source: string }[] = [];
    
    // Helper function to check if URL is an actual article (has date pattern in URL)
    const isArticleUrl = (url: string): boolean => {
      // Article URLs typically have date pattern like /2024/12/30/ or numeric IDs
      const datePattern = /\/\d{4}\/\d{2}\/\d{2}\//;
      const articlePattern = /\.(html|htm)$/i;
      const hasDateOrId = datePattern.test(url) || /\/\d{6,}/.test(url);
      // Exclude category pages and sections
      const isCategory = /\/(womens-world-cup|champions-league|la-liga|premier-league|transfers)\.html/i.test(url);
      return hasDateOrId && articlePattern.test(url) && !isCategory;
    };
    
    // Parse article blocks - look for article/div structures with images and links
    const articleBlockRegex = /<article[^>]*>[\s\S]*?<\/article>|<div[^>]*class="[^"]*ue-c-cover-content[^"]*"[^>]*>[\s\S]*?<\/div>/gi;
    let articleMatch;
    
    while ((articleMatch = articleBlockRegex.exec(html)) !== null) {
      const block = articleMatch[0];
      
      // Extract image from block
      const blockImgMatch = /<img[^>]+src=["']([^"']+)["']/i.exec(block);
      const imgSrc = blockImgMatch ? blockImgMatch[1] : '';
      
      // Extract link and title from block
      const linkMatch = /<a[^>]+href=["']([^"']+)["'][^>]*>([^<]+)<\/a>/i.exec(block);
      if (linkMatch && linkMatch[2].length > 15) {
        const link = linkMatch[1].startsWith('http') ? linkMatch[1] : `https://www.marca.com${linkMatch[1]}`;
        
        // Only include actual article URLs (not category pages)
        if ((link.includes('/football/') || link.includes('/soccer/') || link.includes('/en/football')) && isArticleUrl(link)) {
          articles.push({
            title: linkMatch[2].trim(),
            description: '',
            link,
            image: imgSrc,
            source: 'Marca'
          });
        }
      }
    }

    // Also extract from headline patterns in markdown
    const headlineRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let headlineMatch;
    while ((headlineMatch = headlineRegex.exec(content)) !== null) {
      const title = headlineMatch[1].trim();
      const link = headlineMatch[2];
      
      // Only include actual article URLs (not category pages)
      if (title.length > 20 && link.includes('marca.com') && 
          (link.includes('/football/') || link.includes('/soccer/') || link.includes('/en/football')) &&
          isArticleUrl(link)) {
        
        // Check if we already have this article
        const exists = articles.some(a => a.link === link || a.title === title);
        if (!exists) {
          // Find relevant image
          const relevantImage = images.find(img => 
            img.alt.toLowerCase().includes(title.split(' ')[0].toLowerCase())
          );
          
          articles.push({
            title,
            description: '',
            link,
            image: relevantImage?.src || images[articles.length % Math.max(1, images.length)]?.src || '',
            source: 'Marca'
          });
        }
      }
    }

    // Extract h2/h3 headlines with links specifically for football
    const headlineHtmlRegex = /<h[23][^>]*>[\s\S]*?<a[^>]+href=["']([^"']+)["'][^>]*>([^<]+)<\/a>[\s\S]*?<\/h[23]>/gi;
    while ((headlineMatch = headlineHtmlRegex.exec(html)) !== null) {
      const link = headlineMatch[1].startsWith('http') ? headlineMatch[1] : `https://www.marca.com${headlineMatch[1]}`;
      const title = headlineMatch[2].trim();
      
      if (title.length > 15 && (link.includes('/football/') || link.includes('/soccer/')) && isArticleUrl(link)) {
        const exists = articles.some(a => a.link === link || a.title === title);
        if (!exists) {
          articles.push({
            title,
            description: '',
            link,
            image: images[articles.length % Math.max(1, images.length)]?.src || '',
            source: 'Marca'
          });
        }
      }
    }

    // Deduplicate by link URL (most reliable unique identifier)
    const seenLinks = new Set<string>();
    const uniqueArticles = articles.filter(article => {
      if (!article.title || !article.link) return false;
      const normalizedLink = article.link.toLowerCase().trim();
      if (seenLinks.has(normalizedLink)) return false;
      seenLinks.add(normalizedLink);
      return true;
    });

    // Log each article for debugging
    uniqueArticles.forEach((article, index) => {
      console.log(`Article ${index}: "${article.title.slice(0, 40)}..." -> ${article.link}`);
    });

    console.log(`Scraped ${uniqueArticles.length} unique football articles and ${images.length} images from Marca`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        articles: uniqueArticles.slice(0, 20),
        images: images.slice(0, 30),
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
