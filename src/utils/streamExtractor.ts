// Stream URL extraction utilities
export interface ExtractedStream {
  url: string;
  type: 'hls' | 'mp4' | 'unknown';
  quality?: string;
}

// Common patterns for extracting stream URLs from embed pages
const STREAM_PATTERNS = [
  // HLS patterns
  /source["\s]*:["\s]*["']([^"']*\.m3u8[^"']*)['"]/gi,
  /src["\s]*:["\s]*["']([^"']*\.m3u8[^"']*)['"]/gi,
  /file["\s]*:["\s]*["']([^"']*\.m3u8[^"']*)['"]/gi,
  /playlist["\s]*:["\s]*["']([^"']*\.m3u8[^"']*)['"]/gi,
  
  // MP4 patterns
  /source["\s]*:["\s]*["']([^"']*\.mp4[^"']*)['"]/gi,
  /src["\s]*:["\s]*["']([^"']*\.mp4[^"']*)['"]/gi,
  /file["\s]*:["\s]*["']([^"']*\.mp4[^"']*)['"]/gi,
  
  // Generic video patterns
  /["']([^"']*\.(m3u8|mp4|webm|ogg)[^"']*)['"]/gi,
];

// Proxy service to bypass CORS when fetching embed pages
const PROXY_SERVICES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
  'https://cors-anywhere.herokuapp.com/',
];

export async function extractStreamUrl(embedUrl: string): Promise<ExtractedStream | null> {
  try {
    // First, try to detect if it's already a direct stream
    if (embedUrl.includes('.m3u8')) {
      return { url: embedUrl, type: 'hls' };
    }
    if (embedUrl.includes('.mp4')) {
      return { url: embedUrl, type: 'mp4' };
    }

    // Try to fetch the embed page to extract stream URLs
    let pageContent = '';
    
    for (const proxyService of PROXY_SERVICES) {
      try {
        const response = await fetch(proxyService + encodeURIComponent(embedUrl), {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        });
        
        if (response.ok) {
          pageContent = await response.text();
          break;
        }
      } catch (error) {
        console.warn(`Failed to fetch via ${proxyService}:`, error);
        continue;
      }
    }

    if (!pageContent) {
      console.warn('Could not fetch embed page content');
      return null;
    }

    // Try to extract stream URLs using patterns
    const extractedUrls: ExtractedStream[] = [];
    
    for (const pattern of STREAM_PATTERNS) {
      pattern.lastIndex = 0; // Reset regex
      let match;
      while ((match = pattern.exec(pageContent)) !== null) {
        const url = match[1];
        if (url && url.length > 10) { // Basic validation
          const type = url.includes('.m3u8') ? 'hls' : 
                      url.includes('.mp4') ? 'mp4' : 'unknown';
          
          // Make URL absolute if needed
          let absoluteUrl = url;
          if (url.startsWith('//')) {
            absoluteUrl = 'https:' + url;
          } else if (url.startsWith('/')) {
            const embedDomain = new URL(embedUrl).origin;
            absoluteUrl = embedDomain + url;
          } else if (!url.startsWith('http')) {
            const embedBase = embedUrl.substring(0, embedUrl.lastIndexOf('/') + 1);
            absoluteUrl = embedBase + url;
          }
          
          extractedUrls.push({ url: absoluteUrl, type });
        }
      }
    }

    // Prefer HLS streams, then MP4
    const hlsStream = extractedUrls.find(s => s.type === 'hls');
    if (hlsStream) return hlsStream;
    
    const mp4Stream = extractedUrls.find(s => s.type === 'mp4');
    if (mp4Stream) return mp4Stream;
    
    // Return first found stream
    if (extractedUrls.length > 0) {
      return extractedUrls[0];
    }

    return null;
  } catch (error) {
    console.error('Stream extraction failed:', error);
    return null;
  }
}

// Cache extracted streams to avoid repeated requests
const streamCache = new Map<string, ExtractedStream | null>();

export async function getStreamUrl(embedUrl: string): Promise<ExtractedStream | null> {
  if (streamCache.has(embedUrl)) {
    return streamCache.get(embedUrl) || null;
  }
  
  const extracted = await extractStreamUrl(embedUrl);
  streamCache.set(embedUrl, extracted);
  
  // Clear cache after 10 minutes
  setTimeout(() => {
    streamCache.delete(embedUrl);
  }, 10 * 60 * 1000);
  
  return extracted;
}