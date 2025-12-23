import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, TrendingUp, Shield, Target } from 'lucide-react';
import { statsService } from '@/services/statsService';

interface TeamStat {
  team_name: string;
  team_id: string;
  matches_played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_scored: number;
  goals_conceded: number;
  clean_sheets: number;
  win_rate: number;
  average_goals: number;
  form_last_5: string[];
  current_position: number;
  total_points: number;
}

interface HeadToHeadStat {
  team_a_name: string;
  team_b_name: string;
  total_matches: number;
  team_a_wins: number;
  team_b_wins: number;
  draws: number;
  last_5_results: string[];
  last_match_date: string;
  last_match_score: string;
}

interface TeamStatsProps {
  homeTeamId: string;
  homeTeamName: string;
  awayTeamId: string;
  awayTeamName: string;
  sport: string;
}

export const TeamStats = ({ 
  homeTeamId, 
  homeTeamName, 
  awayTeamId, 
  awayTeamName, 
  sport 
}: TeamStatsProps) => {
  const [homeStats, setHomeStats] = useState<TeamStat | null>(null);
  const [awayStats, setAwayStats] = useState<TeamStat | null>(null);
  const [h2hStats, setH2hStats] = useState<HeadToHeadStat | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [homeTeamId, awayTeamId, sport]);

  const loadStats = async () => {
    setLoading(true);

    try {
      // Fetch stats from API if not in DB, using team names
      const [homeData, awayData, h2hResult] = await Promise.all([
        statsService.getTeamStats(homeTeamName, sport),
        statsService.getTeamStats(awayTeamName, sport),
        supabase
          .from('head_to_head_stats')
          .select('*')
          .or(`and(team_a_name.eq.${homeTeamName},team_b_name.eq.${awayTeamName}),and(team_a_name.eq.${awayTeamName},team_b_name.eq.${homeTeamName})`)
          .eq('sport', sport.toLowerCase())
          .maybeSingle()
      ]);

      setHomeStats(homeData);
      setAwayStats(awayData);
      setH2hStats(h2hResult.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderForm = (form: string[]) => {
    return (
      <div className="flex gap-1">
        {form.map((result, i) => (
          <div
            key={i}
            className={`w-6 h-6 rounded flex items-center justify-center text-xs font-semibold ${
              result === 'W' ? 'bg-green-500/20 text-green-500' :
              result === 'L' ? 'bg-red-500/20 text-red-500' :
              'bg-yellow-500/20 text-yellow-500'
            }`}
          >
            {result}
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-32 bg-muted rounded" />
        </div>
      </Card>
    );
  }

  if (!homeStats && !awayStats && !h2hStats) {
    return (
      <Card className="p-6 bg-muted/30">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-muted-foreground">
            Statistics not available for this match yet.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Tabs defaultValue="comparison" className="w-full overflow-x-hidden">
      <TabsList className="grid w-full grid-cols-3 text-xs sm:text-sm">
        <TabsTrigger value="comparison" className="px-2 sm:px-3">Stats</TabsTrigger>
        <TabsTrigger value="home" className="px-2 sm:px-3 truncate">Home</TabsTrigger>
        <TabsTrigger value="away" className="px-2 sm:px-3 truncate">Away</TabsTrigger>
      </TabsList>

      <TabsContent value="comparison" className="space-y-4 mt-4">
        {h2hStats && (
          <Card className="p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <Target className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              <h3 className="font-semibold text-sm sm:text-base">Head to Head</h3>
            </div>
            
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-xs sm:text-sm text-muted-foreground mb-1 sm:mb-2">Total Matches</p>
                <p className="text-2xl sm:text-3xl font-bold">{h2hStats.total_matches}</p>
              </div>
              
              <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1 truncate">{h2hStats.team_a_name}</p>
                  <p className="text-xl sm:text-2xl font-bold text-primary">{h2hStats.team_a_wins}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">Draws</p>
                  <p className="text-xl sm:text-2xl font-bold">{h2hStats.draws}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1 truncate">{h2hStats.team_b_name}</p>
                  <p className="text-xl sm:text-2xl font-bold text-primary">{h2hStats.team_b_wins}</p>
                </div>
              </div>

              {h2hStats.last_5_results?.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Last 5 Meetings</p>
                  {renderForm(h2hStats.last_5_results)}
                </div>
              )}

              {h2hStats.last_match_score && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">Last Match</p>
                  <p className="font-semibold">{h2hStats.last_match_score}</p>
                  {h2hStats.last_match_date && (
                    <p className="text-xs text-muted-foreground">
                      {new Date(h2hStats.last_match_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}
            </div>
          </Card>
        )}

        {homeStats && awayStats && (
          <Card className="p-4 sm:p-6">
            <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Season Statistics</h3>
            <div className="space-y-3 sm:space-y-4">
              {[
                { label: 'Win Rate', home: homeStats.win_rate, away: awayStats.win_rate, suffix: '%' },
                { label: 'Goals/Game', home: homeStats.average_goals, away: awayStats.average_goals, suffix: '' },
                { label: 'Clean Sheets', home: homeStats.clean_sheets, away: awayStats.clean_sheets, suffix: '' },
                { label: 'Points', home: homeStats.total_points, away: awayStats.total_points, suffix: '' },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1 sm:mb-2">{stat.label}</p>
                  <div className="flex items-center justify-between gap-2 sm:gap-4">
                    <div className="text-right font-semibold text-sm sm:text-base min-w-[40px]">{stat.home}{stat.suffix}</div>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-primary to-primary/60"
                        style={{ 
                          width: `${(stat.home / (stat.home + stat.away)) * 100}%`,
                          float: 'left'
                        }}
                      />
                      <div 
                        className="h-full bg-gradient-to-l from-accent to-accent/60"
                        style={{ 
                          width: `${(stat.away / (stat.home + stat.away)) * 100}%`,
                          float: 'right'
                        }}
                      />
                    </div>
                    <div className="font-semibold text-sm sm:text-base min-w-[40px]">{stat.away}{stat.suffix}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="home" className="mt-4">
        {homeStats ? (
          <Card className="p-4 sm:p-6">
            <h3 className="font-semibold mb-4 sm:mb-6 text-sm sm:text-base truncate">{homeStats.team_name}</h3>
            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              <StatCard icon={<BarChart3 className="w-4 h-4" />} label="Matches" value={homeStats.matches_played} />
              <StatCard icon={<TrendingUp className="w-4 h-4" />} label="Wins" value={homeStats.wins} />
              <StatCard icon={<Shield className="w-4 h-4" />} label="Clean Sheets" value={homeStats.clean_sheets} />
              <StatCard icon={<Target className="w-4 h-4" />} label="Goals" value={homeStats.goals_scored} />
            </div>
            {homeStats.form_last_5?.length > 0 && (
              <div className="mt-4 sm:mt-6">
                <p className="text-xs sm:text-sm font-medium mb-2">Recent Form</p>
                {renderForm(homeStats.form_last_5)}
              </div>
            )}
          </Card>
        ) : (
          <Card className="p-6 text-center text-muted-foreground">
            Statistics not available for {homeTeamName}
          </Card>
        )}
      </TabsContent>

      <TabsContent value="away" className="mt-4">
        {awayStats ? (
          <Card className="p-4 sm:p-6">
            <h3 className="font-semibold mb-4 sm:mb-6 text-sm sm:text-base truncate">{awayStats.team_name}</h3>
            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              <StatCard icon={<BarChart3 className="w-4 h-4" />} label="Matches" value={awayStats.matches_played} />
              <StatCard icon={<TrendingUp className="w-4 h-4" />} label="Wins" value={awayStats.wins} />
              <StatCard icon={<Shield className="w-4 h-4" />} label="Clean Sheets" value={awayStats.clean_sheets} />
              <StatCard icon={<Target className="w-4 h-4" />} label="Goals" value={awayStats.goals_scored} />
            </div>
            {awayStats.form_last_5?.length > 0 && (
              <div className="mt-4 sm:mt-6">
                <p className="text-xs sm:text-sm font-medium mb-2">Recent Form</p>
                {renderForm(awayStats.form_last_5)}
              </div>
            )}
          </Card>
        ) : (
          <Card className="p-6 text-center text-muted-foreground">
            Statistics not available for {awayTeamName}
          </Card>
        )}
      </TabsContent>
    </Tabs>
  );
};

const StatCard = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) => (
  <div className="p-3 sm:p-4 rounded-lg bg-muted/30 border">
    <div className="flex items-center gap-2 mb-1 sm:mb-2 text-primary">
      {icon}
    </div>
    <p className="text-xl sm:text-2xl font-bold">{value}</p>
    <p className="text-xs text-muted-foreground mt-1">{label}</p>
  </div>
);
