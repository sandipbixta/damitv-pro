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

    // Extract title from metadata or HTML
    let title = metadata.title || '';
    const titleMatch = /<h1[^>]*>([^<]+)<\/h1>/i.exec(html);
    if (!title && titleMatch) {
      title = titleMatch[1].trim();
    }

    // Extract main image
    let mainImage = metadata.ogImage || metadata.image || '';
    if (!mainImage) {
      const imgMatch = /<img[^>]+src=["']([^"']+)["'][^>]*>/i.exec(html);
      if (imgMatch && !imgMatch[1].includes('logo') && !imgMatch[1].includes('icon')) {
        mainImage = imgMatch[1];
      }
    }

    // Extract author if available
    let author = '';
    const authorMatch = /<meta[^>]+name=["']author["'][^>]+content=["']([^"']+)["']/i.exec(html);
    if (authorMatch) {
      author = authorMatch[1];
    }

    // Extract publish date
    let publishDate = metadata.publishedTime || '';
    if (!publishDate) {
      const dateMatch = /<time[^>]+datetime=["']([^"']+)["']/i.exec(html);
      if (dateMatch) {
        publishDate = dateMatch[1];
      }
    }

    // Clean markdown content - remove navigation, ads, etc.
    let cleanContent = markdown
      .replace(/\[.*?\]\(javascript:.*?\)/g, '') // Remove JS links
      .replace(/\[Cookie Settings\].*$/gm, '') // Remove cookie notices
      .replace(/\[Sign up\].*$/gm, '') // Remove signup prompts
      .replace(/\[Subscribe\].*$/gm, '') // Remove subscribe prompts
      .replace(/^#{1,6}\s*Menu.*$/gm, '') // Remove menu headers
      .replace(/^#{1,6}\s*Navigation.*$/gm, '') // Remove navigation headers
      .replace(/^\s*[-*]\s*\[.*?\]\(.*?\)\s*$/gm, '') // Remove nav links
      .replace(/\n{3,}/g, '\n\n') // Clean up extra newlines
      .trim();

    console.log('Successfully scraped article:', title);

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
