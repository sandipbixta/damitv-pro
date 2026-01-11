import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Clock, Tv } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface CustomMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  streamUrl: string;
  date: string;
  category: string;
  imageUrl?: string;
  visible: boolean;
}

const CustomMatchCards = () => {
  const [matches, setMatches] = useState<CustomMatch[]>([]);

  useEffect(() => {
    const loadMatches = async () => {
      try {
        const { data, error } = await supabase
          .from('custom_matches')
          .select('*')
          .eq('visible', true)
          .order('match_date', { ascending: false });

        if (error) {
          console.error('Error fetching custom matches:', error);
          return;
        }

        if (data) {
          const formattedMatches: CustomMatch[] = data.map(m => ({
            id: m.id,
            homeTeam: m.home_team,
            awayTeam: m.away_team,
            streamUrl: m.stream_url,
            date: m.match_date,
            category: m.category || 'Football',
            imageUrl: m.image_url || undefined,
            visible: m.visible ?? true
          }));
          setMatches(formattedMatches);
        }
      } catch (err) {
        console.error('Error loading matches:', err);
      }
    };

    loadMatches();
  }, []);

  if (matches.length === 0) {
    return null;
  }

  const isMatchLive = (matchDate: string) => {
    const now = new Date();
    const matchTime = new Date(matchDate);
    const diffMs = now.getTime() - matchTime.getTime();
    // Consider match "live" if it started within the last 3 hours
    return diffMs >= 0 && diffMs <= 3 * 60 * 60 * 1000;
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <section className="mb-8 px-4 md:px-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl md:text-2xl font-extrabold text-foreground uppercase tracking-wider flex items-center gap-2">
          <Tv className="text-primary" size={24} />
          Featured Matches
        </h2>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {matches.map((match) => {
          const isLive = isMatchLive(match.date);
          
          return (
            <Link key={match.id} to={`/custom-match/${match.id}`}>
              <Card className="group relative overflow-hidden bg-card border-border hover:border-primary/50 transition-all duration-300 hover:scale-[1.02] cursor-pointer">
                {/* Image */}
                <div className="relative aspect-video overflow-hidden">
                  {match.imageUrl ? (
                    <img
                      src={match.imageUrl}
                      alt={`${match.homeTeam} vs ${match.awayTeam}`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-sm font-bold text-foreground">{match.homeTeam}</p>
                        <p className="text-xs text-muted-foreground my-1">vs</p>
                        <p className="text-sm font-bold text-foreground">{match.awayTeam}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Live Badge */}
                  {isLive && (
                    <Badge className="absolute top-2 left-2 bg-red-600 text-white animate-pulse">
                      🔴 LIVE
                    </Badge>
                  )}
                  
                  {/* Play Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center">
                      <Play size={28} className="text-primary-foreground ml-1" fill="currentColor" />
                    </div>
                  </div>
                </div>
                
                {/* Info */}
                <div className="p-3">
                  <h3 className="font-semibold text-foreground text-sm mb-1 line-clamp-1">
                    {match.homeTeam} vs {match.awayTeam}
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{match.category}</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock size={12} />
                      {formatTime(match.date)}
                    </span>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default CustomMatchCards;
