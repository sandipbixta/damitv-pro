// Embed Domain Manager - handles fallback between embed providers
// Primary: topembed.pw | Fallback: embed.damitv.pro

export const EMBED_DOMAINS = {
  primary: {
    url: 'https://topembed.pw',
    format: 'topembed', // /event/{slug}_{timestamp}
  },
  fallback: {
    url: 'https://embed.damitv.pro',
    format: 'damitv', // /embed/{source}/{id}/{streamNo}
  }
};

// Cache key for localStorage
const WORKING_DOMAIN_KEY = 'embed_working_domain';
const DOMAIN_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Track failed domains during session
const failedDomains = new Set<string>();

// Build embed URL based on domain format
// For topembed: /event/{slug}_{timestamp}
// For damitv: /embed/{source}/{id}/{streamNo}
export const buildEmbedUrl = (
  domain: string,
  source: string,
  id: string,
  streamNo: number = 1,
  matchSlug?: string,
  matchTimestamp?: number
): string => {
  if (domain.includes('topembed.pw') && matchSlug && matchTimestamp) {
    // topembed format: /event/{slug}_{timestamp}
    return `${domain}/event/${matchSlug}_${matchTimestamp}`;
  }
  // Fallback format: /embed/{source}/{id}/{streamNo}
  return `${domain}/embed/${source}/${id}/${streamNo}`;
};

// Get cached working domain from localStorage
const getCachedDomain = (): string | null => {
  try {
    const cached = localStorage.getItem(WORKING_DOMAIN_KEY);
    if (!cached) return null;
    
    const { domain, timestamp } = JSON.parse(cached);
    
    // Check if cache is still valid
    if (Date.now() - timestamp < DOMAIN_CACHE_TTL) {
      // Also check it's not in failed list
      if (!failedDomains.has(domain)) {
        return domain;
      }
    }
    
    // Clear expired cache
    localStorage.removeItem(WORKING_DOMAIN_KEY);
    return null;
  } catch {
    return null;
  }
};

// Save working domain to localStorage
const cacheDomain = (domain: string): void => {
  try {
    localStorage.setItem(WORKING_DOMAIN_KEY, JSON.stringify({
      domain,
      timestamp: Date.now()
    }));
  } catch {
    // Ignore localStorage errors
  }
};

// Test if a domain is reachable (lightweight check)
const testDomain = async (domain: string): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    // Try to load a simple URL from the domain
    const testUrl = `${domain}/`;
    const response = await fetch(testUrl, {
      method: 'HEAD',
      mode: 'no-cors', // Just check if reachable
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    // no-cors mode always returns opaque response, so check if we didn't throw
    return true;
  } catch {
    return false;
  }
};

// Get the current working embed domain
export const getWorkingEmbedDomain = async (): Promise<string> => {
  // Check cached domain first
  const cached = getCachedDomain();
  if (cached) {
    console.log(`⚡ Using cached embed domain: ${cached}`);
    return cached;
  }
  
  // Check if primary is marked as failed this session
  if (!failedDomains.has(EMBED_DOMAINS.primary.url)) {
    // Test primary domain
    const primaryWorks = await testDomain(EMBED_DOMAINS.primary.url);
    
    if (primaryWorks) {
      console.log(`✅ Primary embed domain working: ${EMBED_DOMAINS.primary.url}`);
      cacheDomain(EMBED_DOMAINS.primary.url);
      return EMBED_DOMAINS.primary.url;
    }
    
    console.warn(`⚠️ Primary embed domain failed: ${EMBED_DOMAINS.primary.url}`);
    failedDomains.add(EMBED_DOMAINS.primary.url);
  }
  
  // Fall back to embedsports.top
  console.log(`🔄 Falling back to: ${EMBED_DOMAINS.fallback.url}`);
  cacheDomain(EMBED_DOMAINS.fallback.url);
  return EMBED_DOMAINS.fallback.url;
};

// Synchronous version that returns cached or primary (use for initial render)
export const getEmbedDomainSync = (): string => {
  const cached = getCachedDomain();
  if (cached) return cached;
  
  // If primary is marked failed, use fallback
  if (failedDomains.has(EMBED_DOMAINS.primary.url)) {
    return EMBED_DOMAINS.fallback.url;
  }
  
  return EMBED_DOMAINS.primary.url;
};

// Mark a domain as failed (called when embed fails to load)
export const markDomainFailed = (domain: string): void => {
  console.warn(`❌ Marking embed domain as failed: ${domain}`);
  failedDomains.add(domain);
  localStorage.removeItem(WORKING_DOMAIN_KEY);
};

// Get fallback domain (different from current)
export const getFallbackDomain = (currentDomain: string): string | null => {
  if (currentDomain.includes('damitv')) {
    return EMBED_DOMAINS.fallback.url;
  } else if (currentDomain.includes('embedsports')) {
    return EMBED_DOMAINS.primary.url;
  }
  return EMBED_DOMAINS.fallback.url;
};

// Check if we have a fallback available
export const hasFallbackAvailable = (currentDomain: string): boolean => {
  const fallback = getFallbackDomain(currentDomain);
  return fallback !== null && !failedDomains.has(fallback);
};

// Reset failed domains (useful for retrying)
export const resetFailedDomains = (): void => {
  failedDomains.clear();
  localStorage.removeItem(WORKING_DOMAIN_KEY);
  console.log('🔄 Reset all failed embed domains');
};

// Get current domain status for debugging
export const getDomainStatus = (): {
  currentDomain: string;
  failedDomains: string[];
  primaryAvailable: boolean;
  fallbackAvailable: boolean;
} => {
  return {
    currentDomain: getEmbedDomainSync(),
    failedDomains: Array.from(failedDomains),
    primaryAvailable: !failedDomains.has(EMBED_DOMAINS.primary.url),
    fallbackAvailable: !failedDomains.has(EMBED_DOMAINS.fallback.url)
  };
};
