import React, { useMemo, useState, useEffect } from 'react';
import { Match } from '@/types/sports';
import { Loader2, RefreshCw, MapPin, User, Clock, TrendingUp, Trophy, Target, BarChart3, Users, Shield } from 'lucide-react';
import { useSportsDBMatch, StandingsEntry } from '@/hooks/useSportsDBMatch';
import { MatchExtras } from '@/services/perplexityMatchService';
import TeamLineups from './TeamLineups';
import MatchStats from './MatchStats';
import HeadToHead from './HeadToHead';
import MatchEventsTimeline from './MatchEventsTimeline';
import { format, formatDistanceToNowStrict, isPast } from 'date-fns';

interface MatchAnalysisProps {
  match: Match;
}

type TabId = 'overview' | 'lineups' | 'h2h' | 'table';

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'OVERVIEW', icon: <BarChart3 className="w-3.5 h-3.5" /> },
  { id: 'lineups', label: 'LINEUPS', icon: <Users className="w-3.5 h-3.5" /> },
  { id: 'h2h', label: 'H2H', icon: <Shield className="w-3.5 h-3.5" /> },
  { id: 'table', label: 'TABLE', icon: <Trophy className="w-3.5 h-3.5" /> },
];

// Form badge component
const FormBadge: React.FC<{ result: string }> = ({ result }) => {
  const colors: Record<string, string> = {
    W: 'bg-green-500 text-white',
    D: 'bg-yellow-500 text-white',
    L: 'bg-red-500 text-white',
  };
  return (
    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold ${colors[result] || 'bg-muted text-muted-foreground'}`}>
      {result}
    </span>
  );
};

// Countdown timer component
const CountdownTimer: React.FC<{ targetDate: number }> = ({ targetDate }) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (isPast(new Date(targetDate))) return null;

  const diff = targetDate - now;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return (
    <div className="flex items-center gap-1.5">
      {days > 0 && (
        <div className="flex flex-col items-center">
          <span className="text-lg font-bold text-foreground leading-none">{days}</span>
          <span className="text-[9px] text-muted-foreground uppercase">days</span>
        </div>
      )}
      {days > 0 && <span className="text-muted-foreground text-lg font-light">:</span>}
      <div className="flex flex-col items-center">
        <span className="text-lg font-bold text-foreground leading-none">{String(hours).padStart(2, '0')}</span>
        <span className="text-[9px] text-muted-foreground uppercase">hrs</span>
      </div>
      <span className="text-muted-foreground text-lg font-light">:</span>
      <div className="flex flex-col items-center">
        <span className="text-lg font-bold text-foreground leading-none">{String(minutes).padStart(2, '0')}</span>
        <span className="text-[9px] text-muted-foreground uppercase">min</span>
      </div>
      <span className="text-muted-foreground text-lg font-light">:</span>
      <div className="flex flex-col items-center">
        <span className="text-lg font-bold text-foreground leading-none">{String(seconds).padStart(2, '0')}</span>
        <span className="text-[9px] text-muted-foreground uppercase">sec</span>
      </div>
    </div>
  );
};

// Probability bar component
const ProbabilityBar: React.FC<{ homePct: number; drawPct: number; awayPct: number; homeTeam: string; awayTeam: string }> = ({
  homePct, drawPct, awayPct, homeTeam, awayTeam
}) => (
  <div className="space-y-2">
    <div className="flex justify-between text-xs text-muted-foreground">
      <span>{homeTeam}</span>
      <span>Draw</span>
      <span>{awayTeam}</span>
    </div>
    <div className="flex h-2.5 rounded-full overflow-hidden bg-muted/30 gap-0.5">
      <div className="bg-green-500 rounded-l-full transition-all duration-500" style={{ width: `${homePct}%` }} />
      <div className="bg-yellow-500 transition-all duration-500" style={{ width: `${drawPct}%` }} />
      <div className="bg-red-500 rounded-r-full transition-all duration-500" style={{ width: `${awayPct}%` }} />
    </div>
    <div className="flex justify-between text-sm font-bold">
      <span className="text-green-500">{homePct}%</span>
      <span className="text-yellow-500">{drawPct}%</span>
      <span className="text-red-500">{awayPct}%</span>
    </div>
  </div>
);

// Loading skeleton
const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-muted/50 rounded ${className}`} />
);

