// Embed Domain Manager - handles fallback between embed providers
// Priority order:
// 1) stream.streamapi.cc
// 2) embed.damitv.pro
// 3) embedsports.top

export const EMBED_DOMAINS = {
  primary: {
    url: 'https://stream.streamapi.cc',
    format: 'streamapi', // /?id={id}&source={source}&streamNo={streamNo}
  },
  fallback: {
    url: 'https://embed.damitv.pro',
    format: 'damitv', // /?id={id}&source={source}&streamNo={streamNo}
  },
  tertiary: {
    url: 'https://embedsports.top',
    format: 'embedsports', // /embed/{source}/{id}/{streamNo}
  },
} as const;

const DOMAIN_PRIORITY: string[] = [
  EMBED_DOMAINS.primary.url,
  EMBED_DOMAINS.fallback.url,
  EMBED_DOMAINS.tertiary.url,
];

// Cache key for localStorage
const WORKING_DOMAIN_KEY = 'embed_working_domain';
const DOMAIN_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Track failed domains during session
const failedDomains = new Set<string>();

// Build embed URL based on domain format
export const buildEmbedUrl = (
  domain: string,
  source: string,
  id: string,
  streamNo: number = 1
): string => {
  if (domain.includes('streamapi')) {
    // IMPORTANT: include streamNo so Stream 1/2/3 generate different URLs
    // (also prevents "no reload" when users switch streams)
    return `${domain}/?id=${id}&source=${source}&streamNo=${streamNo}`;
  }

  if (domain.includes('damitv')) {
    return `${domain}/?id=${id}&source=${source}&streamNo=${streamNo}`;
  }

  if (domain.includes('embedsports')) {
    return `${domain}/embed/${source}/${id}/${streamNo}`;
  }

  // Default to primary format
  return `${EMBED_DOMAINS.primary.url}/?id=${id}&source=${source}&streamNo=${streamNo}`;
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
    localStorage.setItem(
      WORKING_DOMAIN_KEY,
      JSON.stringify({
        domain,
        timestamp: Date.now(),
      })
    );
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
    await fetch(testUrl, {
      method: 'HEAD',
      mode: 'no-cors', // Just check if reachable
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    // no-cors mode always returns opaque response, so "no throw" = reachable
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

  // Test domains in priority order
  for (const domain of DOMAIN_PRIORITY) {
    if (failedDomains.has(domain)) continue;

    const works = await testDomain(domain);
    if (works) {
      console.log(`✅ Embed domain working: ${domain}`);
      cacheDomain(domain);
      return domain;
    }

    console.warn(`⚠️ Embed domain failed: ${domain}`);
    failedDomains.add(domain);
  }

  // If everything failed, return primary anyway
  return EMBED_DOMAINS.primary.url;
};

// Synchronous version that returns cached or first non-failed domain (use for initial render)
export const getEmbedDomainSync = (): string => {
  const cached = getCachedDomain();
  if (cached) return cached;

  return DOMAIN_PRIORITY.find((d) => !failedDomains.has(d)) ?? EMBED_DOMAINS.primary.url;
};

// Mark a domain as failed (called when embed fails to load)
export const markDomainFailed = (domain: string): void => {
  console.warn(`❌ Marking embed domain as failed: ${domain}`);
  failedDomains.add(domain);
  localStorage.removeItem(WORKING_DOMAIN_KEY);
};

// Get fallback domain (next in priority order)
export const getFallbackDomain = (currentDomain: string): string | null => {
  const idx = DOMAIN_PRIORITY.indexOf(currentDomain);

  // Unknown domain: give first available
  if (idx === -1) {
    return DOMAIN_PRIORITY.find((d) => !failedDomains.has(d)) ?? null;
  }

  // Next available domain after current
  for (let i = idx + 1; i < DOMAIN_PRIORITY.length; i++) {
    const candidate = DOMAIN_PRIORITY[i];
    if (!failedDomains.has(candidate)) return candidate;
  }

  return null;
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
  tertiaryAvailable: boolean;
} => {
  return {
    currentDomain: getEmbedDomainSync(),
    failedDomains: Array.from(failedDomains),
    primaryAvailable: !failedDomains.has(EMBED_DOMAINS.primary.url),
    fallbackAvailable: !failedDomains.has(EMBED_DOMAINS.fallback.url),
    tertiaryAvailable: !failedDomains.has(EMBED_DOMAINS.tertiary.url),
  };
};

