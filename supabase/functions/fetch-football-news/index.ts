import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const NEWS_API_KEY = Deno.env.get("NEWS_API_KEY");

// In-memory cache to avoid rate limiting
let cachedArticles: any[] = [];
let cacheTimestamp = 0;
const CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutes cache

// Fallback articles when API is rate limited and no cache exists
const fallbackArticles = [
  {
    title: "Top Sports Headlines - Live Updates",
    summary: "Stay tuned for the latest sports news and match updates from around the world.",
    url: "https://damitv-pro.lovable.app/news",
    image: "https://picsum.photos/seed/sports1/800/450",
    source: "DamiTV Sports",
    publishedAt: new Date().toISOString()
  },
  {
    title: "Football Transfer News & Rumors",
    summary: "Latest transfer updates, rumors, and confirmed signings from top European leagues.",
    url: "https://damitv-pro.lovable.app/news",
    image: "https://picsum.photos/seed/football1/800/450",
    source: "DamiTV Sports",
    publishedAt: new Date().toISOString()
  },
  {
    title: "Premier League Match Day Preview",
    summary: "Get ready for this weekend's Premier League action with our comprehensive match previews.",
    url: "https://damitv-pro.lovable.app/news",
    image: "https://picsum.photos/seed/premier1/800/450",
    source: "DamiTV Sports",
    publishedAt: new Date().toISOString()
  },
  {
    title: "Champions League Latest Updates",
    summary: "UEFA Champions League news, results, and upcoming fixtures from Europe's elite competition.",
    url: "https://damitv-pro.lovable.app/news",
    image: "https://picsum.photos/seed/ucl1/800/450",
    source: "DamiTV Sports",
    publishedAt: new Date().toISOString()
  }
];

interface NewsArticle {
  title: string;
  description: string;
  url: string;
  urlToImage: string;
  source: { name: string };
  publishedAt: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const now = Date.now();
    
    // Return cached data if still valid
    if (cachedArticles.length > 0 && (now - cacheTimestamp) < CACHE_DURATION_MS) {
      console.log("Returning cached articles (cache valid for", Math.round((CACHE_DURATION_MS - (now - cacheTimestamp)) / 60000), "more minutes)");
      return new Response(JSON.stringify({ 
        articles: cachedArticles,
        cached: true,
        totalResults: cachedArticles.length
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!NEWS_API_KEY) {
      throw new Error("NEWS_API_KEY is not configured");
    }

    console.log("Fetching fresh sports news from NewsAPI...");

    // Fetch sports news from NewsAPI
    const response = await fetch(
      `https://newsapi.org/v2/top-headlines?` + new URLSearchParams({
        category: "sports",
        language: "en",
        pageSize: "6",
        apiKey: NEWS_API_KEY
      }),
      {
        headers: {
          "Accept": "application/json"
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("NewsAPI error:", response.status, errorText);
      
      // If rate limited, return cached or fallback articles
      if (response.status === 429) {
        const articlesToReturn = cachedArticles.length > 0 ? cachedArticles : fallbackArticles;
        console.log(`Rate limited - returning ${cachedArticles.length > 0 ? 'cached' : 'fallback'} articles`);
        return new Response(JSON.stringify({ 
          articles: articlesToReturn,
          cached: true,
          stale: true,
          fallback: cachedArticles.length === 0,
          totalResults: articlesToReturn.length
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      }
      
      
      throw new Error(`NewsAPI error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`Received ${data.articles?.length || 0} articles from NewsAPI`);

    // Transform to our format, filtering out articles without images
    const articles = (data.articles || [])
      .filter((article: NewsArticle) => 
        article.urlToImage && 
        article.title && 
        !article.title.includes("[Removed]")
      )
      .slice(0, 6)
      .map((article: NewsArticle) => ({
        title: article.title,
        summary: article.description || "",
        url: article.url,
        image: article.urlToImage,
        source: article.source?.name || "Unknown",
        publishedAt: article.publishedAt
      }));

    // Update cache
    cachedArticles = articles;
    cacheTimestamp = now;
    
    console.log(`Cached ${articles.length} articles for 30 minutes`);

    return new Response(JSON.stringify({ 
      articles,
      cached: false,
      totalResults: data.totalResults || 0
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Football news fetch error:", error);
    
    // Return cached or fallback articles on error
    const articlesToReturn = cachedArticles.length > 0 ? cachedArticles : fallbackArticles;
    console.log(`Error occurred - returning ${cachedArticles.length > 0 ? 'cached' : 'fallback'} articles`);
    
    return new Response(JSON.stringify({ 
      articles: articlesToReturn,
      cached: true,
      stale: true,
      fallback: cachedArticles.length === 0,
      totalResults: articlesToReturn.length
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
