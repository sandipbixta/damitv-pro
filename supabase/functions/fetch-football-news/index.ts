import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const NEWS_API_KEY = Deno.env.get("NEWS_API_KEY");

// In-memory cache to avoid rate limiting
let cachedArticles: any[] = [];
let cacheTimestamp = 0;
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour cache (increased from 30 min)

// Fallback static articles when rate limited and no cache
const FALLBACK_ARTICLES = [
  {
    title: "Live Sports Coverage Available Now",
    summary: "Watch live matches from Premier League, La Liga, NBA, NFL and more sports.",
    url: "#",
    image: "https://images.unsplash.com/photo-1461896836934- voices-from-around-the-world?w=400",
    source: "DamiTV",
    publishedAt: new Date().toISOString()
  },
  {
    title: "Upcoming Major Sporting Events",
    summary: "Don't miss the biggest games happening this week across all major leagues.",
    url: "#",
    image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400",
    source: "DamiTV",
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
      console.log("NEWS_API_KEY not configured - returning fallback articles");
      return new Response(JSON.stringify({ 
        articles: FALLBACK_ARTICLES,
        cached: false,
        fallback: true,
        totalResults: FALLBACK_ARTICLES.length
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
      
      // If rate limited but we have cached data, return it
      if (response.status === 429 && cachedArticles.length > 0) {
        console.log("Rate limited - returning stale cached articles");
        return new Response(JSON.stringify({ 
          articles: cachedArticles,
          cached: true,
          stale: true,
          totalResults: cachedArticles.length
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      // Return fallback articles on rate limit with no cache
      if (response.status === 429) {
        console.log("Rate limited with no cache - returning fallback articles");
        return new Response(JSON.stringify({ 
          articles: FALLBACK_ARTICLES,
          cached: false,
          fallback: true,
          totalResults: FALLBACK_ARTICLES.length
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
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
    
    console.log(`Cached ${articles.length} articles for 1 hour`);

    return new Response(JSON.stringify({ 
      articles,
      cached: false,
      totalResults: data.totalResults || 0
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Football news fetch error:", error);
    
    // Return cached articles on error if available
    if (cachedArticles.length > 0) {
      console.log("Error occurred - returning stale cached articles");
      return new Response(JSON.stringify({ 
        articles: cachedArticles,
        cached: true,
        stale: true,
        totalResults: cachedArticles.length
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // Return fallback articles
    return new Response(JSON.stringify({ 
      articles: FALLBACK_ARTICLES,
      cached: false,
      fallback: true,
      totalResults: FALLBACK_ARTICLES.length
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
