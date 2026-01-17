// Match image mapping - maps team names to custom poster images
// Add entries here when you download match images from external sources

interface MatchImageMapping {
  teams: string[]; // Team names to match (case-insensitive, partial match)
  image: string;   // Path to the image
  competition?: string; // Optional: specific competition
}

const matchImageMappings: MatchImageMapping[] = [
  {
    teams: ['cameroon', 'morocco'],
    image: '/match-images/cameroon-morocco-afcon.webp',
    competition: 'africa'
  },
  {
    teams: ['real madrid', 'levante'],
    image: '/match-images/real-madrid-levante-laliga.jpeg',
    competition: 'laliga'
  },
  // Add more mappings here as you download images
];

/**
 * Find a custom poster image for a match based on team names
 */
export const getMatchPosterImage = (
  title: string,
  competition?: string
): string | null => {
  const normalizedTitle = title.toLowerCase();
  const normalizedCompetition = competition?.toLowerCase() || '';

  for (const mapping of matchImageMappings) {
    // Check if all teams in the mapping are found in the title
    const teamsMatch = mapping.teams.every(team => 
      normalizedTitle.includes(team.toLowerCase())
    );

    if (teamsMatch) {
      // If competition is specified in mapping, check it too
      if (mapping.competition) {
        if (normalizedTitle.includes(mapping.competition) || 
            normalizedCompetition.includes(mapping.competition)) {
          return mapping.image;
        }
      } else {
        return mapping.image;
      }
    }
  }

  return null;
};

/**
 * Check if a match has a custom poster image
 */
export const hasCustomPoster = (title: string, competition?: string): boolean => {
  return getMatchPosterImage(title, competition) !== null;
};
