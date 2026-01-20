// Embed Domain Manager - Uses embed.damitv.pro with query params format
// With fallback support

// Primary domain
export const EMBED_DOMAIN = 'https://embed.damitv.pro';

// Fallback domain
const FALLBACK_DOMAIN = 'https://embedsports.top';

// Track failed domains
const failedDomains = new Set<string>();

// Generate URL-friendly slug from match title (e.g., "northwestern-state-vs-houston-christian")
const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/\s+vs\.?\s+/gi, '-vs-')
    .replace(/\s+v\.?\s+/gi, '-vs-')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

// Build embed URL - uses query params format for primary, path format for fallback
// Primary format: https://embed.damitv.pro/?id=TIMESTAMP-SLUG&source=SOURCE&autoplay=true
// Fallback format: https://embedsports.top/embed/SOURCE/MATCHID/STREAMNO
export const buildEmbedUrl = (
  domain: string,
  source: string,
  id: string,
  streamNo: number = 1,
  matchSlug?: string,
  matchTimestamp?: number
): string => {
  // Use primary domain with query params format
  if (domain === EMBED_DOMAIN || !failedDomains.has(EMBED_DOMAIN)) {
    const timestamp = matchTimestamp || Date.now();
    const slug = matchSlug || id;
    const fullId = `${timestamp}-${slug}`;
    return `${EMBED_DOMAIN}/?id=${encodeURIComponent(fullId)}&source=${encodeURIComponent(source)}&autoplay=true`;
  }
  
  // Fallback domain uses path format
  return `${FALLBACK_DOMAIN}/embed/${source}/${id}/${streamNo}`;
};

// Build URL with specific domain (for manual fallback)
export const buildEmbedUrlWithDomain = (
  domain: string,
  source: string,
  id: string,
  streamNo: number = 1,
  matchSlug?: string,
  matchTimestamp?: number
): string => {
  if (domain === EMBED_DOMAIN) {
    const timestamp = matchTimestamp || Date.now();
    const slug = matchSlug || id;
    const fullId = `${timestamp}-${slug}`;
    return `${EMBED_DOMAIN}/?id=${encodeURIComponent(fullId)}&source=${encodeURIComponent(source)}&autoplay=true`;
  }
  
  // Any other domain uses path format
  return `${domain}/embed/${source}/${id}/${streamNo}`;
};

// Get the embed domain - returns primary unless failed
export const getWorkingEmbedDomain = async (): Promise<string> => {
  if (failedDomains.has(EMBED_DOMAIN)) {
    console.log(`⚠️ Primary failed, using fallback: ${FALLBACK_DOMAIN}`);
    return FALLBACK_DOMAIN;
  }
  console.log(`✅ Using embed domain: ${EMBED_DOMAIN}`);
  return EMBED_DOMAIN;
};

// Synchronous version
export const getEmbedDomainSync = (): string => {
  if (failedDomains.has(EMBED_DOMAIN)) {
    return FALLBACK_DOMAIN;
  }
  return EMBED_DOMAIN;
};

// Mark a domain as failed
export const markDomainFailed = (domain: string): void => {
  failedDomains.add(domain);
  console.log(`❌ Domain marked failed: ${domain}`);
};

// Get fallback domain
export const getFallbackDomain = (currentDomain: string): string | null => {
  if (currentDomain === EMBED_DOMAIN) {
    return FALLBACK_DOMAIN;
  }
  return null;
};

// Check if fallback is available
export const hasFallbackAvailable = (currentDomain: string): boolean => {
  if (currentDomain === EMBED_DOMAIN && !failedDomains.has(FALLBACK_DOMAIN)) {
    return true;
  }
  return false;
};

// Reset failed domains (e.g., after some time or user action)
export const resetFailedDomains = (): void => {
  failedDomains.clear();
  console.log(`🔄 Reset failed domains - primary domain restored`);
};

// Get domain status
export const getDomainStatus = (): {
  currentDomain: string;
  failedDomains: string[];
  primaryAvailable: boolean;
  fallbackAvailable: boolean;
} => {
  return {
    currentDomain: getEmbedDomainSync(),
    failedDomains: Array.from(failedDomains),
    primaryAvailable: !failedDomains.has(EMBED_DOMAIN),
    fallbackAvailable: !failedDomains.has(FALLBACK_DOMAIN)
  };
};
