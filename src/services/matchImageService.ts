// Service to provide match card images from FanCode and TheSportsDB

interface TournamentImageMapping {
  [key: string]: string;
}

interface SportImageMapping {
  [key: string]: string;
}

// FanCode tournament/competition images for match cards
const FANCODE_TOURNAMENT_IMAGES: TournamentImageMapping = {
  // Cricket Tournaments
  'ilt20': 'https://images.fancode.com/skillup-uploads/cms-media/DPW-ILT20-Tour-Logo.png',
  'international league t20': 'https://images.fancode.com/skillup-uploads/cms-media/DPW-ILT20-Tour-Logo.png',
  'one day cup': 'https://images.fancode.com/skillup-uploads/prod-images/2024/11/One-Day-Cup.png',
  'sheffield shield': 'https://images.fancode.com/skillup-uploads/prod-images/2024/11/Sheffleld-Shield.png',
  'icc cwc': 'https://images.fancode.com/skillup-uploads/cms-media/ICC-CWC-League-2,-2023-27-(16th-July)-Tour-Logo-(1).png',
  'icc world cup': 'https://images.fancode.com/skillup-uploads/cms-media/ICC-CWC-League-2,-2023-27-(16th-July)-Tour-Logo-(1).png',
  'world cup qualifier': 'https://images.fancode.com/skillup-uploads/cms-media/ICC-CWC-League-2,-2023-27-(16th-July)-Tour-Logo-(1).png',
  'bbl': 'https://images.fancode.com/skillup-uploads/prod-images/2024/11/One-Day-Cup.png',
  'big bash': 'https://images.fancode.com/skillup-uploads/prod-images/2024/11/One-Day-Cup.png',
  'big bash league': 'https://images.fancode.com/skillup-uploads/prod-images/2024/11/One-Day-Cup.png',
  
  // Football Tournaments
  'afcon': 'https://images.fancode.com/skillup-uploads/cms-media/Afcon-Tour.png',
  'africa cup': 'https://images.fancode.com/skillup-uploads/cms-media/Afcon-Tour.png',
  'africa cup of nations': 'https://images.fancode.com/skillup-uploads/cms-media/Afcon-Tour.png',
  'la liga': 'https://images.fancode.com/skillup-uploads/cms-media/LALIGA-2025-26-Tour.png',
  'laliga': 'https://images.fancode.com/skillup-uploads/cms-media/LALIGA-2025-26-Tour.png',
  'spanish league': 'https://images.fancode.com/skillup-uploads/cms-media/LALIGA-2025-26-Tour.png',
  'carabao cup': 'https://images.fancode.com/skillup-uploads/prod-images/2024/08/Carabao_Cup.png',
  'efl cup': 'https://images.fancode.com/skillup-uploads/prod-images/2024/08/Carabao_Cup.png',
  'league cup': 'https://images.fancode.com/skillup-uploads/prod-images/2024/08/Carabao_Cup.png',
  'copa del rey': 'https://images.fancode.com/skillup-uploads/prod-images/2024/12/Copa-Del-Rey-Tour-Logo.png',
  'saudi league': 'https://images.fancode.com/skillup-uploads/cms-media/TLG-Sofi_Tour-Logo.png',
  'saudi pro league': 'https://images.fancode.com/skillup-uploads/cms-media/TLG-Sofi_Tour-Logo.png',
  'roshn saudi': 'https://images.fancode.com/skillup-uploads/cms-media/TLG-Sofi_Tour-Logo.png',
};

// FanCode team-specific images
const FANCODE_TEAM_IMAGES: TournamentImageMapping = {
  // Big Bash League Teams
  'sydney thunder': 'https://images.fancode.com/skillup-uploads/prod-images/2024/11/One-Day-Cup.png',
  'brisbane heat': 'https://images.fancode.com/skillup-uploads/prod-images/2024/11/One-Day-Cup.png',
  'melbourne stars': 'https://images.fancode.com/skillup-uploads/prod-images/2024/11/One-Day-Cup.png',
  'melbourne renegades': 'https://images.fancode.com/skillup-uploads/prod-images/2024/11/One-Day-Cup.png',
  'sydney sixers': 'https://images.fancode.com/skillup-uploads/prod-images/2024/11/One-Day-Cup.png',
  'perth scorchers': 'https://images.fancode.com/skillup-uploads/prod-images/2024/11/One-Day-Cup.png',
  'hobart hurricanes': 'https://images.fancode.com/skillup-uploads/prod-images/2024/11/One-Day-Cup.png',
  'adelaide strikers': 'https://images.fancode.com/skillup-uploads/prod-images/2024/11/One-Day-Cup.png',
};

