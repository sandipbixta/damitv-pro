import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const NEWS_API_KEY = Deno.env.get("NEWS_API_KEY");

interface NewsArticle {
  title: string;
  description: string;
  url: string;
  urlToImage: string;
  source: { name: string };
  publishedAt: string;
}

interface CachedData {
  articles: any[];
  totalResults: number;
  cachedAt: number;
}

// In-memory cache with 15-minute TTL
let cache: CachedData | null = null;
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!NEWS_API_KEY) {
      throw new Error("NEWS_API_KEY is not configured");
    }

    // Check cache first
    const now = Date.now();
    if (cache && (now - cache.cachedAt) < CACHE_TTL_MS) {
      console.log("Returning cached news data (cached", Math.round((now - cache.cachedAt) / 1000), "seconds ago)");
      return new Response(JSON.stringify({ 
        articles: cache.articles,
        totalResults: cache.totalResults,
        cached: true
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Cache miss or expired. Fetching fresh news from NewsAPI...");

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
      
      if (response.status === 429) {
        // If rate limited but we have stale cache, return it
        if (cache) {
          console.log("Rate limited, returning stale cache");
          return new Response(JSON.stringify({ 
            articles: cache.articles,
            totalResults: cache.totalResults,
            cached: true,
            stale: true
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        return new Response(JSON.stringify({ 
          error: "Rate limited. Please try again later.",
          articles: []
        }), {
          status: 429,
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

    console.log(`Returning ${articles.length} formatted articles`);

    // Update cache
    cache = {
      articles,
      totalResults: data.totalResults || 0,
      cachedAt: now
    };

    return new Response(JSON.stringify({ 
      articles,
      totalResults: data.totalResults || 0,
      cached: false
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Football news fetch error:", error);
    
    // If we have any cache, return it on error
    if (cache) {
      console.log("Error occurred, returning stale cache as fallback");
      return new Response(JSON.stringify({ 
        articles: cache.articles,
        totalResults: cache.totalResults,
        cached: true,
        stale: true
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error",
      articles: []
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
