import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, ArrowLeft, Calendar, TrendingUp } from "lucide-react";
import PageLayout from "@/components/PageLayout";
import { format } from "date-fns";

interface Standing {
  position: number;
  team: {
    name: string;
    crest: string;
  };
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

interface Match {
  id: number;
  homeTeam: { name: string; crest: string };
  awayTeam: { name: string; crest: string };
  score: { home: number | null; away: number | null };
  utcDate: string;
  status: string;
}

interface CompetitionData {
  competition: {
    id: number;
    name: string;
    emblem: string;
    area: { name: string; flag: string };
  };
  standings: Standing[];
  upcomingMatches: Match[];
  finishedMatches: Match[];
}

const FootballLeagueDetail = () => {
  const { competitionId } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ['football-league-detail', competitionId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('fetch-league-detail', {
        body: { competitionId: Number(competitionId) }
      });
      if (error) throw error;
      return data as CompetitionData;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!competitionId,
  });

  if (isLoading) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-4">
          <Skeleton className="h-10 w-40 mb-4" />
          <Skeleton className="h-48 w-full mb-4" />
        </div>
      </PageLayout>
    );
  }

  if (error || !data) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-4">
          <Button onClick={() => navigate('/leagues')} variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Leagues
          </Button>
          <div className="text-center py-8 bg-card rounded-lg border border-border">
            <Trophy className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Unable to Load League Data</h3>
            <p className="text-sm text-muted-foreground">
              {error instanceof Error ? error.message : 'Please try again later'}
            </p>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-4">
        <Button onClick={() => navigate('/leagues')} variant="ghost" className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Leagues
        </Button>

        {/* League Header */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="w-20 h-20 flex-shrink-0">
                <img
                  src={data.competition.emblem}
                  alt={data.competition.name}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder.svg';
                  }}
                />
              </div>
              
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-2xl font-bold mb-2">{data.competition.name}</h1>
                <div className="flex items-center gap-2 justify-center md:justify-start">
                  {data.competition.area.flag && (
                    <img
                      src={data.competition.area.flag}
                      alt={data.competition.area.name}
                      className="w-5 h-3 object-cover rounded-sm"
                    />
                  )}
                  <Badge variant="secondary" className="text-xs">{data.competition.area.name}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Tabs */}
        <Tabs defaultValue="standings" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="standings">
              <TrendingUp className="w-4 h-4 mr-2" />
              Standings
            </TabsTrigger>
            <TabsTrigger value="upcoming">
              <Calendar className="w-4 h-4 mr-2" />
              Upcoming
            </TabsTrigger>
            <TabsTrigger value="results">
              <Trophy className="w-4 h-4 mr-2" />
              Results
            </TabsTrigger>
          </TabsList>

          {/* Standings Table */}
          <TabsContent value="standings" className="mt-4">
            {data.standings.length > 0 ? (
              <Card className="-mx-4 sm:mx-0 rounded-none sm:rounded-lg border-x-0 sm:border-x">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[640px]">
                        <thead className="border-b border-border bg-muted/50">
                          <tr>
                            <th className="text-left p-2 font-semibold sticky left-0 bg-muted/50 z-10">#</th>
                            <th className="text-left p-2 font-semibold sticky left-8 bg-muted/50 z-10">Team</th>
                            <th className="text-center p-2 font-semibold">P</th>
                            <th className="text-center p-2 font-semibold">W</th>
                            <th className="text-center p-2 font-semibold">D</th>
                            <th className="text-center p-2 font-semibold">L</th>
                            <th className="text-center p-2 font-semibold">GF</th>
                            <th className="text-center p-2 font-semibold">GA</th>
                            <th className="text-center p-2 font-semibold">GD</th>
                            <th className="text-center p-2 font-semibold font-bold">Pts</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.standings.map((standing) => (
                            <tr key={standing.position} className="border-b border-border hover:bg-muted/50">
                              <td className="p-2 font-semibold sticky left-0 bg-background z-10">{standing.position}</td>
                              <td className="p-2 sticky left-8 bg-background z-10">
                                <div className="flex items-center gap-2">
                                  <img
                                    src={standing.team.crest}
                                    alt={standing.team.name}
                                    className="w-5 h-5 object-contain"
                                    onError={(e) => {
                                      e.currentTarget.src = '/placeholder.svg';
                                    }}
                                  />
                                  <span className="font-medium">{standing.team.name}</span>
                                </div>
                              </td>
                              <td className="text-center p-2">{standing.playedGames}</td>
                              <td className="text-center p-2">{standing.won}</td>
                              <td className="text-center p-2">{standing.draw}</td>
                              <td className="text-center p-2">{standing.lost}</td>
                              <td className="text-center p-2">{standing.goalsFor}</td>
                              <td className="text-center p-2">{standing.goalsAgainst}</td>
                              <td className="text-center p-2">{standing.goalDifference}</td>
                              <td className="text-center p-2 font-bold">{standing.points}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Trophy className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Standings Available</h3>
                  <p className="text-sm text-muted-foreground">Standings data is not available for this competition yet.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Upcoming Matches */}
          <TabsContent value="upcoming" className="mt-4">
            {data.upcomingMatches.length > 0 ? (
              <div className="grid gap-3">
                {data.upcomingMatches.map((match) => (
                  <Card key={match.id}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <div className="flex items-center gap-2 flex-1">
                          <img
                            src={match.homeTeam.crest}
                            alt={match.homeTeam.name}
                            className="w-7 h-7 object-contain"
                            onError={(e) => {
                              e.currentTarget.src = '/placeholder.svg';
                            }}
                          />
                          <span className="font-semibold">{match.homeTeam.name}</span>
                        </div>
                        <div className="text-center px-3">
                          <Badge variant="outline" className="text-xs">{format(new Date(match.utcDate), "MMM dd, HH:mm")}</Badge>
                        </div>
                        <div className="flex items-center gap-2 flex-1 justify-end">
                          <span className="font-semibold">{match.awayTeam.name}</span>
                          <img
                            src={match.awayTeam.crest}
                            alt={match.awayTeam.name}
                            className="w-7 h-7 object-contain"
                            onError={(e) => {
                              e.currentTarget.src = '/placeholder.svg';
                            }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Calendar className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Upcoming Matches</h3>
                  <p className="text-sm text-muted-foreground">There are no scheduled matches at this time.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Finished Matches */}
          <TabsContent value="results" className="mt-4">
            {data.finishedMatches.length > 0 ? (
              <div className="grid gap-3">
                {data.finishedMatches.map((match) => (
                  <Card key={match.id}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <div className="flex items-center gap-2 flex-1">
                          <img
                            src={match.homeTeam.crest}
                            alt={match.homeTeam.name}
                            className="w-7 h-7 object-contain"
                            onError={(e) => {
                              e.currentTarget.src = '/placeholder.svg';
                            }}
                          />
                          <span className="font-semibold">{match.homeTeam.name}</span>
                        </div>
                        <div className="text-center px-4">
                          <div className="text-xl font-bold">
                            {match.score.home} - {match.score.away}
                          </div>
                          <Badge variant="secondary" className="text-[10px] mt-1 py-0 h-4">FT</Badge>
                        </div>
                        <div className="flex items-center gap-2 flex-1 justify-end">
                          <span className="font-semibold">{match.awayTeam.name}</span>
                          <img
                            src={match.awayTeam.crest}
                            alt={match.awayTeam.name}
                            className="w-7 h-7 object-contain"
                            onError={(e) => {
                              e.currentTarget.src = '/placeholder.svg';
                            }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Trophy className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Recent Results</h3>
                  <p className="text-sm text-muted-foreground">There are no finished matches yet.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
};

export default FootballLeagueDetail;
