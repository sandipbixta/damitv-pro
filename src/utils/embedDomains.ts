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

// Build embed URL - always uses query params format for embed.damitv.pro
// Format: https://embed.damitv.pro/?id=TIMESTAMP-SLUG&source=SOURCE&autoplay=true
export const buildEmbedUrl = (
  domain: string,
  source: string,
  id: string,
  streamNo: number = 1,
  matchSlug?: string,
  matchTimestamp?: number
): string => {
  // Always use the query params format for embed.damitv.pro
  const timestamp = matchTimestamp || Date.now();
  const slug = matchSlug || generateSlugFromId(id);
  const fullId = `${timestamp}-${slug}`;
  return `${EMBED_DOMAIN}/?id=${encodeURIComponent(fullId)}&source=${encodeURIComponent(source)}&autoplay=true`;
};

// Generate slug from match ID when title not available
const generateSlugFromId = (id: string): string => {
  // If id already looks like a slug, use it
  if (id.includes('-') && !id.match(/^\d+$/)) {
    return id.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
  }
  // Default fallback
  return `match-${id}`;
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
  const timestamp = matchTimestamp || Date.now();
  const slug = matchSlug || generateSlugFromId(id);
  const fullId = `${timestamp}-${slug}`;
  return `${EMBED_DOMAIN}/?id=${encodeURIComponent(fullId)}&source=${encodeURIComponent(source)}&autoplay=true`;
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
