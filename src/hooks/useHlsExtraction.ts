import { useState, useEffect, useCallback } from 'react';
import { getStreamUrl, ExtractedStream } from '@/utils/streamExtractor';

interface UseHlsExtractionResult {
  extractedUrl: string | null;
  isExtracting: boolean;
  extractionError: string | null;
  isHls: boolean;
  retryExtraction: () => void;
}

// Cache for extraction attempts
const extractionCache = new Map<string, { url: string | null; isHls: boolean; timestamp: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes
const FAILED_CACHE_TTL = 5 * 60 * 1000; // 5 minutes for failed extractions

// Check if cache is valid
const getCachedExtraction = (embedUrl: string) => {
  const cached = extractionCache.get(embedUrl);
  if (!cached) return null;
  
  const ttl = cached.url ? CACHE_TTL : FAILED_CACHE_TTL;
  if (Date.now() - cached.timestamp > ttl) {
    extractionCache.delete(embedUrl);
    return null;
  }
  
  return cached;
};

// Edge function URL for server-side extraction
const EDGE_FUNCTION_URL = 'https://wxvsteaayxgygihpshoz.supabase.co/functions/v1/extract-stream';

/**
 * Attempt HLS extraction from embed URL
 * Priority: Edge function → Client-side extraction
 */
async function attemptHlsExtraction(embedUrl: string): Promise<{ url: string | null; isHls: boolean }> {
  // If already HLS, return as-is
  if (embedUrl.includes('.m3u8')) {
    return { url: embedUrl, isHls: true };
  }
  
  // Check cache first
  const cached = getCachedExtraction(embedUrl);
  if (cached) {
    console.log(`📦 HLS extraction cache hit: ${embedUrl}`);
    return { url: cached.url, isHls: cached.isHls };
  }
  
  console.log(`🔍 Attempting HLS extraction for: ${embedUrl}`);
  
  // Try edge function first (bypasses CORS)
  try {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embedUrl }),
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.hlsUrl) {
        console.log(`✅ Edge function extracted HLS: ${data.hlsUrl}`);
        const result = { url: data.hlsUrl, isHls: true };
        extractionCache.set(embedUrl, { ...result, timestamp: Date.now() });
        return result;
      }
    }
  } catch (error) {
    console.warn('⚠️ Edge function extraction failed:', error);
  }
  
  // Fallback to client-side extraction via CORS proxies
  try {
    const extracted = await getStreamUrl(embedUrl);
    if (extracted && extracted.type === 'hls') {
      console.log(`✅ Client-side extracted HLS: ${extracted.url}`);
      const result = { url: extracted.url, isHls: true };
      extractionCache.set(embedUrl, { ...result, timestamp: Date.now() });
      return result;
    }
  } catch (error) {
    console.warn('⚠️ Client-side extraction failed:', error);
  }
  
  // Cache the failed extraction
  console.log(`❌ No HLS URL found for: ${embedUrl}`);
  const failedResult = { url: null, isHls: false };
  extractionCache.set(embedUrl, { ...failedResult, timestamp: Date.now() });
  return failedResult;
}

/**
 * Hook for extracting HLS streams from embed URLs
 * Automatically attempts extraction when embedUrl changes
 */
export function useHlsExtraction(
  embedUrl: string | undefined | null,
  shouldExtract: boolean = true
): UseHlsExtractionResult {
  const [extractedUrl, setExtractedUrl] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [isHls, setIsHls] = useState(false);
  const [extractionKey, setExtractionKey] = useState(0);

  const performExtraction = useCallback(async () => {
    if (!embedUrl || !shouldExtract) {
      setExtractedUrl(null);
      setIsHls(false);
      return;
    }
    
    // If already HLS, no extraction needed
    if (embedUrl.includes('.m3u8')) {
      setExtractedUrl(embedUrl);
      setIsHls(true);
      return;
    }
    
    setIsExtracting(true);
    setExtractionError(null);
    
    try {
      const result = await attemptHlsExtraction(embedUrl);
      setExtractedUrl(result.url);
      setIsHls(result.isHls);
    } catch (error) {
      console.error('HLS extraction error:', error);
      setExtractionError(error instanceof Error ? error.message : 'Extraction failed');
      setExtractedUrl(null);
      setIsHls(false);
    } finally {
      setIsExtracting(false);
    }
  }, [embedUrl, shouldExtract, extractionKey]);

  useEffect(() => {
    performExtraction();
  }, [performExtraction]);

  const retryExtraction = useCallback(() => {
    if (embedUrl) {
      // Clear cache for this URL
      extractionCache.delete(embedUrl);
      // Trigger re-extraction
      setExtractionKey(prev => prev + 1);
    }
  }, [embedUrl]);

  return {
    extractedUrl,
    isExtracting,
    extractionError,
    isHls,
    retryExtraction,
  };
}

// Export the extraction function for use outside of React components
export { attemptHlsExtraction };
