
import React, { useState, useEffect } from 'react';
import { useToast } from '../hooks/use-toast';
import { Sport, Match } from '../types/sports';
import { fetchSports, fetchMatches } from '../api/sportsApi';
import SportsList from '../components/SportsList';
import { Separator } from '../components/ui/separator';
import { format, addDays, startOfDay } from 'date-fns';
import MatchesList from '../components/MatchesList';
import PageLayout from '../components/PageLayout';
import PageHeader from '../components/PageHeader';
import DatePagination from '../components/DatePagination';
import PopularGames from '../components/PopularGames';
import { isPopularLeague } from '../utils/popularLeagues';
import { Helmet } from 'react-helmet-async';
import TelegramBanner from '../components/TelegramBanner';
// import Advertisement from '../components/Advertisement';

const Schedule = () => {
  const { toast } = useToast();
  const [sports, setSports] = useState<Sport[]>([]);
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [popularMatches, setPopularMatches] = useState<Match[]>([]);
  const [currentDate, setCurrentDate] = useState(startOfDay(new Date()));
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([]);
  
  const [loadingSports, setLoadingSports] = useState(true);
  const [loadingMatches, setLoadingMatches] = useState(false);

  // Helper function to remove duplicates more strictly
  const removeDuplicatesFromMatches = (matches: Match[]): Match[] => {
    const seen = new Set<string>();
    const uniqueMatches: Match[] = [];
    
    matches.forEach(match => {
      // Create a unique key based on teams and date
      const homeTeam = match.teams?.home?.name || '';
      const awayTeam = match.teams?.away?.name || '';
      const matchDate = new Date(match.date).toISOString().split('T')[0];
      
      // Use teams and date for uniqueness, fallback to title if no teams
      const uniqueKey = homeTeam && awayTeam 
        ? `${homeTeam}-vs-${awayTeam}-${matchDate}`.toLowerCase()
        : `${match.title}-${matchDate}`.toLowerCase();
      
      if (!seen.has(uniqueKey)) {
        seen.add(uniqueKey);
        uniqueMatches.push(match);
      }
    });
    
    return uniqueMatches;
  };

  // Fetch sports on mount
  useEffect(() => {
    const loadSports = async () => {
      setLoadingSports(true);
      try {
        const sportsData = await fetchSports();
        setSports(sportsData);
        
        // Auto-select first sport
        if (sportsData.length > 0) {
          handleSelectSport(sportsData[0].id);
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load sports data.",
          variant: "destructive",
        });
      } finally {
        setLoadingSports(false);
      }
    };

    loadSports();
  }, [toast]);

  // Fetch matches when a sport is selected or date changes
  useEffect(() => {
    if (selectedSport) {
      handleSelectSport(selectedSport);
    }
  }, [currentDate, selectedSport]);

  // Handle sport selection
  const handleSelectSport = async (sportId: string) => {
    setSelectedSport(sportId);
    setLoadingMatches(true);
    
    try {
      const matchesData = await fetchMatches(sportId);
      
      // Remove duplicates from API data first
      const uniqueMatches = removeDuplicatesFromMatches(matchesData);
      
      // Filter matches by date
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      const filtered = uniqueMatches.filter(match => {
        const matchDate = new Date(match.date);
        return format(matchDate, 'yyyy-MM-dd') === dateStr;
      });
      
      setMatches(filtered);
      
      // Set initial filtered matches
      setFilteredMatches(filtered);
      
      // Identify popular matches from major leagues
      const popular = filtered.filter(match => isPopularLeague(match.title));
      setPopularMatches(popular);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load matches data.",
        variant: "destructive",
      });
    } finally {
      setLoadingMatches(false);
    }
  };

  // Handle date navigation
  const navigateDate = (days: number) => {
    setCurrentDate(prev => startOfDay(addDays(prev, days)));
  };

  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (!value.trim()) {
      setFilteredMatches(matches);
      return;
    }
    
    const lowercaseSearch = value.toLowerCase();
    const results = matches.filter(match => {
      return match.title.toLowerCase().includes(lowercaseSearch) || 
        match.teams?.home?.name.toLowerCase().includes(lowercaseSearch) ||
        match.teams?.away?.name.toLowerCase().includes(lowercaseSearch);
    });
    
    setFilteredMatches(results);
  };

  return (
    <>
      <Helmet>
        <title>Sports Schedule Today - Match Times & Fixtures | DamiTV</title>
        <link rel="canonical" href="https://damitv.pro/schedule" />
        <meta name="description" content="Today's sports schedule with football, basketball, tennis fixtures. Check match times for Premier League, Champions League and more." />
        <meta name="keywords" content="football schedule, live matches today, premier league schedule, champions league schedule, free sports schedule" />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <meta property="og:title" content="Football Schedule - Live Matches Today | DamiTV" />
        <meta property="og:description" content="Check today's football schedule with Premier League, Champions League and more live matches" />
        <meta property="og:url" content="https://damitv.pro/schedule" />
        <meta property="og:type" content="website" />
        
        <script type="application/ld+json">
        {`
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://damitv.pro/"
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Sports Schedule",
                "item": "https://damitv.pro/schedule"
              }
            ]
          }
        `}
        </script>
      </Helmet>
      
      <PageLayout searchTerm={searchTerm} onSearch={handleSearch}>
        <header className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">Sports Schedule</h1>
          <p className="text-muted-foreground">Find upcoming matches and events across all sports</p>
        </header>
        
        <PageHeader 
          title="" 
          subtitle="" 
          currentDate={currentDate}
          showCalendar={false}
        />
        
        {/* Telegram Banner */}
        <div className="mb-6">
          <TelegramBanner />
        </div>
        
        <div className="mb-6">
          <DatePagination 
            currentDate={currentDate} 
            setCurrentDate={setCurrentDate} 
            navigateDate={navigateDate} 
          />
        </div>
        
        <div className="mb-8">
          <SportsList 
            sports={sports}
            onSelectSport={handleSelectSport}
            selectedSport={selectedSport}
            isLoading={loadingSports}
          />
        </div>

        <PopularGames 
          popularMatches={popularMatches}
          selectedSport={selectedSport}
        />

        {/* Direct Link Advertisement removed */}
        {/* <div className="my-6 sm:my-8">
          <Advertisement type="direct-link" className="w-full" />
        </div> */}

        {popularMatches.length > 0 && (
          <Separator className="my-8 bg-black dark:bg-white" />
        )}
        
        <div className="mb-8">
          {(selectedSport || loadingMatches) && (
            <MatchesList
              matches={searchTerm ? filteredMatches : matches}
              sportId={selectedSport || ""}
              isLoading={loadingMatches}
            />
          )}
        </div>
        
        {/* SEO Content Section */}
        <section className="mt-12 mb-8">
          <div className="prose prose-invert max-w-none">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-3">Complete Sports Schedule</h2>
                <p className="text-muted-foreground text-sm mb-3">
                  Browse today's complete sports schedule on DamiTV. Check match times and fixtures for football, basketball, tennis and more. Plan your viewing with our <a href="/live" className="text-primary hover:underline">live sports streaming</a> schedule updated daily.
                </p>
                <p className="text-muted-foreground text-sm">
                  Access <a href="/" className="text-primary hover:underline">live streams</a> and <a href="/channels" className="text-primary hover:underline">TV channels</a> for all scheduled matches. As one of the <a href="https://damitv.pro/" className="text-primary hover:underline font-medium">top totalsportek similar sites for live sports</a>, DamiTV ensures you never miss a game.
                </p>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-3">Schedule Features</h2>
                <ul className="text-muted-foreground space-y-1 text-sm">
                  <li>• Daily updated match schedules</li>
                  <li>• All time zones supported</li>
                  <li>• Premier League, Champions League, La Liga</li>
                  <li>• NBA, tennis, MMA, boxing schedules</li>
                  <li>• Set reminders for your favorite matches</li>
                  <li>• Direct links to live streams</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </PageLayout>
    </>
  );
};

export default Schedule;