const TabSkeleton: React.FC = () => (
  <div className="space-y-3 p-2">
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-4 w-1/2" />
    <Skeleton className="h-20 w-full" />
    <Skeleton className="h-4 w-2/3" />
    <Skeleton className="h-4 w-1/3" />
  </div>
);

const MatchAnalysis: React.FC<MatchAnalysisProps> = ({ match }) => {
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const homeTeam = match.teams?.home?.name || '';
  const awayTeam = match.teams?.away?.name || '';
  const displayHomeTeam = homeTeam || 'Home Team';
  const displayAwayTeam = awayTeam || 'Away Team';

  const searchTeams = useMemo(() => {
    if (homeTeam && awayTeam) {
      return { homeTeam, awayTeam };
    }
    return null;
  }, [homeTeam, awayTeam]);

  const {
    match: sportsDBMatch,
    lineups,
    timeline,
    statistics,
    h2h,
    standings,
    extras,
    isLoading,
    lastUpdated,
    refetch,
  } = useSportsDBMatch({
    searchTeams,
    autoRefreshInterval: 60000,
    category: match.category,
  });

  const formatMatchDate = (timestamp: number) => {
    try { return format(new Date(timestamp), 'EEE, MMM d yyyy'); } catch { return ''; }
  };

  const formatMatchTime = (timestamp: number) => {
    try {
      // Use sportsDB time if available (more accurate)
      if (sportsDBMatch?.time) {
        return sportsDBMatch.time.replace(/:\d{2}$/, ''); // strip seconds
      }
      return format(new Date(timestamp), 'HH:mm');
    } catch { return ''; }
  };

  const hasLineups = lineups && (lineups.home.length > 0 || lineups.away.length > 0);
  const hasH2H = h2h && h2h.length > 0;
  const hasStandings = standings && standings.length > 0;
  const isMatchLive = sportsDBMatch?.isLive;
  const hasScore = sportsDBMatch != null && sportsDBMatch.homeScore !== null && sportsDBMatch.awayScore !== null;
  const isUpcoming = match.date ? (!isPast(new Date(match.date)) && !hasScore) : false;

  return (
    <div className="space-y-3">
      {/* ─── Score Header Card ─── */}
      <div className="rounded-xl overflow-hidden border border-border bg-gradient-to-b from-card via-card to-muted/20">
        {/* League bar */}
        <div className="px-4 py-2 flex items-center justify-between border-b border-border/50">
          <div className="flex items-center gap-2">
            {sportsDBMatch?.leagueBadge && (
              <img src={sportsDBMatch.leagueBadge} alt="" className="w-4 h-4 object-contain" />
            )}
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              {extras?.league || sportsDBMatch?.league || match.category || 'Football'}
              {sportsDBMatch?.round && <span className="text-muted-foreground/60"> · Matchday {sportsDBMatch.round}</span>}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isMatchLive && (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-green-500 uppercase">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
                LIVE
              </span>
            )}
            {lastUpdated && (
              <button onClick={refetch} className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors">
                <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>
        </div>

        {/* Score area */}
        <div className="px-4 py-5 sm:py-6">
          <div className="flex items-center justify-center gap-3 sm:gap-6">
            {/* Home team */}
            <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
              {sportsDBMatch?.homeTeamBadge ? (
                <img src={sportsDBMatch.homeTeamBadge} alt={displayHomeTeam} className="w-12 h-12 sm:w-14 sm:h-14 object-contain drop-shadow-md" />
              ) : (
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-muted/50 flex items-center justify-center text-lg font-bold text-muted-foreground">
                  {displayHomeTeam.charAt(0)}
                </div>
              )}
              <span className="text-xs sm:text-sm font-semibold text-foreground text-center truncate max-w-[100px] sm:max-w-none">{sportsDBMatch?.homeTeam || displayHomeTeam}</span>
              {/* Home form */}
              {extras?.homeForm && extras.homeForm.length > 0 && (
                <div className="flex gap-0.5">
                  {extras.homeForm.slice(0, 5).map((r, i) => <FormBadge key={i} result={r} />)}
                </div>
              )}
            </div>

            {/* Score / Countdown */}
            <div className="flex flex-col items-center gap-1 px-2">
              {hasScore ? (
                <>
                  <div className="text-3xl sm:text-5xl font-extrabold text-foreground tracking-tight">
                    {sportsDBMatch!.homeScore} <span className="text-muted-foreground/40 mx-1">-</span> {sportsDBMatch!.awayScore}
                  </div>
                  {isMatchLive && sportsDBMatch?.progress && (
                    <span className="text-xs font-semibold text-green-500 bg-green-500/10 px-2.5 py-0.5 rounded-full">
                      {sportsDBMatch.progress}'
                    </span>
                  )}
                  {!isMatchLive && sportsDBMatch?.status && (
                    <span className="text-[11px] text-muted-foreground font-medium uppercase">{sportsDBMatch.status}</span>
                  )}
                </>
              ) : isUpcoming ? (
                <CountdownTimer targetDate={match.date!} />
              ) : (
                <div className="text-2xl sm:text-3xl font-bold text-muted-foreground">
                  {match.date ? formatMatchTime(match.date) : 'TBD'}
                </div>
              )}
              {match.date && !hasScore && (
                <span className="text-[10px] text-muted-foreground mt-1">{formatMatchDate(match.date)}</span>
              )}
            </div>

            {/* Away team */}
            <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
              {sportsDBMatch?.awayTeamBadge ? (
                <img src={sportsDBMatch.awayTeamBadge} alt={displayAwayTeam} className="w-12 h-12 sm:w-14 sm:h-14 object-contain drop-shadow-md" />
              ) : (
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-muted/50 flex items-center justify-center text-lg font-bold text-muted-foreground">
                  {displayAwayTeam.charAt(0)}
                </div>
              )}
              <span className="text-xs sm:text-sm font-semibold text-foreground text-center truncate max-w-[100px] sm:max-w-none">{sportsDBMatch?.awayTeam || displayAwayTeam}</span>
              {/* Away form */}
              {extras?.awayForm && extras.awayForm.length > 0 && (
                <div className="flex gap-0.5">
                  {extras.awayForm.slice(0, 5).map((r, i) => <FormBadge key={i} result={r} />)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Tabs ─── */}
      <div className="rounded-xl overflow-hidden border border-border bg-card">
        {/* Tab bar */}
        <div className="flex border-b border-border bg-muted/20">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-[11px] sm:text-xs font-semibold tracking-wider transition-all duration-200 ${
                activeTab === tab.id
                  ? 'text-primary border-b-2 border-primary bg-primary/5'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-4">
          {/* ─── OVERVIEW Tab ─── */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {isLoading && !sportsDBMatch && !extras && <TabSkeleton />}

              {/* Match Prediction */}
              {extras?.prediction && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <h4 className="text-sm font-bold text-foreground">Match Prediction</h4>
                  </div>
                  <div className="bg-muted/20 rounded-lg p-4 space-y-3">
                    <ProbabilityBar
                      homePct={extras.prediction.homeWinPct}
                      drawPct={extras.prediction.drawPct}
                      awayPct={extras.prediction.awayWinPct}
                      homeTeam={sportsDBMatch?.homeTeam || displayHomeTeam}
                      awayTeam={sportsDBMatch?.awayTeam || displayAwayTeam}
                    />
                    <div className="flex items-center justify-center gap-2 pt-1">
                      <Target className="w-3.5 h-3.5 text-primary" />
                      <span className="text-xs text-muted-foreground">
                        Predicted: <span className="font-bold text-foreground">{extras.prediction.predictedScore}</span>
                      </span>
                    </div>
                    {extras.prediction.reasoning && (
                      <p className="text-[11px] text-muted-foreground text-center italic">{extras.prediction.reasoning}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Match Info Grid */}
              <div className="grid grid-cols-2 gap-3">
                {(extras?.league || sportsDBMatch?.league || match.category) && (
                  <InfoCard icon={<Trophy className="w-4 h-4" />} label="Competition" value={extras?.league || sportsDBMatch?.league || match.category || ''} />
                )}
                {match.date && (
                  <InfoCard icon={<Clock className="w-4 h-4" />} label="Kick-off" value={`${formatMatchDate(match.date)} · ${formatMatchTime(match.date)}`} />
                )}
                {(sportsDBMatch?.venue || extras?.league) && sportsDBMatch?.venue && (
                  <InfoCard icon={<MapPin className="w-4 h-4" />} label="Venue" value={sportsDBMatch.venue} />
                )}
                {(sportsDBMatch?.referee) && (
                  <InfoCard icon={<User className="w-4 h-4" />} label="Referee" value={sportsDBMatch.referee} />
                )}
                {extras?.homeManager && (
                  <InfoCard icon={<User className="w-4 h-4" />} label={`${displayHomeTeam} Manager`} value={extras.homeManager} />
                )}
                {extras?.awayManager && (
                  <InfoCard icon={<User className="w-4 h-4" />} label={`${displayAwayTeam} Manager`} value={extras.awayManager} />
                )}
              </div>

              {/* Top Scorers */}
              {extras && (extras.homeTopScorers.length > 0 || extras.awayTopScorers.length > 0) && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" />
                    <h4 className="text-sm font-bold text-foreground">Top Scorers This Season</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Home scorers */}
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{sportsDBMatch?.homeTeam || displayHomeTeam}</div>
                      {extras.homeTopScorers.slice(0, 3).map((s, i) => (
                        <div key={i} className="flex items-center justify-between bg-muted/20 rounded-md px-2.5 py-1.5">
                          <span className="text-xs text-foreground truncate">{s.name}</span>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground flex-shrink-0">
                            <span className="font-bold text-foreground">{s.goals}G</span>
                            <span>{s.assists}A</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Away scorers */}
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{sportsDBMatch?.awayTeam || displayAwayTeam}</div>
                      {extras.awayTopScorers.slice(0, 3).map((s, i) => (
                        <div key={i} className="flex items-center justify-between bg-muted/20 rounded-md px-2.5 py-1.5">
                          <span className="text-xs text-foreground truncate">{s.name}</span>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground flex-shrink-0">
                            <span className="font-bold text-foreground">{s.goals}G</span>
                            <span>{s.assists}A</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Match Stats */}
              {sportsDBMatch && statistics && (
                <MatchStats
                  match={sportsDBMatch}
                  statistics={statistics}
                  homeTeam={displayHomeTeam}
                  awayTeam={displayAwayTeam}
                />
              )}

              {/* Match Events Timeline */}
              {timeline && timeline.length > 0 && (
                <MatchEventsTimeline
                  timeline={timeline}
                  homeTeam={sportsDBMatch?.homeTeam || displayHomeTeam}
                  awayTeam={sportsDBMatch?.awayTeam || displayAwayTeam}
                />
              )}

              {/* Empty state */}
              {!isLoading && !sportsDBMatch && !extras && (
                <EmptyState message="Match data is loading..." onRetry={refetch} />
              )}
            </div>
          )}

          {/* ─── LINEUPS Tab ─── */}
          {activeTab === 'lineups' && (
            <div>
              {isLoading && !hasLineups && <TabSkeleton />}
              {hasLineups ? (
                <TeamLineups
                  lineups={lineups!}
                  homeTeam={sportsDBMatch?.homeTeam || displayHomeTeam}
                  awayTeam={sportsDBMatch?.awayTeam || displayAwayTeam}
                  homeFormation={sportsDBMatch?.homeFormation}
                  awayFormation={sportsDBMatch?.awayFormation}
                />
              ) : !isLoading ? (
                <EmptyState message="Lineups not yet available for this match." onRetry={refetch} />
              ) : null}
            </div>
          )}

          {/* ─── H2H Tab ─── */}
          {activeTab === 'h2h' && (
            <div>
              {isLoading && !hasH2H && <TabSkeleton />}
              {hasH2H ? (
                <HeadToHead h2h={h2h!} homeTeam={displayHomeTeam} awayTeam={displayAwayTeam} />
              ) : !isLoading ? (
                <EmptyState message="No head-to-head data available." onRetry={refetch} />
              ) : null}
            </div>
          )}

          {/* ─── TABLE Tab ─── */}
          {activeTab === 'table' && (
            <div>
              {isLoading && !hasStandings && <TabSkeleton />}
              {hasStandings ? (
                <StandingsTable
                  standings={standings!}
                  homeTeam={sportsDBMatch?.homeTeam || displayHomeTeam}
                  awayTeam={sportsDBMatch?.awayTeam || displayAwayTeam}
                />
              ) : !isLoading ? (
                <EmptyState message="League table not available." onRetry={refetch} />
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Sub-components ───

const InfoCard: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="bg-muted/20 rounded-lg p-3 flex items-start gap-2.5">
    <div className="text-primary mt-0.5 flex-shrink-0">{icon}</div>
    <div className="min-w-0">
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{label}</div>
      <div className="text-xs font-semibold text-foreground mt-0.5 truncate">{value}</div>
    </div>
  </div>
);

const EmptyState: React.FC<{ message: string; onRetry: () => void }> = ({ message, onRetry }) => (
  <div className="flex flex-col items-center justify-center py-10 gap-3">
    <div className="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center">
      <BarChart3 className="w-5 h-5 text-muted-foreground" />
    </div>
    <p className="text-sm text-muted-foreground text-center">{message}</p>
    <button
      onClick={onRetry}
      className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors font-medium"
    >
      <RefreshCw className="w-3.5 h-3.5" />
      Check for updates
    </button>
  </div>
);

const StandingsTable: React.FC<{
  standings: StandingsEntry[];
  homeTeam: string;
  awayTeam: string;
}> = ({ standings, homeTeam, awayTeam }) => {
  const isHighlighted = (team: string) => {
    const t = team.toLowerCase();
    const h = homeTeam.toLowerCase().split(' ')[0];
    const a = awayTeam.toLowerCase().split(' ')[0];
    return t.includes(h) || homeTeam.toLowerCase().includes(t.split(' ')[0]) ||
           t.includes(a) || awayTeam.toLowerCase().includes(t.split(' ')[0]);
  };

  return (
    <div className="overflow-x-auto -mx-4 px-4">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-[10px] text-muted-foreground uppercase border-b border-border">
            <th className="text-left py-2 pr-1 w-6">#</th>
            <th className="text-left py-2">Team</th>
            <th className="text-center py-2 w-7">P</th>
            <th className="text-center py-2 w-7">W</th>
            <th className="text-center py-2 w-7">D</th>
            <th className="text-center py-2 w-7">L</th>
            <th className="text-center py-2 w-8 hidden sm:table-cell">GD</th>
            <th className="text-center py-2 w-8 font-bold">Pts</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((entry) => {
            const hl = isHighlighted(entry.team);
            return (
              <tr
                key={entry.teamId}
                className={`border-b border-border/30 transition-colors ${
                  hl ? 'bg-primary/10' : 'hover:bg-muted/20'
                }`}
              >
                <td className="py-2 pr-1 text-muted-foreground font-medium">{entry.rank}</td>
                <td className="py-2">
                  <div className="flex items-center gap-1.5">
                    {entry.teamBadge && <img src={entry.teamBadge} alt="" className="w-4 h-4 object-contain" />}
                    <span className={`truncate max-w-[120px] sm:max-w-none ${hl ? 'font-bold text-primary' : 'text-foreground'}`}>
                      {entry.team}
                    </span>
                  </div>
                </td>
                <td className="text-center py-2 text-muted-foreground">{entry.played}</td>
                <td className="text-center py-2 text-muted-foreground">{entry.wins}</td>
                <td className="text-center py-2 text-muted-foreground">{entry.draws}</td>
                <td className="text-center py-2 text-muted-foreground">{entry.losses}</td>
                <td className="text-center py-2 text-muted-foreground hidden sm:table-cell">{entry.goalDifference}</td>
                <td className="text-center py-2 font-bold text-foreground">{entry.points}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default MatchAnalysis;
