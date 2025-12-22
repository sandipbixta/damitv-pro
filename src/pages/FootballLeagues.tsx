import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Trophy, Globe } from "lucide-react";
import PageLayout from "@/components/PageLayout";
import { useNavigate } from "react-router-dom";

interface Competition {
  id: number;
  name: string;
  code: string;
  type: string;
  emblem: string;
  area: {
    name: string;
    code: string;
    flag: string;
  };
  currentSeason: {
    startDate: string;
    endDate: string;
    currentMatchday: number;
  } | null;
}

const FootballLeagues = () => {
  const navigate = useNavigate();

  const { data: competitions, isLoading, error } = useQuery({
    queryKey: ['football-competitions'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('fetch-football-competitions');
      if (error) throw error;
      return data as Competition[];
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    retry: 1, // Only retry once
  });

  // Group competitions by type
  const leagueCompetitions = competitions?.filter(c => c.type === 'LEAGUE') || [];
  const cupCompetitions = competitions?.filter(c => c.type === 'CUP') || [];

  const handleCompetitionClick = (competitionId: number, competitionCode: string) => {
    // Always use the new football league detail page
    navigate(`/football-league/${competitionId}`);
  };

  if (isLoading) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold">Football Leagues</h1>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {[...Array(10)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-3">
                  <Skeleton className="w-14 h-14 rounded-full mx-auto mb-2" />
                  <Skeleton className="h-3 w-3/4 mx-auto mb-1" />
                  <Skeleton className="h-2 w-1/2 mx-auto" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold">Football Leagues</h1>
          </div>
          <div className="text-center py-8 bg-card rounded-lg border border-border">
            <Trophy className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Loading Error</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Unable to load competitions. Showing major leagues.
            </p>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Football Leagues & Competitions</h1>
        </div>

        {/* League Competitions */}
        {leagueCompetitions.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              Leagues
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {leagueCompetitions.map((competition) => (
                <Card
                  key={competition.id}
                  onClick={() => handleCompetitionClick(competition.id, competition.code)}
                  className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105 group"
                >
                  <CardContent className="p-3 text-center">
                    <div className="relative w-14 h-14 mx-auto mb-2">
                      <img
                        src={competition.emblem}
                        alt={competition.name}
                        className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder.svg';
                        }}
                      />
                    </div>
                    <h3 className="font-bold text-xs mb-1 group-hover:text-primary transition-colors line-clamp-2">
                      {competition.name}
                    </h3>
                    <div className="flex items-center justify-center gap-1 mb-1">
                      {competition.area.flag && (
                        <img
                          src={competition.area.flag}
                          alt={competition.area.name}
                          className="w-3 h-2 object-cover rounded-sm"
                        />
                      )}
                      <p className="text-[10px] text-muted-foreground">
                        {competition.area.name}
                      </p>
                    </div>
                    {competition.currentSeason && (
                      <Badge variant="secondary" className="text-[9px] py-0 px-1.5 h-4">
                        MD {competition.currentSeason.currentMatchday}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Cup Competitions */}
        {cupCompetitions.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              Cup Competitions
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {cupCompetitions.map((competition) => (
                <Card
                  key={competition.id}
                  onClick={() => handleCompetitionClick(competition.id, competition.code)}
                  className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105 group"
                >
                  <CardContent className="p-3 text-center">
                    <div className="relative w-14 h-14 mx-auto mb-2">
                      <img
                        src={competition.emblem}
                        alt={competition.name}
                        className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder.svg';
                        }}
                      />
                    </div>
                    <h3 className="font-bold text-xs mb-1 group-hover:text-primary transition-colors line-clamp-2">
                      {competition.name}
                    </h3>
                    <div className="flex items-center justify-center gap-1 mb-1">
                      {competition.area.flag && (
                        <img
                          src={competition.area.flag}
                          alt={competition.area.name}
                          className="w-3 h-2 object-cover rounded-sm"
                        />
                      )}
                      <p className="text-[10px] text-muted-foreground">
                        {competition.area.name}
                      </p>
                    </div>
                    {competition.currentSeason && (
                      <Badge variant="secondary" className="text-[9px] py-0 px-1.5 h-4">
                        MD {competition.currentSeason.currentMatchday}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default FootballLeagues;
