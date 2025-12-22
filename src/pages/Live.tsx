
import React, { useEffect, useState } from 'react';
import { useToast } from '../hooks/use-toast';
import { Match } from '../types/sports';
import { Separator } from '../components/ui/separator';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Link, useSearchParams } from 'react-router-dom';
import { Radio, Clock } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import { generateCompetitorTitle, generateCompetitorDescription } from '../utils/competitorSEO';
import CompetitorSEOContent from '../components/CompetitorSEOContent';
import { Helmet } from 'react-helmet-async';
import MatchDetails from '../components/MatchDetails';

import { useLiveMatches } from '../hooks/useLiveMatches';
import { useStreamPlayer } from '../hooks/useStreamPlayer';
import { useLiveMatchNotifier } from '../hooks/useLiveMatchNotifier';
import LiveHeader from '../components/live/LiveHeader';
import FeaturedPlayer from '../components/live/FeaturedPlayer';
import SportFilterPills from '../components/live/SportFilterPills';
import MatchesTabContent from '../components/live/MatchesTabContent';
import MatchSection from '../components/MatchSection';
import MatchCard from '../components/MatchCard';

import PopularMatches from '../components/PopularMatches';

const Live = () => {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<string>("all");
  const [activeSportFilter, setActiveSportFilter] = useState<string>("all");
  const [userSelectedMatch, setUserSelectedMatch] = useState<boolean>(false);
  
  // Custom hooks for data management
  const { 
    allMatches, 
    liveMatches, 
    upcomingMatches, 
    sports, 
    loading, 
    handleRetryLoading 
  } = useLiveMatches();
  
  const {
    featuredMatch,
    currentStream,
    streamLoading,
    activeSource,
    handleMatchSelect,
    handleSourceChange,
    handleStreamRetry,
    setFeaturedMatch,
    fetchStreamData
  } = useStreamPlayer();

  // Auto-notify when matches go live (posts to Telegram & X via Make.com)
  useLiveMatchNotifier(allMatches);

  // Handle user match selection
  const handleUserMatchSelect = (match: Match) => {
    setUserSelectedMatch(true);
    handleMatchSelect(match);
    // Scroll to player
    setTimeout(() => {
      document.getElementById('stream-player')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  // Auto-select match from URL params (when coming from home page)
  useEffect(() => {
    const matchIdFromUrl = searchParams.get('matchId');
    const sportIdFromUrl = searchParams.get('sportId');
    
    if (matchIdFromUrl && allMatches.length > 0 && !userSelectedMatch) {
      const matchToSelect = allMatches.find(m => m.id === matchIdFromUrl);
      if (matchToSelect) {
        handleUserMatchSelect(matchToSelect);
        // Clear URL params after selection
        setSearchParams({});
      }
    }
  }, [searchParams, allMatches, userSelectedMatch]);

  // Update filtered matches when search query or filters change
  useEffect(() => {
    let matchesToFilter = allMatches;
    
    // First filter by tab selection
    if (activeTab === "live") {
      matchesToFilter = liveMatches;
    } else if (activeTab === "upcoming") {
      matchesToFilter = upcomingMatches;
    }
    
    // Then filter by sport if not "all"
    if (activeSportFilter !== "all") {
      matchesToFilter = matchesToFilter.filter(match => {
        const matchSport = match.sportId || match.category || '';
        return matchSport === activeSportFilter;
      });
      console.log(`🎯 Filtered to ${matchesToFilter.length} matches for sport: ${activeSportFilter}`);
    }
    
    // Then filter by search query
    if (searchQuery.trim() === '') {
      setFilteredMatches(matchesToFilter);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = matchesToFilter.filter(match => 
        match.title.toLowerCase().includes(query) || 
        match.teams?.home?.name?.toLowerCase().includes(query) || 
        match.teams?.away?.name?.toLowerCase().includes(query)
      );
      setFilteredMatches(filtered);
    }
    
    console.log(`📊 Total filtered matches: ${matchesToFilter.length} (tab: ${activeTab}, sport: ${activeSportFilter})`);
  }, [searchQuery, activeTab, activeSportFilter, allMatches, liveMatches, upcomingMatches]);

  // Handle search form submit
  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchQuery.trim() !== '') {
      toast({
        title: "Searching",
        description: `Finding matches for "${searchQuery}"`,
      });
    }
  };

  return (
    <PageLayout>
      <Helmet>
        <title>Live Sports Streaming Free - Watch Football Online | DamiTV</title>
        <meta name="description" content="Watch live football, basketball, tennis and more sports free. HD streaming with multiple sources. No registration needed." />
        <meta name="keywords" content="live football streaming, live soccer matches, watch sports online, free live sports, stream football live, totalsportek alternative live, streameast live free, crackstreams live matches, daddylivehd live sports" />
        <link rel="canonical" href="https://damitv.pro/live" />
        <script type="application/ld+json">
        {`
          {
            "@context": "https://schema.org",
            "@type": "BroadcastEvent",
            "name": "Live Sports Streaming - Free Alternative to TotalSportek",
            "description": "Watch live sports free - best alternative to TotalSportek, StreamEast, Crackstreams",
            "url": "https://damitv.pro/live",
            "isLiveBroadcast": true,
            "startDate": "${new Date().toISOString()}",
            "broadcastOfEvent": {
              "@type": "SportsEvent",
              "name": "Live Football Matches"
            },
            "videoFormat": "HD"
          }
        `}
        </script>
        
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
                "name": "Live Sports Streaming",
                "item": "https://damitv.pro/live"
              }
            ]
          }
        `}
        </script>
      </Helmet>
      
      {/* Page Header with H1 */}
      <header className="mb-6">
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">Live Sports Streaming</h1>
        <p className="text-muted-foreground">Watch live football, basketball, tennis and more. HD streams updated in real-time. Discover the <a href="https://damitv.pro/" className="text-primary hover:underline font-medium">best sports streaming site alternatives</a> for reliable free streaming.</p>
      </header>
      
      <div className="mb-8">
        <LiveHeader
          liveMatchesCount={liveMatches.length}
          searchQuery={searchQuery}
          onSearchChange={(e) => setSearchQuery(e.target.value)}
          onSearchSubmit={handleSearchSubmit}
          onRefresh={handleRetryLoading}
        />
        
        {userSelectedMatch && featuredMatch && (
          <div id="stream-player">
            <FeaturedPlayer
              loading={loading}
              featuredMatch={featuredMatch}
              currentStream={currentStream}
              streamLoading={streamLoading}
              activeSource={activeSource}
              onSourceChange={handleSourceChange}
              onStreamRetry={handleStreamRetry}
              onRetryLoading={handleRetryLoading}
            />
          </div>
        )}
      </div>
      
      <Separator className="my-8 bg-[#343a4d]" />
      
      {/* Popular Matches Section - Sorted by Viewer Count */}
      {!userSelectedMatch && liveMatches.length > 0 && (
        <div className="mb-8">
          <PopularMatches
            popularMatches={liveMatches}
            selectedSport={activeSportFilter === "all" ? null : activeSportFilter}
          />
        </div>
      )}
      
      <SportFilterPills
        allMatches={allMatches}
        sports={sports}
        activeSportFilter={activeSportFilter}
        onSportFilterChange={setActiveSportFilter}
      />
      
      {/* Tabs Navigation for All/Live/Upcoming */}
      <Tabs 
        defaultValue="all" 
        value={activeTab} 
        onValueChange={setActiveTab} 
        className="mb-8"
      >
        <div className="flex justify-between items-center mb-4">
          <TabsList className="bg-[#242836] border border-[#343a4d]">
            <TabsTrigger 
              value="all" 
              className="data-[state=active]:bg-muted data-[state=active]:text-foreground"
            >
              All Matches
            </TabsTrigger>
            <TabsTrigger 
              value="live" 
              className="data-[state=active]:bg-muted data-[state=active]:text-foreground"
            >
              <span className="inline-block h-2 w-2 bg-[#ff5a36] rounded-full animate-pulse mr-1"></span>
              Live Now ({liveMatches.length})
            </TabsTrigger>
            <TabsTrigger 
              value="upcoming" 
              className="data-[state=active]:bg-muted data-[state=active]:text-foreground"
            >
              <Clock size={14} className="mr-1" />
              Upcoming ({upcomingMatches.length})
            </TabsTrigger>
          </TabsList>
          
          {searchQuery && (
            <div className="text-sm text-gray-300" aria-live="polite">
              {filteredMatches.length === 0 ? 'No matches found' : `Found ${filteredMatches.length} matches`}
            </div>
          )}
        </div>
        
        <TabsContent value="all" className="mt-0">
          
          {/* Live Matches Categorized by Sport */}
          {(() => {
            const liveMatchesFiltered = liveMatches.filter(match => filteredMatches.some(fm => fm.id === match.id));
            
            if (liveMatchesFiltered.length > 0) {
              // Group live matches by sport
              const liveMatchesBySport = sports.reduce((acc, sport) => {
                const sportMatches = liveMatchesFiltered.filter(match => match.sportId === sport.id);
                if (sportMatches.length > 0) {
                  acc[sport.id] = {
                    sport: sport,
                    matches: sportMatches
                  };
                }
                return acc;
              }, {} as Record<string, { sport: any; matches: Match[] }>);
              
              return (
                <div className="space-y-8 mb-8">
                  {Object.values(liveMatchesBySport).map(({ sport, matches }) => (
                    <MatchSection
                      key={`live-${sport.id}`}
                      matches={matches}
                      sportId={sport.id}
                      title={`${sport.name} - Live`}
                      isLive={true}
                      onMatchSelect={handleUserMatchSelect}
                      preventNavigation={true}
                    />
                  ))}
                </div>
              );
            }
            return null;
          })()}
          
          {/* Upcoming Matches Categorized by Sport */}
          {(() => {
            const upcomingMatchesFiltered = upcomingMatches.filter(match => filteredMatches.some(fm => fm.id === match.id)).slice(0, 24);
            
            if (upcomingMatchesFiltered.length > 0) {
              // Group upcoming matches by sport
              const upcomingMatchesBySport = sports.reduce((acc, sport) => {
                const sportMatches = upcomingMatchesFiltered.filter(match => match.sportId === sport.id);
                if (sportMatches.length > 0) {
                  acc[sport.id] = {
                    sport: sport,
                    matches: sportMatches
                  };
                }
                return acc;
              }, {} as Record<string, { sport: any; matches: Match[] }>);
              
              return (
                <div className="space-y-8">
                  {Object.values(upcomingMatchesBySport).map(({ sport, matches }) => (
                    <MatchSection
                      key={`upcoming-${sport.id}`}
                      matches={matches}
                      sportId={sport.id}
                      title={`${sport.name} - Upcoming`}
                      isLive={false}
                      onMatchSelect={handleUserMatchSelect}
                      preventNavigation={true}
                    />
                  ))}
                </div>
              );
            }
            return null;
          })()}
          
          {/* No matches message */}
          {filteredMatches.length === 0 && (
            <MatchesTabContent
              tabValue="all"
              filteredMatches={filteredMatches}
              sports={sports}
              activeSportFilter={activeSportFilter}
              searchQuery={searchQuery}
              onMatchSelect={handleUserMatchSelect}
              onSearchClear={() => setSearchQuery('')}
              onRetryLoading={handleRetryLoading}
            />
          )}
        </TabsContent>
        
        <MatchesTabContent
          tabValue="live"
          filteredMatches={filteredMatches}
          sports={sports}
          activeSportFilter={activeSportFilter}
          searchQuery={searchQuery}
          onMatchSelect={handleUserMatchSelect}
          onSearchClear={() => setSearchQuery('')}
          onRetryLoading={handleRetryLoading}
        />
        
        <MatchesTabContent
          tabValue="upcoming"
          filteredMatches={filteredMatches}
          sports={sports}
          activeSportFilter={activeSportFilter}
          searchQuery={searchQuery}
          onMatchSelect={handleUserMatchSelect}
          onSearchClear={() => setSearchQuery('')}
          onRetryLoading={handleRetryLoading}
        />
      </Tabs>
      
      <Link to="/channels" className="block w-full">
        <div className="bg-[#242836] hover:bg-[#2a2f3f] border border-[#343a4d] rounded-xl p-6 text-center transition-all">
          <Radio className="h-10 w-10 text-[#9b87f5] mx-auto mb-4" aria-hidden="true" />
          <h3 className="text-xl font-semibold text-foreground">Live TV Channels</h3>
          <p className="text-gray-300 mt-2">Access 70+ international sports channels from around the world</p>
          <Button className="mt-4 bg-[#9b87f5] hover:bg-[#8a75e8]">Browse Channels</Button>
        </div>
      </Link>
      
      {/* Match Details - Show at bottom if a match is selected */}
      {featuredMatch && (
        <div className="mt-8">
          <MatchDetails 
            match={featuredMatch}
            isLive={featuredMatch.date ? Date.now() - featuredMatch.date > -30 * 60 * 1000 && Date.now() - featuredMatch.date < 3 * 60 * 60 * 1000 : false}
            showCompact={false}
          />
        </div>
      )}
      
      {/* SEO Content Section */}
      <section className="mt-12 mb-8">
        <div className="prose prose-invert max-w-none">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-3">Free Live Sports Streaming</h2>
              <p className="text-muted-foreground text-sm mb-3">
                DamiTV offers free live sports streaming with HD quality across all devices. Watch <a href="/" className="text-primary hover:underline">football matches</a>, basketball games, tennis tournaments, and more without registration. Our platform provides reliable streaming with multiple backup sources for uninterrupted viewing.
              </p>
              <p className="text-muted-foreground text-sm">
                Access <a href="/channels" className="text-primary hover:underline">live TV channels</a> and <a href="/schedule" className="text-primary hover:underline">match schedules</a> all in one place. Join millions of sports fans who trust DamiTV for their live streaming needs.
              </p>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-3">Popular Live Sports Today</h2>
              <ul className="text-muted-foreground space-y-1 text-sm">
                <li>• Premier League and Champions League football</li>
                <li>• NBA and EuroLeague basketball</li>
                <li>• ATP and WTA tennis tournaments</li>
                <li>• UFC and boxing events</li>
                <li>• Formula 1 and MotoGP racing</li>
                <li>• Cricket, rugby, and more sports</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
      
      {/* Hidden SEO content for competitor targeting */}
      <CompetitorSEOContent showFAQ={true} showCompetitorMentions={true} />
    </PageLayout>
  );
};

export default Live;
