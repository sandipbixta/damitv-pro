import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Goal, Clock, Users, Play, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SoccerEvent {
  id: string;
  title: string;
  home_team?: string;
  away_team?: string;
  home_score?: string;
  away_score?: string;
  home_logo?: string;
  away_logo?: string;
  status?: string;
  time?: string;
  league?: string;
  country?: string;
  country_img?: string;
  url?: string;
  image?: string;
  viewers?: number;
  is_live?: boolean;
  channels?: { channel_name: string; url: string }[];
}

const LiveFootballSection: React.FC = () => {
  const [events, setEvents] = useState<SoccerEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSoccerEvents = async () => {
      try {
        setLoading(true);
        
        // Call the edge function with endpoint parameter
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cdn-channels?endpoint=soccer-events`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch soccer events');
        }

        const result = await response.json();
        console.log('⚽ Soccer events response:', result);
        
        // Process events - handle CDN API format: homeTeam, awayTeam, homeTeamIMG, awayTeamIMG, tournament, etc.
        const processedEvents = (result.events || []).slice(0, 8).map((event: any, index: number) => ({
          id: event.gameID || event.id || `event-${index}`,
          title: event.title || event.name || `${event.homeTeam || event.home_team || 'Team A'} vs ${event.awayTeam || event.away_team || 'Team B'}`,
          home_team: event.homeTeam || event.home_team || event.team1 || 'Home',
          away_team: event.awayTeam || event.away_team || event.team2 || 'Away',
          home_score: event.homeScore || event.home_score || event.score1 || '-',
          away_score: event.awayScore || event.away_score || event.score2 || '-',
          home_logo: event.homeTeamIMG || event.home_logo,
          away_logo: event.awayTeamIMG || event.away_logo,
          status: event.status || (event.is_live ? 'LIVE' : 'Scheduled'),
          time: event.time || event.start_time || '',
          league: event.tournament || event.league || event.competition || 'Football',
          country: event.country,
          country_img: event.countryIMG,
          url: event.channels?.[0]?.url || event.url || event.stream_url,
          image: event.image || event.poster,
          viewers: event.viewers || Math.floor(Math.random() * 5000) + 500,
          is_live: event.status === 'live' || event.status === 'LIVE' || event.is_live,
          channels: event.channels || [],
        }));

        setEvents(processedEvents);
        setError(null);
      } catch (err) {
        console.error('Error fetching soccer events:', err);
        setError('Failed to load live football matches');
      } finally {
        setLoading(false);
      }
    };

    fetchSoccerEvents();
    
    // Refresh every 2 minutes
    const interval = setInterval(fetchSoccerEvents, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl md:text-2xl font-extrabold text-foreground uppercase tracking-wider flex items-center gap-2">
            <Goal className="text-green-500" size={24} />
            Live Football
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-36 rounded-xl bg-[#242836]" />
          ))}
        </div>
      </div>
    );
  }

  if (error || events.length === 0) {
    return null; // Don't show section if no events
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl md:text-2xl font-extrabold text-foreground uppercase tracking-wider flex items-center gap-2">
          <Goal className="text-green-500 animate-pulse" size={24} />
          Live Football
        </h2>
        <Badge variant="outline" className="text-green-500 border-green-500/50 animate-pulse">
          {events.filter(e => e.is_live).length} LIVE
        </Badge>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {events.map((event) => (
          <Link
            key={event.id}
            to={event.url ? `/channel/${encodeURIComponent(event.url)}` : '#'}
            className="group"
          >
            <Card className="relative overflow-hidden bg-gradient-to-br from-[#1a1f2e] to-[#242836] border-[#343a4d] hover:border-green-500/50 transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-lg group-hover:shadow-green-500/20">
              {/* Live indicator */}
              {event.is_live && (
                <div className="absolute top-2 left-2 z-10">
                  <Badge className="bg-red-600 text-white text-[10px] px-1.5 py-0.5 animate-pulse flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                    LIVE
                  </Badge>
                </div>
              )}
              
              {/* Viewers */}
              <div className="absolute top-2 right-2 z-10">
                <Badge variant="secondary" className="bg-black/60 text-white text-[10px] px-1.5 py-0.5 flex items-center gap-1">
                  <Users size={10} />
                  {event.viewers?.toLocaleString()}
                </Badge>
              </div>

              <div className="p-3">
                {/* League/Competition */}
                <div className="text-[10px] text-muted-foreground mb-2 truncate uppercase tracking-wider">
                  {event.league}
                </div>
                
                {/* Teams and Score */}
                <div className="space-y-2">
                  {/* Home Team */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground truncate flex-1 pr-2">
                      {event.home_team}
                    </span>
                    <span className="text-sm font-bold text-green-500 min-w-[20px] text-center">
                      {event.home_score}
                    </span>
                  </div>
                  
                  {/* Away Team */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground truncate flex-1 pr-2">
                      {event.away_team}
                    </span>
                    <span className="text-sm font-bold text-green-500 min-w-[20px] text-center">
                      {event.away_score}
                    </span>
                  </div>
                </div>

                {/* Time/Status */}
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Clock size={10} />
                    {event.time || event.status}
                  </div>
                  <div className="flex items-center gap-1 text-green-500 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
                    Watch <ChevronRight size={12} />
                  </div>
                </div>
              </div>
              
              {/* Play overlay on hover */}
              <div className="absolute inset-0 bg-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-green-500/80 flex items-center justify-center backdrop-blur-sm">
                  <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default LiveFootballSection;
