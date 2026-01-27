import React from 'react';
import { Link } from 'react-router-dom';
import { useSportsData } from '@/contexts/SportsDataContext';
import { generateMatchSlug } from '@/utils/matchPreviewGenerator';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

const UpcomingMatchPreviews: React.FC = () => {
  const { allMatches, loading } = useSportsData();

  // Get upcoming matches (not started yet, within next 7 days)
  const upcomingMatches = React.useMemo(() => {
    const now = Date.now();
    const sevenDaysFromNow = now + 7 * 24 * 60 * 60 * 1000;

    return allMatches
      .filter(match => {
        const matchTime = typeof match.date === 'number' ? match.date : new Date(match.date).getTime();
        // Match is in the future and within 7 days
        return matchTime > now && matchTime < sevenDaysFromNow;
      })
      .sort((a, b) => {
        const aTime = typeof a.date === 'number' ? a.date : new Date(a.date).getTime();
        const bTime = typeof b.date === 'number' ? b.date : new Date(b.date).getTime();
        return aTime - bTime;
      })
      .slice(0, 6); // Show max 6 upcoming matches
  }, [allMatches]);

  if (loading || upcomingMatches.length === 0) {
    return null;
  }

  const formatMatchTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return {
      date: format(date, 'EEE, MMM d'),
      time: format(date, 'h:mm a')
    };
  };

  const getSportColor = (category: string) => {
    const colors: Record<string, string> = {
      football: 'bg-green-500/20 text-green-400',
      soccer: 'bg-green-500/20 text-green-400',
      basketball: 'bg-orange-500/20 text-orange-400',
      tennis: 'bg-yellow-500/20 text-yellow-400',
      cricket: 'bg-blue-500/20 text-blue-400',
      hockey: 'bg-cyan-500/20 text-cyan-400',
      baseball: 'bg-red-500/20 text-red-400',
      mma: 'bg-purple-500/20 text-purple-400',
      boxing: 'bg-purple-500/20 text-purple-400',
    };
    return colors[category?.toLowerCase()] || 'bg-primary/20 text-primary';
  };

  return (
    <section className="py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">Upcoming Match Previews</h2>
        <Link
          to="/schedule"
          className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
        >
          View Schedule <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {upcomingMatches.map((match) => {
          const homeTeam = match.teams?.home?.name || '';
          const awayTeam = match.teams?.away?.name || '';
          const matchSlug = generateMatchSlug(match);
          const matchTime = typeof match.date === 'number' ? match.date : new Date(match.date).getTime();
          const { date, time } = formatMatchTime(matchTime);

          return (
            <Link
              key={match.id}
              to={`/preview/${matchSlug}`}
              className="block"
            >
              <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer bg-card/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <Badge className={getSportColor(match.category || '')}>
                      {match.category?.charAt(0).toUpperCase() + match.category?.slice(1) || 'Sports'}
                    </Badge>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>{date}</span>
                    </div>
                  </div>

                  {homeTeam && awayTeam ? (
                    <div className="space-y-2">
                      <p className="font-semibold text-foreground truncate">{homeTeam}</p>
                      <p className="text-xs text-muted-foreground text-center">vs</p>
                      <p className="font-semibold text-foreground truncate">{awayTeam}</p>
                    </div>
                  ) : (
                    <p className="font-semibold text-foreground line-clamp-2">{match.title}</p>
                  )}

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{time}</span>
                    </div>
                    <span className="text-xs text-primary font-medium">View Preview →</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default UpcomingMatchPreviews;
