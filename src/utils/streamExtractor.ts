// Stream URL extraction utilities - Enhanced patterns for HLS detection
export interface ExtractedStream {
  url: string;
  type: 'hls' | 'mp4' | 'unknown';
  quality?: string;
}

// Enhanced patterns for extracting stream URLs from embed pages
const STREAM_PATTERNS = [
  // Standard source/file patterns - HLS
  /source["\s]*:["\s]*["']([^"']*\.m3u8[^"']*)['"]/gi,
  /src["\s]*:["\s]*["']([^"']*\.m3u8[^"']*)['"]/gi,
  /file["\s]*:["\s]*["']([^"']*\.m3u8[^"']*)['"]/gi,
  /playlist["\s]*:["\s]*["']([^"']*\.m3u8[^"']*)['"]/gi,
  
  // JWPlayer patterns
  /jwplayer\s*\([^)]*\)\s*\.setup\s*\(\s*\{[^}]*file\s*:\s*["']([^"']*\.m3u8[^"']*)['"]/gi,
  /jwplayer\s*\([^)]*\)\s*\.setup\s*\(\s*\{[^}]*sources\s*:\s*\[[^\]]*["']([^"']*\.m3u8[^"']*)['"]/gi,
  
  // Video.js patterns
  /videojs\s*\([^)]*\)[^}]*sources\s*:\s*\[[^\]]*["']([^"']*\.m3u8[^"']*)['"]/gi,
  /videojs\s*\([^)]*\)[^}]*src\s*:\s*["']([^"']*\.m3u8[^"']*)['"]/gi,
  
  // HLS.js patterns
  /hls\.loadSource\s*\(\s*["']([^"']*\.m3u8[^"']*)['"]/gi,
  /new\s+Hls\s*\([^)]*\)[^}]*loadSource\s*\(\s*["']([^"']*\.m3u8[^"']*)['"]/gi,
  
  // Plyr patterns
  /plyr\.source\s*=\s*\{[^}]*src\s*:\s*["']([^"']*\.m3u8[^"']*)['"]/gi,
  
  // Clappr patterns
  /new\s+Clappr\.Player\s*\([^)]*source\s*:\s*["']([^"']*\.m3u8[^"']*)['"]/gi,
  /new\s+Clappr\s*\([^)]*source\s*:\s*["']([^"']*\.m3u8[^"']*)['"]/gi,
  
  // FlowPlayer patterns
  /flowplayer\s*\([^)]*\)\s*\.\s*load\s*\(\s*["']([^"']*\.m3u8[^"']*)['"]/gi,
  
  // Variable assignment patterns
  /(?:var|let|const)\s+\w+\s*=\s*["']([^"']*\.m3u8[^"']*)['"]/gi,
  /streamUrl\s*=\s*["']([^"']*\.m3u8[^"']*)['"]/gi,
  /videoUrl\s*=\s*["']([^"']*\.m3u8[^"']*)['"]/gi,
  /hlsUrl\s*=\s*["']([^"']*\.m3u8[^"']*)['"]/gi,
  /m3u8Url\s*=\s*["']([^"']*\.m3u8[^"']*)['"]/gi,
  
  // JSON patterns
  /"(?:url|src|file|stream|source)"\s*:\s*"([^"]*\.m3u8[^"]*)"/gi,
  /'(?:url|src|file|stream|source)'\s*:\s*'([^']*\.m3u8[^']*)'/gi,
  
  // HTML5 video patterns
  /<source[^>]*src=["']([^"']*\.m3u8[^"']*)["'][^>]*>/gi,
  /<video[^>]*src=["']([^"']*\.m3u8[^"']*)["'][^>]*>/gi,
  
  // Generic HLS patterns (last resort)
  /["']([^"']*\.m3u8(?:\?[^"']*)?)['"]/gi,
  
  // MP4 patterns
  /source["\s]*:["\s]*["']([^"']*\.mp4[^"']*)['"]/gi,
  /src["\s]*:["\s]*["']([^"']*\.mp4[^"']*)['"]/gi,
  /file["\s]*:["\s]*["']([^"']*\.mp4[^"']*)['"]/gi,
  
  // Generic video patterns
  /["']([^"']*\.(m3u8|mp4|webm|ogg)[^"']*)['"]/gi,
];

// Base64 patterns for obfuscated URLs
const BASE64_PATTERNS = [
  /atob\s*\(\s*["']([A-Za-z0-9+/=]+)["']\s*\)/g,
  /decodeURIComponent\s*\(\s*escape\s*\(\s*atob\s*\(\s*["']([A-Za-z0-9+/=]+)["']\s*\)/g,
];

// Try to decode base64 and check for stream URLs
function tryDecodeBase64(content: string): string[] {
  const foundUrls: string[] = [];
  
  for (const pattern of BASE64_PATTERNS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(content)) !== null) {
      try {
        const decoded = atob(match[1]);
        if (decoded.includes('.m3u8') || decoded.includes('.mp4')) {
          foundUrls.push(decoded);
        }
      } catch {
        // Not valid base64
      }
    }
  }
  
  return foundUrls;
}

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
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout
        
        const response = await fetch(proxyService + encodeURIComponent(embedUrl), {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
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
    
    // First try base64 encoded URLs
    const base64Urls = tryDecodeBase64(pageContent);
    for (const url of base64Urls) {
      const type = url.includes('.m3u8') ? 'hls' : url.includes('.mp4') ? 'mp4' : 'unknown';
      const absoluteUrl = makeAbsoluteUrl(url, embedUrl);
      if (absoluteUrl) {
        extractedUrls.push({ url: absoluteUrl, type });
      }
    }
    
    // Then try regex patterns
    for (const pattern of STREAM_PATTERNS) {
      pattern.lastIndex = 0; // Reset regex
      let match;
      while ((match = pattern.exec(pageContent)) !== null) {
        const url = match[1];
        if (url && url.length > 10) { // Basic validation
          const type = url.includes('.m3u8') ? 'hls' : 
                      url.includes('.mp4') ? 'mp4' : 'unknown';
          
          const absoluteUrl = makeAbsoluteUrl(url, embedUrl);
          if (absoluteUrl) {
            extractedUrls.push({ url: absoluteUrl, type });
          }
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

// Helper to make URLs absolute
function makeAbsoluteUrl(url: string, embedUrl: string): string {
  if (!url) return '';
  
  try {
    // Clean up the URL
    const cleanUrl = url
      .replace(/\\"/g, '"')
      .replace(/\\\//g, '/')
      .replace(/\\u002F/g, '/')
      .trim();
    
    if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
      return cleanUrl;
    }
    if (cleanUrl.startsWith('//')) {
      return 'https:' + cleanUrl;
    }
    if (cleanUrl.startsWith('/')) {
      const base = new URL(embedUrl);
      return base.origin + cleanUrl;
    }
    // Relative URL
    const embedBase = embedUrl.substring(0, embedUrl.lastIndexOf('/') + 1);
    return embedBase + cleanUrl;
  } catch {
    return url;
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