// Default sport images as fallback
const SPORT_DEFAULT_IMAGES: SportImageMapping = {
  'football': 'https://images.fancode.com/skillup-uploads/cms-media/LALIGA-2025-26-Tour.png',
  'soccer': 'https://images.fancode.com/skillup-uploads/cms-media/LALIGA-2025-26-Tour.png',
  'cricket': 'https://images.fancode.com/skillup-uploads/prod-images/2024/11/One-Day-Cup.png',
  'basketball': 'https://images.fancode.com/skillup-uploads/prod-images/2019/11/default-tour-logo.png',
  'tennis': 'https://images.fancode.com/skillup-uploads/prod-images/2019/11/default-tour-logo.png',
  'hockey': 'https://images.fancode.com/skillup-uploads/prod-images/2019/11/default-tour-logo.png',
  'default': 'https://images.fancode.com/skillup-uploads/prod-images/2019/11/default-tour-logo.png',
};

class MatchImageService {
  private normalizeText(text: string): string {
    return text.toLowerCase().trim();
  }

  /**
   * Get match card image from FanCode based on tournament/competition name
   */
  getTournamentImage(competitionName: string): string | null {
    if (!competitionName) return null;
    
    const normalized = this.normalizeText(competitionName);
    
    // Direct match
    if (FANCODE_TOURNAMENT_IMAGES[normalized]) {
      return FANCODE_TOURNAMENT_IMAGES[normalized];
    }
    
    // Partial match
    for (const [key, imageUrl] of Object.entries(FANCODE_TOURNAMENT_IMAGES)) {
      if (normalized.includes(key) || key.includes(normalized)) {
        return imageUrl;
      }
    }
    
    return null;
  }

  /**
   * Get match card image based on team names
   */
  getTeamBasedImage(homeTeam: string, awayTeam: string): string | null {
    const homeNormalized = this.normalizeText(homeTeam || '');
    const awayNormalized = this.normalizeText(awayTeam || '');
    
    // Check home team
    for (const [key, imageUrl] of Object.entries(FANCODE_TEAM_IMAGES)) {
      if (homeNormalized.includes(key) || key.includes(homeNormalized)) {
        return imageUrl;
      }
    }
    
    // Check away team
    for (const [key, imageUrl] of Object.entries(FANCODE_TEAM_IMAGES)) {
      if (awayNormalized.includes(key) || key.includes(awayNormalized)) {
        return imageUrl;
      }
    }
    
    return null;
  }

  /**
   * Get default image for a sport category
   */
  getSportDefaultImage(sport: string): string {
    const normalized = this.normalizeText(sport || '');
    return SPORT_DEFAULT_IMAGES[normalized] || SPORT_DEFAULT_IMAGES['default'];
  }

  /**
   * Get the best available match image with priority:
   * 1. TheSportsDB event poster (if provided)
   * 2. FanCode tournament image (based on competition name)
   * 3. FanCode team-based image
   * 4. Sport default image
   */
  getMatchImage(match: {
    poster?: string;
    competition?: string;
    league?: string;
    tournament?: string;
    title?: string;
    category?: string;
    sportId?: string;
    teams?: {
      home?: { name?: string };
      away?: { name?: string };
    };
  }): string | null {
    // Priority 1: Existing poster from TheSportsDB or API
    if (match.poster && typeof match.poster === 'string' && match.poster.trim()) {
      return null; // Let the card use the existing poster
    }
    
    // Priority 2: Tournament/competition based image
    const competitionName = match.competition || match.league || match.tournament || match.title || '';
    const tournamentImage = this.getTournamentImage(competitionName);
    if (tournamentImage) {
      return tournamentImage;
    }
    
    // Priority 3: Team-based image
    const homeTeam = match.teams?.home?.name || '';
    const awayTeam = match.teams?.away?.name || '';
    const teamImage = this.getTeamBasedImage(homeTeam, awayTeam);
    if (teamImage) {
      return teamImage;
    }
    
    // Priority 4: Sport default image
    const sport = match.category || match.sportId || '';
    return this.getSportDefaultImage(sport);
  }

  /**
   * Add a new tournament image mapping
   */
  addTournamentImage(tournamentName: string, imageUrl: string): void {
    FANCODE_TOURNAMENT_IMAGES[this.normalizeText(tournamentName)] = imageUrl;
  }

  /**
   * Add a new team image mapping
   */
  addTeamImage(teamName: string, imageUrl: string): void {
    FANCODE_TEAM_IMAGES[this.normalizeText(teamName)] = imageUrl;
  }
}

export const matchImageService = new MatchImageService();
export { MatchImageService, FANCODE_TOURNAMENT_IMAGES, FANCODE_TEAM_IMAGES };
