/**
 * Utility functions for generating SEO-friendly match slugs
 */

/**
 * Converts a string to a URL-friendly slug
 */
export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

/**
 * Generates an SEO-friendly match slug with -live-stream suffix
 * Format: {home-team}-vs-{away-team}-live-stream
 * Falls back to match title if teams are not available
 */
export const generateMatchSlug = (
  homeTeam?: string,
  awayTeam?: string,
  fallbackTitle?: string
): string => {
  if (homeTeam && awayTeam) {
    const homeSlug = slugify(homeTeam);
    const awaySlug = slugify(awayTeam);
    return `${homeSlug}-vs-${awaySlug}-live-stream`;
  }
  
  if (fallbackTitle) {
    return `${slugify(fallbackTitle)}-live-stream`;
  }
  
  return 'match-live-stream';
};

/**
 * Generates the full match URL path
 */
export const generateMatchUrl = (
  sportId: string,
  matchId: string,
  homeTeam?: string,
  awayTeam?: string,
  fallbackTitle?: string
): string => {
  const slug = generateMatchSlug(homeTeam, awayTeam, fallbackTitle);
  return `/match/${sportId}/${matchId}/${slug}`;
};

/**
 * Extracts match ID from a URL that may contain a slug
 * The matchId is expected to be the third segment in the path
 */
export const extractMatchIdFromUrl = (path: string): string | null => {
  const segments = path.split('/').filter(Boolean);
  // Expected format: match/{sportId}/{matchId}/{slug}
  if (segments.length >= 3 && segments[0] === 'match') {
    return segments[2];
  }
  return null;
};
