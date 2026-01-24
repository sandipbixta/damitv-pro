// Service to provide team and country logos for matches

interface TeamLogoMapping {
  [key: string]: string;
}

interface CountryLogoMapping {
  [key: string]: string;
}

// Common team name mappings to logo URLs
const TEAM_LOGO_MAPPINGS: TeamLogoMapping = {
  // Football/Soccer
  'manchester united': 'https://logos-world.net/wp-content/uploads/2020/06/Manchester-United-Logo.png',
  'manchester city': 'https://logos-world.net/wp-content/uploads/2020/06/Manchester-City-Logo.png',
  'liverpool': 'https://logos-world.net/wp-content/uploads/2020/06/Liverpool-Logo.png',
  'chelsea': 'https://logos-world.net/wp-content/uploads/2020/06/Chelsea-Logo.png',
  'arsenal': 'https://logos-world.net/wp-content/uploads/2020/06/Arsenal-Logo.png',
  'tottenham': 'https://logos-world.net/wp-content/uploads/2020/06/Tottenham-Logo.png',
  'real madrid': 'https://logos-world.net/wp-content/uploads/2020/06/Real-Madrid-Logo.png',
  'barcelona': 'https://logos-world.net/wp-content/uploads/2020/06/Barcelona-Logo.png',
  'bayern munich': 'https://logos-world.net/wp-content/uploads/2020/06/Bayern-Munich-Logo.png',
  'paris saint-germain': 'https://logos-world.net/wp-content/uploads/2020/06/Paris-Saint-Germain-Logo.png',
  'psg': 'https://logos-world.net/wp-content/uploads/2020/06/Paris-Saint-Germain-Logo.png',
  'juventus': 'https://logos-world.net/wp-content/uploads/2020/06/Juventus-Logo.png',
  'ac milan': 'https://logos-world.net/wp-content/uploads/2020/06/AC-Milan-Logo.png',
  'inter milan': 'https://logos-world.net/wp-content/uploads/2020/06/Inter-Milan-Logo.png',
  
  // Basketball (NBA)
  'los angeles lakers': 'https://logoeps.com/wp-content/uploads/2013/03/los-angeles-lakers-vector-logo.png',
  'golden state warriors': 'https://logoeps.com/wp-content/uploads/2013/03/golden-state-warriors-vector-logo.png',
  'boston celtics': 'https://logoeps.com/wp-content/uploads/2013/03/boston-celtics-vector-logo.png',
  'miami heat': 'https://logoeps.com/wp-content/uploads/2013/03/miami-heat-vector-logo.png',
  'chicago bulls': 'https://logoeps.com/wp-content/uploads/2013/03/chicago-bulls-vector-logo.png',
  
  // American Football (NFL)
  'new england patriots': 'https://logoeps.com/wp-content/uploads/2013/03/new-england-patriots-vector-logo.png',
  'dallas cowboys': 'https://logoeps.com/wp-content/uploads/2013/03/dallas-cowboys-vector-logo.png',
  'green bay packers': 'https://logoeps.com/wp-content/uploads/2013/03/green-bay-packers-vector-logo.png',
  'pittsburgh steelers': 'https://logoeps.com/wp-content/uploads/2013/03/pittsburgh-steelers-vector-logo.png',
};

// Country flag mappings using flagpedia or similar service
const COUNTRY_LOGO_MAPPINGS: CountryLogoMapping = {
  'england': 'https://flagpedia.net/data/flags/w580/gb-eng.webp',
  'united kingdom': 'https://flagpedia.net/data/flags/w580/gb.webp',
  'uk': 'https://flagpedia.net/data/flags/w580/gb.webp',
  'united states': 'https://flagpedia.net/data/flags/w580/us.webp',
  'usa': 'https://flagpedia.net/data/flags/w580/us.webp',
  'spain': 'https://flagpedia.net/data/flags/w580/es.webp',
  'france': 'https://flagpedia.net/data/flags/w580/fr.webp',
  'germany': 'https://flagpedia.net/data/flags/w580/de.webp',
  'italy': 'https://flagpedia.net/data/flags/w580/it.webp',
  'brazil': 'https://flagpedia.net/data/flags/w580/br.webp',
  'argentina': 'https://flagpedia.net/data/flags/w580/ar.webp',
  'mexico': 'https://flagpedia.net/data/flags/w580/mx.webp',
  'canada': 'https://flagpedia.net/data/flags/w580/ca.webp',
  'australia': 'https://flagpedia.net/data/flags/w580/au.webp',
  'india': 'https://flagpedia.net/data/flags/w580/in.webp',
  'netherlands': 'https://flagpedia.net/data/flags/w580/nl.webp',
  'portugal': 'https://flagpedia.net/data/flags/w580/pt.webp',
  'russia': 'https://flagpedia.net/data/flags/w580/ru.webp',
  'japan': 'https://flagpedia.net/data/flags/w580/jp.webp',
  'south korea': 'https://flagpedia.net/data/flags/w580/kr.webp',
  'china': 'https://flagpedia.net/data/flags/w580/cn.webp',
};

