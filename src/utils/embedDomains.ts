// Embed Domain Manager - Uses embedsports.top for streamed.pk API
// No fallback - single domain for all sources

export const EMBED_DOMAIN = 'https://embedsports.top';

// Build embed URL - uses embedsports.top with query params
export const buildEmbedUrl = (
  domain: string,
  source: string,
  id: string,
  streamNo: number = 1,
  matchSlug?: string,
  matchTimestamp?: number
): string => {
  // Format: https://embedsports.top/api/getstream?source=SOURCE&match=MATCHID&stream=1
  return `${EMBED_DOMAIN}/api/getstream?source=${source}&match=${id}&stream=${streamNo}`;
};

// Get the embed domain - always returns damitv.pro
export const getWorkingEmbedDomain = async (): Promise<string> => {
  console.log(`✅ Using embed domain: ${EMBED_DOMAIN}`);
  return EMBED_DOMAIN;
};

// Synchronous version - always returns damitv.pro
export const getEmbedDomainSync = (): string => {
  return EMBED_DOMAIN;
};

// No-op functions kept for compatibility
export const markDomainFailed = (domain: string): void => {
  console.log(`ℹ️ Domain failure ignored - using single domain: ${EMBED_DOMAIN}`);
};

export const getFallbackDomain = (currentDomain: string): string | null => {
  return null; // No fallback
};

export const hasFallbackAvailable = (currentDomain: string): boolean => {
  return false; // No fallback available
};

export const resetFailedDomains = (): void => {
  console.log(`ℹ️ Reset ignored - using single domain: ${EMBED_DOMAIN}`);
};

export const getDomainStatus = (): {
  currentDomain: string;
  failedDomains: string[];
  primaryAvailable: boolean;
  fallbackAvailable: boolean;
} => {
  return {
    currentDomain: EMBED_DOMAIN,
    failedDomains: [],
    primaryAvailable: true,
    fallbackAvailable: false
  };
};
