import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, ChevronRight, Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface MatchPreview {
  id: string;
  home_team: string;
  away_team: string;
  match_time: string;
  league: string | null;
  sport: string | null;
  seo_preview: string | null;
}

// Generate URL slug from team names
function generateMatchSlug(homeTeam: string, awayTeam: string): string {
  const slugify = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return `${slugify(homeTeam)}-vs-${slugify(awayTeam)}-live-stream`;
}

const UpcomingMatchPreviews: React.FC = () => {
  const [matches, setMatches] = useState<MatchPreview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const { data, error } = await supabase
          .from('matches')
          .select('id, home_team, away_team, match_time, league, sport, seo_preview')
          .gte('match_time', new Date().toISOString())
          .order('match_time', { ascending: true })
          .limit(6);

        if (error) {
          console.error('Error fetching match previews:', error);
        } else {
          setMatches(data || []);
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, []);

  if (loading) {
    return (
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-xl md:text-2xl font-extrabold text-foreground uppercase tracking-wider">
            AI Match Previews
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      </section>
    );
  }

  if (matches.length === 0) {
    return null;
  }

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-xl md:text-2xl font-extrabold text-foreground uppercase tracking-wider">
            AI Match Previews
          </h2>
        </div>
        <Link 
          to="/schedule" 
          className="text-sm text-primary hover:underline flex items-center gap-1"
        >
          View All <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {matches.map((match) => {
          const slug = generateMatchSlug(match.home_team, match.away_team);
          const matchDate = new Date(match.match_time);
          
          return (
            <Link
              key={match.id}
              to={`/match/${slug}`}
              className="group bg-card/50 hover:bg-card border border-border/50 hover:border-primary/50 rounded-xl p-4 transition-all duration-200"
            >
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <Calendar className="h-3.5 w-3.5" />
                <span>
                  {matchDate.toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
                {match.league && (
                  <>
                    <span className="text-border">•</span>
                    <span className="text-primary/80">{match.league}</span>
                  </>
                )}
              </div>
              
              <h3 className="font-bold text-foreground group-hover:text-primary transition-colors mb-2">
                {match.home_team} vs {match.away_team}
              </h3>
              
              {match.seo_preview && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {match.seo_preview.slice(0, 120)}...
                </p>
              )}
              
              <div className="mt-3 flex items-center text-xs text-primary font-medium">
                Read Preview <ChevronRight className="h-3.5 w-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default UpcomingMatchPreviews;