class TeamLogoService {
  private normalizeTeamName(name: string): string {
    return name.toLowerCase().trim();
  }

  private extractCountryFromTeamName(teamName: string): string | null {
    const normalized = this.normalizeTeamName(teamName);
    
    // Check if team name contains a country name
    for (const country of Object.keys(COUNTRY_LOGO_MAPPINGS)) {
      if (normalized.includes(country.toLowerCase())) {
        return country;
      }
    }
    
    // Check for common patterns
    if (normalized.includes('england') || normalized.includes('premier league')) return 'england';
    if (normalized.includes('spain') || normalized.includes('la liga')) return 'spain';
    if (normalized.includes('germany') || normalized.includes('bundesliga')) return 'germany';
    if (normalized.includes('italy') || normalized.includes('serie a')) return 'italy';
    if (normalized.includes('france') || normalized.includes('ligue 1')) return 'france';
    if (normalized.includes('usa') || normalized.includes('mls') || normalized.includes('nfl') || normalized.includes('nba')) return 'usa';
    
    return null;
  }

  public getTeamLogo(teamName: string, teamBadge?: string): string | null {
    if (!teamName) return null;

    // First priority: Use official API badge if it's already a full URL
    if (teamBadge && teamBadge.startsWith('http')) {
      return teamBadge;
    }

    // Second priority: If badge is a hash, construct the full URL
    if (teamBadge && teamBadge.length > 20 && !teamBadge.includes('/')) {
      // Badge is likely a hash from streamed.pk API
      return `https://streamed.pk/api/images/proxy/${teamBadge}.webp`;
    }
    
    const normalized = this.normalizeTeamName(teamName);
    
    // Second priority: Direct team mapping
    if (TEAM_LOGO_MAPPINGS[normalized]) {
      return TEAM_LOGO_MAPPINGS[normalized];
    }
    
    // Third priority: Partial matches for team names
    for (const [mappedName, logo] of Object.entries(TEAM_LOGO_MAPPINGS)) {
      if (normalized.includes(mappedName) || mappedName.includes(normalized)) {
        return logo;
      }
    }
    
    // Fallback: Country flag if we can determine the country
    const country = this.extractCountryFromTeamName(teamName);
    if (country && COUNTRY_LOGO_MAPPINGS[country]) {
      return COUNTRY_LOGO_MAPPINGS[country];
    }
    
    return null;
  }

  public getCountryFlag(countryName: string): string | null {
    if (!countryName) return null;
    
    const normalized = this.normalizeTeamName(countryName);
    return COUNTRY_LOGO_MAPPINGS[normalized] || null;
  }

  // Method to enhance match data with logos
  public enhanceMatchWithLogos(match: any): any {
    if (!match.teams) return match;

    const enhancedMatch = { ...match };
    
    if (match.teams.home?.name && !match.teams.home.logo) {
      const logo = this.getTeamLogo(match.teams.home.name, match.teams.home.badge);
      if (logo) {
        console.log(`Enhanced home team "${match.teams.home.name}" with logo:`, logo);
        enhancedMatch.teams.home.logo = logo;
      }
    }
    
    if (match.teams.away?.name && !match.teams.away.logo) {
      const logo = this.getTeamLogo(match.teams.away.name, match.teams.away.badge);
      if (logo) {
        console.log(`Enhanced away team "${match.teams.away.name}" with logo:`, logo);
        enhancedMatch.teams.away.logo = logo;
      }
    }
    
    return enhancedMatch;
  }

  // Method to add more team mappings dynamically
  public addTeamMapping(teamName: string, logoUrl: string): void {
    TEAM_LOGO_MAPPINGS[this.normalizeTeamName(teamName)] = logoUrl;
  }

  // Method to add more country mappings dynamically
  public addCountryMapping(countryName: string, flagUrl: string): void {
    COUNTRY_LOGO_MAPPINGS[this.normalizeTeamName(countryName)] = flagUrl;
  }
}

export const teamLogoService = new TeamLogoService();
export { TeamLogoService };