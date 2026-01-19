// Stream Extraction Service - Uses edge function to extract HLS URLs server-side
import { supabase } from '@/integrations/supabase/client';

interface ExtractedStream {
  success: boolean;
  streamUrl?: string;
  type?: 'hls' | 'mp4';
  source?: string;
  alternatives?: { url: string; type: string }[];
  error?: string;
}

// In-memory cache for extracted streams
const extractionCache = new Map<string, { data: ExtractedStream; timestamp: number }>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

/**
 * Extract direct HLS/MP4 stream URL from an embed page using server-side edge function.
 * This bypasses ads by fetching the page content server-side and extracting the video source.
 */
export async function extractStreamUrl(embedUrl: string, referer?: string): Promise<ExtractedStream> {
  // Check cache first
  const cacheKey = embedUrl;
  const cached = extractionCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log('📦 Stream extraction cache HIT');
    return cached.data;
  }

  try {
    console.log(`🔍 Extracting stream via edge function: ${embedUrl.substring(0, 60)}...`);
    
    const { data, error } = await supabase.functions.invoke('extract-stream', {
      body: { embedUrl, referer }
    });

    if (error) {
      console.error('❌ Edge function error:', error);
      return { success: false, error: error.message };
    }

    // Cache successful extractions
    if (data?.success) {
      extractionCache.set(cacheKey, { data, timestamp: Date.now() });
      console.log(`✅ Extracted ${data.type?.toUpperCase()} stream: ${data.streamUrl?.substring(0, 80)}...`);
    }

    return data as ExtractedStream;
  } catch (error) {
    console.error('❌ Stream extraction failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Try to get an ad-free stream URL. Returns the extracted URL if successful,
 * or null if extraction failed (caller should fall back to iframe).
 */
export async function getAdFreeStreamUrl(embedUrl: string): Promise<string | null> {
  // Skip extraction for URLs that are already direct streams
  if (embedUrl.includes('.m3u8') || embedUrl.includes('.mp4')) {
    return embedUrl;
  }

  const result = await extractStreamUrl(embedUrl);
  
  if (result.success && result.streamUrl) {
    return result.streamUrl;
  }

  return null;
}

// Clear extraction cache
export function clearExtractionCache(): void {
  extractionCache.clear();
  console.log('🗑️ Stream extraction cache cleared');
}
