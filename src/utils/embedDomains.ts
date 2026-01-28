// Embed Domain Manager - Uses embed.damitv.pro
// Single domain for all sources

export const EMBED_DOMAIN = 'https://embed.damitv.pro';

// Build embed URL - uses embed.damitv.pro format
export const buildEmbedUrl = (
  domain: string,
  source: string,
  id: string,
  streamNo: number = 1,
  matchSlug?: string,
  matchTimestamp?: number
): string => {
  // Format: https://embed.damitv.pro/?source={source}&id={id}
  return `${EMBED_DOMAIN}/?source=${source.toLowerCase()}&id=${id}`;
};

// Build 90sport URL - extracts m3u8 directly
export const build90sportUrl = (matchUrl: string): string => {
  return `${EMBED_DOMAIN}/?90sport=${encodeURIComponent(matchUrl)}`;
};

// Fetch m3u8 URL from 90sport (returns direct m3u8 link)
export const fetch90sportM3u8 = async (matchUrl: string): Promise<string | null> => {
  try {
    const res = await fetch(`${EMBED_DOMAIN}/api/90sport?url=${encodeURIComponent(matchUrl)}`);
    const data = await res.json();
    if (data.success && data.m3u8) {
      return data.m3u8;
    }
    return null;
  } catch (e) {
    console.error('Failed to fetch 90sport m3u8:', e);
    return null;
  }
};

// Get the embed domain - always returns embed.damitv.pro
export const getWorkingEmbedDomain = async (): Promise<string> => {
  console.log(`✅ Using embed domain: ${EMBED_DOMAIN}`);
  return EMBED_DOMAIN;
};

// Synchronous version - always returns embed.damitv.pro
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
