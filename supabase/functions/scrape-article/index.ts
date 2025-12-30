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
    const { articleUrl } = await req.json();
    
    if (!articleUrl) {
      return new Response(
        JSON.stringify({ success: false, error: 'Article URL is required' }),
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

    console.log('Scraping article from:', articleUrl);

    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: articleUrl,
        formats: ['markdown', 'html'],
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

    const markdown = data.data?.markdown || data.markdown || '';
    const html = data.data?.html || data.html || '';
    const metadata = data.data?.metadata || data.metadata || {};

    // Extract title from metadata or HTML - try multiple patterns
    let title = metadata.title || metadata.ogTitle || '';
    if (!title || title.includes('Marca')) {
      const titleMatch = /<h1[^>]*class="[^"]*ue-c-article__headline[^"]*"[^>]*>([^<]+)<\/h1>/i.exec(html) ||
                        /<h1[^>]*>([^<]+)<\/h1>/i.exec(html);
      if (titleMatch) {
        title = titleMatch[1].trim();
      }
    }
    // Clean up title - remove site name suffix
    title = title.replace(/\s*[-|]\s*MARCA.*$/i, '').trim();

    // Extract main image from multiple sources
    let mainImage = metadata.ogImage || metadata.image || '';
    if (!mainImage) {
      // Try to find article featured image
      const imgPatterns = [
        /<figure[^>]*class="[^"]*ue-c-article__image[^"]*"[^>]*>[\s\S]*?<img[^>]+src=["']([^"']+)["']/i,
        /<img[^>]+class="[^"]*ue-c-article[^"]*"[^>]+src=["']([^"']+)["']/i,
        /<picture[^>]*>[\s\S]*?<img[^>]+src=["']([^"']+)["']/i,
        /<img[^>]+src=["']([^"']+)["'][^>]*>/i
      ];
      for (const pattern of imgPatterns) {
        const match = pattern.exec(html);
        if (match && !match[1].includes('logo') && !match[1].includes('icon') && !match[1].includes('avatar')) {
          mainImage = match[1];
          break;
        }
      }
    }

    // Extract author if available - try multiple patterns
    let author = metadata.author || '';
    if (!author) {
      const authorPatterns = [
        /<meta[^>]+name=["']author["'][^>]+content=["']([^"']+)["']/i,
        /<a[^>]+class="[^"]*ue-c-article__author[^"]*"[^>]*>([^<]+)<\/a>/i,
        /<span[^>]+class="[^"]*author[^"]*"[^>]*>([^<]+)<\/span>/i
      ];
      for (const pattern of authorPatterns) {
        const match = pattern.exec(html);
        if (match) {
          author = match[1].trim();
          break;
        }
      }
    }

    // Extract publish date
    let publishDate = metadata.publishedTime || metadata.datePublished || '';
    if (!publishDate) {
      const datePatterns = [
        /<time[^>]+datetime=["']([^"']+)["']/i,
        /<meta[^>]+property=["']article:published_time["'][^>]+content=["']([^"']+)["']/i
      ];
      for (const pattern of datePatterns) {
        const match = pattern.exec(html);
        if (match) {
          publishDate = match[1];
          break;
        }
      }
    }

    // Clean markdown content - remove navigation, ads, footer, etc.
    let cleanContent = markdown
      .replace(/\[.*?\]\(javascript:.*?\)/g, '') // Remove JS links
      .replace(/\[Cookie Settings\].*$/gm, '') // Remove cookie notices
      .replace(/\[Sign up\].*$/gm, '') // Remove signup prompts
      .replace(/\[Subscribe\].*$/gm, '') // Remove subscribe prompts
      .replace(/^#{1,6}\s*Menu.*$/gm, '') // Remove menu headers
      .replace(/^#{1,6}\s*Navigation.*$/gm, '') // Remove navigation headers
      .replace(/^\s*[-*]\s*\[.*?\]\(.*?\)\s*$/gm, '') // Remove nav links
      .replace(/^Related articles?:?.*$/gmi, '') // Remove related articles section
      .replace(/^More:?\s*\[.*$/gm, '') // Remove "More" links
      .replace(/^Share this article.*$/gmi, '') // Remove share prompts
      .replace(/^Follow us on.*$/gmi, '') // Remove social links
      .replace(/^Advertisement.*$/gmi, '') // Remove ad markers
      .replace(/^\[AD\].*$/gm, '') // Remove ad blocks
      .replace(/La Liga\s*\|.*$/gm, '') // Remove Marca navigation breadcrumbs
      .replace(/Premier League\s*\|.*$/gm, '')
      .replace(/\n{3,}/g, '\n\n') // Clean up extra newlines
      .trim();

    // If content is too short, it might be a category page - log warning
    if (cleanContent.length < 200) {
      console.warn('Article content seems too short, may be a category page:', articleUrl);
    }

    console.log('Successfully scraped article:', title, '- Content length:', cleanContent.length);

    return new Response(
      JSON.stringify({ 
        success: true, 
        article: {
          title,
          content: cleanContent,
          html,
          image: mainImage,
          author,
          publishDate,
          sourceUrl: articleUrl,
          source: 'Marca'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error scraping article:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to scrape article';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
