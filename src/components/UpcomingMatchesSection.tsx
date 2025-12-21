import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, ChevronRight } from 'lucide-react';
import { format, addDays } from 'date-fns';
import TeamLogo from './TeamLogo';
import SectionHeader from './SectionHeader';

interface UpcomingMatch {
  idEvent: string;
  strEvent: string;
  strHomeTeam: string;
  strAwayTeam: string;
  strHomeTeamBadge: string | null;
  strAwayTeamBadge: string | null;
  dateEvent: string;
  strTime: string;
  strLeague: string;
  strThumb: string | null;
}

const SPORTS_DB_API_KEY = '751945';
const SPORTS_DB_BASE_URL = 'https://www.thesportsdb.com/api/v1/json';

const POPULAR_LEAGUES = [
  { id: '4328', name: 'Premier League' },
  { id: '4335', name: 'La Liga' },
  { id: '4331', name: 'Bundesliga' },
  { id: '4332', name: 'Serie A' },
  { id: '4334', name: 'Ligue 1' },
  { id: '4480', name: 'Champions League' },
];

const UpcomingMatchesSection: React.FC = () => {
  const [upcomingMatches, setUpcomingMatches] = useState<UpcomingMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeague, setSelectedLeague] = useState<string | null>(null);

  useEffect(() => {
    const fetchUpcomingMatches = async () => {
      setLoading(true);
      const allMatches: UpcomingMatch[] = [];

      try {
        for (const league of POPULAR_LEAGUES) {
          try {
            const url = `${SPORTS_DB_BASE_URL}/${SPORTS_DB_API_KEY}/eventsnextleague.php?id=${league.id}`;
            const response = await fetch(url);
            
            if (!response.ok) continue;
            
            const data = await response.json();
            const events = data.events || [];
            
            // Get next 3 matches per league
            const upcomingEvents = events.slice(0, 3).map((event: any) => ({
              ...event,
              leagueName: league.name
            }));

            allMatches.push(...upcomingEvents);
          } catch (err) {
            console.error(`Error fetching upcoming matches for ${league.name}:`, err);
          }
        }

        // Sort by date
        allMatches.sort((a, b) => {
          const dateA = new Date(`${a.dateEvent}T${a.strTime || '00:00'}`);
          const dateB = new Date(`${b.dateEvent}T${b.strTime || '00:00'}`);
          return dateA.getTime() - dateB.getTime();
        });

        setUpcomingMatches(allMatches);
      } catch (error) {
        console.error('Error fetching upcoming matches:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUpcomingMatches();
    
    // Refresh every 30 minutes
    const interval = setInterval(fetchUpcomingMatches, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getUniqueLeagues = () => {
    const leagues = new Set(upcomingMatches.map((m: any) => m.leagueName));
    return Array.from(leagues);
  };

  const filteredMatches = selectedLeague
    ? upcomingMatches.filter((m: any) => m.leagueName === selectedLeague)
    : upcomingMatches;

  const formatMatchTime = (dateStr: string, timeStr: string) => {
    try {
      const date = new Date(`${dateStr}T${timeStr || '00:00'}`);
      return format(date, 'EEE, MMM d • h:mm a');
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-card rounded-xl p-6 border border-border">
      <SectionHeader title="Upcoming Matches" seeAllLink="/schedule" seeAllText="Full Schedule" />

      {/* League filter */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => setSelectedLeague(null)}
          className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors ${
            selectedLeague === null
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-accent'
          }`}
        >
          All
        </button>
        {getUniqueLeagues().map(league => (
          <button
            key={league}
            onClick={() => setSelectedLeague(league)}
            className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors ${
              selectedLeague === league
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-accent'
            }`}
          >
            {league}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Loading matches...</span>
          </div>
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground">
          No upcoming matches scheduled.
        </div>
      ) : (
        <div className="space-y-2">
          {filteredMatches.slice(0, 8).map((match: any) => (
            <Link
              key={match.idEvent}
              to={`/schedule`}
              className="flex items-center gap-3 p-3 bg-muted/30 hover:bg-muted/50 rounded-lg transition-colors group"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <TeamLogo
                  teamName={match.strHomeTeam}
                  sport="football"
                  size="sm"
                  className="w-6 h-6 flex-shrink-0"
                />
                <span className="text-sm font-medium text-foreground truncate">
                  {match.strHomeTeam}
                </span>
                <span className="text-xs text-muted-foreground">vs</span>
                <span className="text-sm font-medium text-foreground truncate">
                  {match.strAwayTeam}
                </span>
                <TeamLogo
                  teamName={match.strAwayTeam}
                  sport="football"
                  size="sm"
                  className="w-6 h-6 flex-shrink-0"
                />
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-[10px] text-primary font-medium">
                  {match.leagueName}
                </span>
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatMatchTime(match.dateEvent, match.strTime)}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default UpcomingMatchesSection;
