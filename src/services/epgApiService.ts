
interface EPGProgram {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  description?: string;
  category?: string;
}

interface EPGChannel {
  channelId: string;
  channelName: string;
  programs: EPGProgram[];
}

interface EPGApiResponse {
  channel: {
    id: string;
    name: string;
  };
  programmes: Array<{
    start: string;
    stop: string;
    title: string;
    desc?: string;
    category?: string;
  }>;
}

class EPGApiService {
  private baseUrl = 'https://epg.pw/api';
  private cache: Map<string, { data: EPGApiResponse; timestamp: number }> = new Map();
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes
  
  // Map channel names to their EPG API IDs
  private channelIdMap: Record<string, string> = {
    'TSN1': '404784',
    'TSN2': '404785', 
    'TSN3': '404786',
    'TSN4': '404787',
    'TSN5': '404788',
    'Sportsnet One': '404789',
    'Sportsnet Pacific': '404790',
    'Sportsnet East': '404791',
    'Sportsnet West': '404792',
    'Sportsnet World': '404793',
    'Sportsnet 360': '404794',
    'Sportsnet Ontario': '404795'
  };

  private async fetchChannelEPG(channelId: string): Promise<EPGApiResponse | null> {
    try {
      // Check cache first
      const cached = this.cache.get(channelId);
      if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
        console.log(`Using cached EPG data for channel ID: ${channelId}`);
        return cached.data;
      }

      console.log(`Fetching EPG data for channel ID: ${channelId}`);
      const response = await fetch(`${this.baseUrl}/epg.json?channel_id=${channelId}`);
      
      if (!response.ok) {
        console.warn(`EPG API returned ${response.status} for channel ${channelId}`);
        return null;
      }
      
      const data = await response.json();
      
      // Cache the response
      this.cache.set(channelId, { data, timestamp: Date.now() });
      
      return data;
    } catch (error) {
      console.error(`Error fetching EPG for channel ${channelId}:`, error);
      return null;
    }
  }

  private convertToOurFormat(apiData: EPGApiResponse, channelName: string): EPGChannel {
    const programs: EPGProgram[] = apiData.programmes.map((prog, index) => ({
      id: `${apiData.channel.id}-${index}`,
      title: prog.title || 'Unknown Program',
      startTime: new Date(prog.start).toISOString(),
      endTime: new Date(prog.stop).toISOString(),
      description: prog.desc,
      category: prog.category
    }));

    return {
      channelId: apiData.channel.id,
      channelName: channelName,
      programs: programs
    };
  }

  async getEPGForCanadianChannels(channels: any[]): Promise<EPGChannel[]> {
    console.log('Fetching real EPG data for Canadian channels from epg.pw API');
    
    const epgChannels: EPGChannel[] = [];
    
    for (const channel of channels) {
      const channelId = this.channelIdMap[channel.title];
      
      if (channelId) {
        console.log(`Loading EPG for ${channel.title} (ID: ${channelId})`);
        const apiData = await this.fetchChannelEPG(channelId);
        
        if (apiData) {
          const epgChannel = this.convertToOurFormat(apiData, channel.title);
          epgChannels.push(epgChannel);
        }
      }
    }
    
    console.log(`Loaded real EPG data for ${epgChannels.length} Canadian channels`);
    return epgChannels;
  }

  async getAllEPGData(channelsByCountry: Record<string, any[]>): Promise<Record<string, EPGChannel[]>> {
    const allEPGData: Record<string, EPGChannel[]> = {};
    
    for (const [country, channels] of Object.entries(channelsByCountry)) {
      if (country === 'Canada') {
        allEPGData[country] = await this.getEPGForCanadianChannels(channels);
      } else {
        // For other countries, return empty array for now
        allEPGData[country] = [];
      }
    }
    
    return allEPGData;
  }
}

export const epgApiService = new EPGApiService();
export type { EPGProgram, EPGChannel };
