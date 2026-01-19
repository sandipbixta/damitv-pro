// Embed Domain Manager - Uses embedsports.top for streaming
// No fallback - single domain for all sources

export const EMBED_DOMAIN = 'https://embedsports.top';

// Build embed URL - uses embedsports.top with path format
export const buildEmbedUrl = (
  domain: string,
  source: string,
  id: string,
  streamNo: number = 1,
  matchSlug?: string,
  matchTimestamp?: number
): string => {
  // Format: https://embedsports.top/embed/SOURCE/MATCHID/STREAMNO
  return `${EMBED_DOMAIN}/embed/${source}/${id}/${streamNo}`;
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
