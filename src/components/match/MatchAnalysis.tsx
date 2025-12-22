import React, { useState } from 'react';
import { Match } from '@/types/sports';
import { TrendingUp, Users, Trophy, Calendar, AlertCircle, Search } from 'lucide-react';
import { useSportsDBMatch } from '@/hooks/useSportsDBMatch';
import LiveMatchData from './LiveMatchData';
import MatchEventsTimeline from './MatchEventsTimeline';
import TeamLineups from './TeamLineups';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface MatchAnalysisProps {
  match: Match;
}

const MatchAnalysis: React.FC<MatchAnalysisProps> = ({ match }) => {
  const homeTeam = match.teams?.home?.name || 'Home Team';
  const awayTeam = match.teams?.away?.name || 'Away Team';
  const league = match.category || 'League';

  // State for TheSportsDB event ID lookup
  const [eventId, setEventId] = useState<string>('');
  const [searchEventId, setSearchEventId] = useState<string | null>(null);

  // Fetch real match data from TheSportsDB
  const {
    match: sportsDBMatch,
    lineups,
    timeline,
    isLoading,
    error,
    lastUpdated,
    refetch,
  } = useSportsDBMatch(searchEventId, 60000); // Auto-refresh every 60 seconds

  const handleEventSearch = () => {
    if (eventId.trim()) {
      setSearchEventId(eventId.trim());
    }
  };

  return (
    <div className="space-y-6 mt-8">
      {/* TheSportsDB Integration */}
      <section className="bg-card text-card-foreground rounded-lg p-6 border border-border">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-foreground">
          <Search className="h-5 w-5 text-primary" />
          Live Match Data
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Enter a TheSportsDB Event ID to load real-time scores, lineups, and match events.
        </p>
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="e.g., 1234567"
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleEventSearch()}
            className="max-w-xs"
          />
          <Button onClick={handleEventSearch} disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Load Match'}
          </Button>
        </div>
        {error && (
          <div className="mt-3 flex items-center gap-2 text-destructive text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}
      </section>

      {/* Live Match Data Display */}
      {sportsDBMatch && (
        <LiveMatchData
          match={sportsDBMatch}
          lastUpdated={lastUpdated}
          isLoading={isLoading}
          onRefresh={refetch}
        />
      )}

      {/* Team Lineups */}
      {lineups && (lineups.home.length > 0 || lineups.away.length > 0) && (
        <TeamLineups
          lineups={lineups}
          homeTeam={sportsDBMatch?.homeTeam || homeTeam}
          awayTeam={sportsDBMatch?.awayTeam || awayTeam}
          homeFormation={sportsDBMatch?.homeFormation}
          awayFormation={sportsDBMatch?.awayFormation}
        />
      )}

      {/* Match Events Timeline */}
      {timeline && timeline.length > 0 && (
        <MatchEventsTimeline
          timeline={timeline}
          homeTeam={sportsDBMatch?.homeTeam || homeTeam}
          awayTeam={sportsDBMatch?.awayTeam || awayTeam}
        />
      )}

      {/* Original Match Preview Content */}
      <section className="bg-card text-card-foreground rounded-lg p-6 border border-border">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-foreground">
          <TrendingUp className="h-6 w-6 text-primary" />
          Match Preview: {homeTeam} vs {awayTeam}
        </h2>
        <div className="space-y-4">
          <p className="text-lg leading-relaxed text-foreground">
            Get ready for an exciting {league} match as {homeTeam} host {awayTeam} in what promises 
            to be a thrilling encounter. Both teams will be looking to secure crucial points in this 
            competitive fixture.
          </p>
          <p className="leading-relaxed text-muted-foreground">
            {homeTeam} will rely on their home advantage and the support of their passionate fans 
            to deliver a strong performance. With their tactical setup and key players in form, they 
            are expected to put up a solid challenge.
          </p>
          <p className="leading-relaxed text-muted-foreground">
            Meanwhile, {awayTeam} come into this match with determination and a game plan designed 
            to counter their opponents' strengths. Their away form and ability to perform under pressure 
            will be crucial factors in this encounter.
          </p>
        </div>
      </section>

      <section className="bg-card text-card-foreground rounded-lg p-6 border border-border">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-foreground">
          <Users className="h-5 w-5 text-primary" />
          Team Analysis
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-bold text-lg mb-3 text-foreground">{homeTeam}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong className="text-foreground">Home Form:</strong> Strong performance in recent home fixtures with solid defensive organization</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong className="text-foreground">Key Strengths:</strong> Excellent midfield control and quick counter-attacking ability</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong className="text-foreground">Recent Results:</strong> Consistent performances showing good momentum coming into this match</span>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-lg mb-3 text-foreground">{awayTeam}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong className="text-foreground">Away Form:</strong> Solid away record with tactical flexibility and resilience</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong className="text-foreground">Key Strengths:</strong> Strong attacking options and effective set-piece routines</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong className="text-foreground">Recent Results:</strong> Showing good form with competitive displays in recent matches</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-card text-card-foreground rounded-lg p-6 border border-border">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-foreground">
          <Trophy className="h-5 w-5 text-primary" />
          Head-to-Head Record
        </h3>
        <div className="space-y-4">
          <p className="text-muted-foreground">
            The historical encounters between {homeTeam} and {awayTeam} have produced memorable moments 
            and competitive matches. Both teams know each other well, making this fixture even more 
            intriguing for fans and neutral observers alike.
          </p>
          <p className="text-muted-foreground">
            Previous meetings have shown that matches between these sides are often closely contested, 
            with fine margins deciding the outcome. Expect another tactical battle as both teams aim 
            to claim the three points.
          </p>
        </div>
      </section>

      <section className="bg-card text-card-foreground rounded-lg p-6 border border-border">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-foreground">
          <Calendar className="h-5 w-5 text-primary" />
          What to Expect
        </h3>
        <div className="space-y-4">
          <p className="text-muted-foreground">
            This {league} fixture promises to deliver entertainment, passion, and quality football. 
            Key battles across the pitch will determine the flow of the game, with midfield control 
            likely to play a crucial role.
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>Tactical matchup between two well-organized teams</li>
            <li>Individual duels between star players that could decide the match</li>
            <li>Set pieces and dead-ball situations as potential game-changers</li>
            <li>High intensity and competitive spirit throughout the 90 minutes</li>
          </ul>
          <p className="text-muted-foreground">
            Watch the match live on DamiTV with high-quality streaming and multiple source options. 
            Don't miss this exciting {league} encounter between {homeTeam} and {awayTeam}!
          </p>
        </div>
      </section>

      <section className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-6">
        <h3 className="text-xl font-bold mb-3 text-foreground">Watch Live on DamiTV</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">
          DamiTV provides free, high-quality live streaming of {league} matches. Enjoy multiple stream 
          sources, HD quality, and reliable service. No registration required - just click play and 
          enjoy the match. Join thousands of football fans who trust DamiTV for their live sports 
          streaming needs.
        </p>
      </section>
    </div>
  );
};

export default MatchAnalysis;
