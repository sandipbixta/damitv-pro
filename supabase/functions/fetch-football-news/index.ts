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

// Fallback articles when rate limited and no cache available
const FALLBACK_ARTICLES = [
  {
    title: "Premier League Weekend Preview: Top Teams Battle for Supremacy",
    summary: "The Premier League returns with exciting matchups as title contenders clash in crucial fixtures.",
    url: "https://www.bbc.com/sport/football",
    image: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&q=80",
    source: "Sports News",
    publishedAt: new Date().toISOString()
  },
  {
    title: "Champions League Quarter-Finals: Draw and Key Matchups Revealed",
    summary: "Europe's elite clubs prepare for thrilling quarter-final encounters in the Champions League.",
    url: "https://www.uefa.com/uefachampionsleague/",
    image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80",
    source: "UEFA",
    publishedAt: new Date().toISOString()
  },
  {
    title: "La Liga Title Race Heats Up as Real Madrid and Barcelona Face Off",
    summary: "Spanish football's biggest rivalry takes center stage in an electrifying El Clasico showdown.",
    url: "https://www.laliga.com/",
    image: "https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=800&q=80",
    source: "La Liga",
    publishedAt: new Date().toISOString()
  },
  {
    title: "Serie A: Inter Milan Continue Dominant Run Towards the Scudetto",
    summary: "Inter Milan extend their lead at the top of Serie A with another commanding victory.",
    url: "https://www.legaseriea.it/",
    image: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&q=80",
    source: "Serie A",
    publishedAt: new Date().toISOString()
  },
  {
    title: "Bundesliga Action: Bayern Munich Face Stiff Competition from Rivals",
    summary: "The German top flight delivers excitement as Bayern Munich battle for league supremacy.",
    url: "https://www.bundesliga.com/",
    image: "https://images.unsplash.com/photo-1606925797300-0b35e9d1794e?w=800&q=80",
    source: "Bundesliga",
    publishedAt: new Date().toISOString()
  },
  {
    title: "Transfer Window: Latest Rumors and Confirmed Deals in European Football",
    summary: "Stay updated with the latest transfer news as clubs prepare for the upcoming window.",
    url: "https://www.transfermarkt.com/",
    image: "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=800&q=80",
    source: "Transfer News",
    publishedAt: new Date().toISOString()
  }
];

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
        
        // Return fallback articles when rate limited and no cache
        console.log("Rate limited with no cache, returning fallback articles");
        return new Response(JSON.stringify({ 
          articles: FALLBACK_ARTICLES,
          totalResults: FALLBACK_ARTICLES.length,
          cached: false,
          fallback: true
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
    
    // Return fallback articles on any error when no cache
    console.log("Error with no cache, returning fallback articles");
    return new Response(JSON.stringify({ 
      articles: FALLBACK_ARTICLES,
      totalResults: FALLBACK_ARTICLES.length,
      cached: false,
      fallback: true
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
