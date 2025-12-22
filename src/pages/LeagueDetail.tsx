import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, ArrowLeft, ExternalLink, RefreshCw } from "lucide-react";
import PageLayout from "@/components/PageLayout";
import { leaguesService } from "@/services/leaguesService";
import { toast } from "sonner";

interface League {
  league_id: string;
  league_name: string;
  sport: string;
  country: string | null;
  logo_url: string | null;
  description: string | null;
  website: string | null;
  year_founded: number | null;
}

interface Team {
  team_id: string;
  team_name: string;
  logo_url: string | null;
  stadium: string | null;
  country: string | null;
  year_founded: number | null;
}

const LeagueDetail = () => {
  const { leagueId } = useParams<{ leagueId: string }>();
  const [league, setLeague] = useState<League | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLeagueData = async () => {
    if (!leagueId) return;
    
    setLoading(true);
    try {
      const leagueData = await leaguesService.getLeagueById(leagueId);
      setLeague(leagueData);

      if (leagueData) {
        console.log(`Loading data for league: ${leagueData.league_id}`);
        
        // Load teams from DB first
        let teamsData = await leaguesService.getLeagueTeams(leagueData.league_id);
        
        const needsTeamFetch =
          teamsData.length === 0 || teamsData.every((team) => !team.logo_url);

        if (needsTeamFetch) {
          toast.info("Fetching teams and logos from API...");
          const result = await leaguesService.fetchLeagueTeams(leagueData.league_id);
          
          if (result && result.success) {
            teamsData = await leaguesService.getLeagueTeams(leagueData.league_id);
            toast.success(`Loaded ${teamsData.length} teams`);
          } else {
            toast.warning(result?.message || "No teams found for this league");
          }
        }
        
        setTeams(teamsData);
      }
    } catch (error) {
      console.error("Error loading league data:", error);
      toast.error("Failed to load league data: " + (error.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeagueData();
  }, [leagueId]);

  const handleRefresh = () => {
    if (league) {
      toast.info("Refreshing teams...");
      leaguesService.fetchLeagueTeams(league.league_id).then(() => {
        loadLeagueData();
        toast.success("Teams updated!");
      });
    }
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-12 w-48 mb-8" />
          <Skeleton className="h-64 w-full mb-8" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!league) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-8">
          <Link to="/leagues">
            <Button variant="ghost" className="mb-8">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Leagues
            </Button>
          </Link>
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold">League Not Found</h3>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8">
        <Link to="/leagues">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Leagues
          </Button>
        </Link>

        {/* League Header */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-32 h-32 flex-shrink-0">
                {league.logo_url ? (
                  <img
                    src={league.logo_url}
                    alt={league.league_name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-muted flex items-center justify-center">
                    <Trophy className="w-16 h-16 text-muted-foreground" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-4xl font-bold mb-2">{league.league_name}</h1>
                <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-4">
                  {league.country && (
                    <Badge variant="secondary">{league.country}</Badge>
                  )}
                  {league.year_founded && (
                    <Badge variant="outline">Est. {league.year_founded}</Badge>
                  )}
                  <Badge>{league.sport}</Badge>
                </div>
                {league.description && (
                  <p className="text-muted-foreground mb-4 max-w-2xl">
                    {league.description.substring(0, 300)}...
                  </p>
                )}
                {league.website && (
                  <a
                    href={league.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-primary hover:underline"
                  >
                    Visit Website
                    <ExternalLink className="w-4 h-4 ml-1" />
                  </a>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Tabs */}
        <Tabs defaultValue="teams" className="w-full">
          <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="teams">
              <Trophy className="w-4 h-4 mr-2" />
              Teams
            </TabsTrigger>
          </TabsList>

          {/* Teams */}
          <TabsContent value="teams" className="mt-6">
            <div className="flex justify-end mb-4">
              <Button onClick={handleRefresh} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Teams
              </Button>
            </div>

            {teams.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No Teams Available</h3>
              <p className="text-muted-foreground mb-4">
                {league.description || "This league doesn't have any upcoming events or teams data available at the moment."}
              </p>
              <p className="text-sm text-muted-foreground">
                The Odds API provides data for leagues with upcoming matches. Try checking back during the season.
              </p>
            </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team) => (
              <Card key={team.team_id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 flex-shrink-0">
                      {team.logo_url ? (
                        <img
                          src={team.logo_url}
                          alt={team.team_name}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="w-full h-full rounded-full bg-muted flex items-center justify-center">
                          <Trophy className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg mb-2 truncate">
                        {team.team_name}
                      </h3>
                      {team.stadium && (
                        <p className="text-sm text-muted-foreground mb-1 truncate">
                          {team.stadium}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1">
                        {team.country && (
                          <Badge variant="secondary" className="text-xs">
                            {team.country}
                          </Badge>
                        )}
                        {team.year_founded && (
                          <Badge variant="outline" className="text-xs">
                            {team.year_founded}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
};

export default LeagueDetail;
