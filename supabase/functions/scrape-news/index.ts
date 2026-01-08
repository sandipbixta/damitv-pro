import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Article {
  title: string;
  description: string;
  link: string;
  image: string;
  source: string;
}

// Helper function to check if URL is an actual article
const isArticleUrl = (url: string, source: string): boolean => {
  if (source === 'Marca') {
    const datePattern = /\/\d{4}\/\d{2}\/\d{2}\//;
    const articlePattern = /\.(html|htm)$/i;
    const hasDateOrId = datePattern.test(url) || /\/\d{6,}/.test(url);
    const isCategory = /\/(womens-world-cup|champions-league|la-liga|premier-league|transfers)\.html/i.test(url);
    return hasDateOrId && articlePattern.test(url) && !isCategory;
  }
  if (source === 'Goal') {
    // Goal.com article URLs typically have format: /en-au/news/article-slug
    return url.includes('/news/') && !url.endsWith('/news/') && !url.includes('/lists/');
  }
  return false;
};

// Scrape Marca
async function scrapeMarca(apiKey: string): Promise<Article[]> {
  const articles: Article[] = [];
  
  try {
    console.log('Scraping Marca...');
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://www.marca.com/en/football.html',
        formats: ['markdown', 'html', 'links'],
        onlyMainContent: true,
        waitFor: 3000,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('Marca scrape failed:', data);
      return articles;
    }

    const content = data.data?.markdown || data.markdown || '';
    const html = data.data?.html || data.html || '';
    
    // Extract images
    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*(?:alt=["']([^"']*)["'])?[^>]*>/gi;
    const images: { src: string; alt: string }[] = [];
    let match;
    while ((match = imgRegex.exec(html)) !== null) {
      const src = match[1];
      if (src && !src.includes('data:image') && !src.includes('pixel') && !src.includes('logo') && !src.includes('icon')) {
        images.push({ src, alt: match[2] || '' });
      }
    }

    // Parse article blocks
    const articleBlockRegex = /<article[^>]*>[\s\S]*?<\/article>|<div[^>]*class="[^"]*ue-c-cover-content[^"]*"[^>]*>[\s\S]*?<\/div>/gi;
    let articleMatch;
    
    while ((articleMatch = articleBlockRegex.exec(html)) !== null) {
      const block = articleMatch[0];
      const blockImgMatch = /<img[^>]+src=["']([^"']+)["']/i.exec(block);
      const imgSrc = blockImgMatch ? blockImgMatch[1] : '';
      const linkMatch = /<a[^>]+href=["']([^"']+)["'][^>]*>([^<]+)<\/a>/i.exec(block);
      
      if (linkMatch && linkMatch[2].length > 15) {
        const link = linkMatch[1].startsWith('http') ? linkMatch[1] : `https://www.marca.com${linkMatch[1]}`;
        if ((link.includes('/football/') || link.includes('/soccer/') || link.includes('/en/football')) && isArticleUrl(link, 'Marca')) {
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

    // Also extract from markdown headlines
    const headlineRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let headlineMatch;
    while ((headlineMatch = headlineRegex.exec(content)) !== null) {
      const title = headlineMatch[1].trim();
      const link = headlineMatch[2];
      
      if (title.length > 20 && link.includes('marca.com') && 
          (link.includes('/football/') || link.includes('/soccer/') || link.includes('/en/football')) &&
          isArticleUrl(link, 'Marca')) {
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

    console.log(`Scraped ${articles.length} articles from Marca`);
  } catch (error) {
    console.error('Error scraping Marca:', error);
  }
  
  return articles;
}

// Scrape Goal.com
async function scrapeGoal(apiKey: string): Promise<Article[]> {
  const articles: Article[] = [];
  
  try {
    console.log('Scraping Goal.com...');
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://www.goal.com/en-au',
        formats: ['markdown', 'html', 'links'],
        onlyMainContent: true,
        waitFor: 3000,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('Goal scrape failed:', data);
      return articles;
    }

    const html = data.data?.html || data.html || '';
    const content = data.data?.markdown || data.markdown || '';
    
    // Extract images
    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    const images: string[] = [];
    let imgMatch;
    while ((imgMatch = imgRegex.exec(html)) !== null) {
      const src = imgMatch[1];
      if (src && !src.includes('data:image') && !src.includes('pixel') && !src.includes('logo') && !src.includes('icon') && src.includes('http')) {
        images.push(src);
      }
    }

    // Extract article links with titles from HTML
    const linkRegex = /<a[^>]+href=["']([^"']*goal\.com[^"']*\/news\/[^"']+)["'][^>]*>([^<]{15,})<\/a>/gi;
    let linkMatch;
    while ((linkMatch = linkRegex.exec(html)) !== null) {
      const link = linkMatch[1];
      const title = linkMatch[2].trim();
      
      if (isArticleUrl(link, 'Goal') && title.length > 15) {
        const exists = articles.some(a => a.link === link || a.title === title);
        if (!exists) {
          articles.push({
            title,
            description: '',
            link: link.startsWith('http') ? link : `https://www.goal.com${link}`,
            image: images[articles.length % Math.max(1, images.length)] || '',
            source: 'Goal'
          });
        }
      }
    }

    // Also extract from markdown
    const mdLinkRegex = /\[([^\]]{15,})\]\((https?:\/\/[^\)]*goal\.com[^\)]*\/news\/[^\)]+)\)/g;
    let mdMatch;
    while ((mdMatch = mdLinkRegex.exec(content)) !== null) {
      const title = mdMatch[1].trim();
      const link = mdMatch[2];
      
      if (isArticleUrl(link, 'Goal')) {
        const exists = articles.some(a => a.link === link || a.title === title);
        if (!exists) {
          articles.push({
            title,
            description: '',
            link,
            image: images[articles.length % Math.max(1, images.length)] || '',
            source: 'Goal'
          });
        }
      }
    }

    console.log(`Scraped ${articles.length} articles from Goal.com`);
  } catch (error) {
    console.error('Error scraping Goal:', error);
  }
  
  return articles;
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
        JSON.stringify({ success: false, error: 'Firecrawl connector not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Scrape both sources in parallel
    const [marcaArticles, goalArticles] = await Promise.all([
      scrapeMarca(apiKey),
      scrapeGoal(apiKey)
    ]);

    // Combine and deduplicate
    const allArticles = [...marcaArticles, ...goalArticles];
    const seenLinks = new Set<string>();
    const uniqueArticles = allArticles.filter(article => {
      if (!article.title || !article.link) return false;
      const normalizedLink = article.link.toLowerCase().trim();
      if (seenLinks.has(normalizedLink)) return false;
      seenLinks.add(normalizedLink);
      return true;
    });

    // Shuffle to mix sources
    const shuffledArticles = uniqueArticles.sort(() => Math.random() - 0.5);

    // Log for debugging
    shuffledArticles.slice(0, 10).forEach((article, index) => {
      console.log(`Article ${index}: [${article.source}] "${article.title.slice(0, 40)}..." -> ${article.link}`);
    });

    console.log(`Total: ${shuffledArticles.length} unique articles (Marca: ${marcaArticles.length}, Goal: ${goalArticles.length})`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        articles: shuffledArticles.slice(0, 20),
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
