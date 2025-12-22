import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, RefreshCw } from "lucide-react";
import PageLayout from "@/components/PageLayout";
import { leaguesService } from "@/services/leaguesService";
import { toast } from "sonner";

interface League {
  league_id: string;
  league_name: string;
  sport: string;
  country: string | null;
  logo_url: string | null;
  year_founded: number | null;
}

const Leagues = () => {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSport, setSelectedSport] = useState<string>("Soccer");

  const sports = ["Soccer", "Basketball", "Ice Hockey", "Baseball", "American Football"];

  const loadLeagues = async (sport: string) => {
    setLoading(true);
    try {
      // First try to get from database
      const dbLeagues = await leaguesService.getLeagues(sport);
      
      if (dbLeagues.length > 0) {
        setLeagues(dbLeagues);

        // If leagues exist but none have logos yet, fetch/enrich from API
        const hasLogos = dbLeagues.some((league) => league.logo_url);
        if (!hasLogos) {
          toast.info("Fetching league logos...");
          await leaguesService.fetchLeagues();
          const updatedLeagues = await leaguesService.getLeagues(sport);
          setLeagues(updatedLeagues);
        }
      } else {
        // If not in DB, fetch all sports from API
        toast.info("Fetching sports leagues...");
        await leaguesService.fetchLeagues();
        const newLeagues = await leaguesService.getLeagues(sport);
        setLeagues(newLeagues);
      }
    } catch (error) {
      console.error("Error loading leagues:", error);
      toast.error("Failed to load leagues");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeagues(selectedSport);
  }, [selectedSport]);

  const handleRefresh = () => {
    toast.info("Refreshing leagues...");
    leaguesService.fetchLeagues().then(() => {
      loadLeagues(selectedSport);
      toast.success("Leagues updated!");
    });
  };

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold">Leagues</h1>
          </div>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Sport Filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          {sports.map((sport) => (
            <Badge
              key={sport}
              variant={selectedSport === sport ? "default" : "outline"}
              className="cursor-pointer px-4 py-2 text-sm"
              onClick={() => setSelectedSport(sport)}
            >
              {sport}
            </Badge>
          ))}
        </div>

        {/* Leagues Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="w-24 h-24 rounded-full mx-auto mb-4" />
                  <Skeleton className="h-6 w-3/4 mx-auto mb-2" />
                  <Skeleton className="h-4 w-1/2 mx-auto" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : leagues.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No Leagues Found</h3>
            <p className="text-muted-foreground mb-4">
              Try selecting a different sport or refresh to fetch leagues
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {leagues.map((league) => (
              <Link
                key={league.league_id}
                to={`/league/${league.league_id}`}
                className="group"
              >
                <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-6 text-center">
                    <div className="relative w-24 h-24 mx-auto mb-4">
                      {league.logo_url ? (
                        <img
                          src={league.logo_url}
                          alt={league.league_name}
                          className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full rounded-full bg-muted flex items-center justify-center">
                          <Trophy className="w-12 h-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">
                      {league.league_name}
                    </h3>
                    {league.country && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {league.country}
                      </p>
                    )}
                    {league.year_founded && (
                      <Badge variant="secondary" className="text-xs">
                        Est. {league.year_founded}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default Leagues;
