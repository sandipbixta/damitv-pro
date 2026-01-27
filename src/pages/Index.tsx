import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../hooks/use-toast';
import { Sport, Match } from '../types/sports';
import { fetchMatches } from '../api/sportsApi';
import { consolidateMatches, filterCleanMatches } from '../utils/matchUtils';
import SportsNav from '../components/SportsNav';
import MatchesList from '../components/MatchesList';
import FeaturedMatches from '../components/FeaturedMatches';
import AllSportsLiveMatches from '../components/AllSportsLiveMatches';
import { useSportsData } from '@/contexts/SportsDataContext';

// Lazy load more components to reduce initial bundle
const PopularMatches = React.lazy(() => import('../components/PopularMatches'));
import { Separator } from '../components/ui/separator';
import { Calendar, Tv } from 'lucide-react';
import { Button } from '../components/ui/button';
import PageLayout from '../components/PageLayout';
import { isPopularLeague } from '../utils/popularLeagues';
import { generateCompetitorTitle, generateCompetitorDescription } from '../utils/competitorSEO';
import CompetitorSEOContent from '../components/CompetitorSEOContent';
import { Helmet } from 'react-helmet-async';
import { manualMatches } from '../data/manualMatches';
import { HeroCarousel } from '../components/HeroCarousel';
import heroBackground from '../assets/hero-background.jpeg';
import HomepageContent from '../components/HomepageContent';
import CustomMatchCards from '../components/CustomMatchCards';
import LatestHighlights from '../components/LatestHighlights';
import PerplexityNews from '../components/PerplexityNews';
import UpcomingMatchPreviews from '../components/UpcomingMatchPreviews';
import HomeBanner from '../components/HomeBanner';

// Lazy load heavy components
const FeaturedChannels = React.lazy(() => import('../components/FeaturedChannels'));

const Index = () => {
  const { toast } = useToast();

  // Use shared sports data context - eliminates duplicate API calls!
  const { sports, liveMatches, loading: loadingSports } = useSportsData();

  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [allMatchesCache, setAllMatchesCache] = useState<{[sportId: string]: Match[]}>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingMatches, setLoadingMatches] = useState(false);

  // Filter visible manual matches
  const visibleManualMatches = useMemo(() => {
    return manualMatches.filter(match => match.visible);
  }, []);

  // Note: Live match notifications are now handled by the backend cron job (goal-alerts)

  // Memoize popular matches calculation - filter by selected sport
  const popularMatches = useMemo(() => {
    // If "All Sports" is selected, don't show popular matches section to avoid duplication
    if (selectedSport === 'all') {
      return [];
    }
    
    return matches.filter(match => 
      isPopularLeague(match.title) && 
      !match.title.toLowerCase().includes('sky sports news') && 
      !match.id.includes('sky-sports-news')
    );
  }, [matches, selectedSport]);

  // Memoize filtered matches
  const filteredMatches = useMemo(() => {
    if (!searchTerm.trim()) return matches;
    
    const lowercaseSearch = searchTerm.toLowerCase();
    return matches.filter(match => {
      return match.title.toLowerCase().includes(lowercaseSearch) || 
        match.teams?.home?.name?.toLowerCase().includes(lowercaseSearch) ||
        match.teams?.away?.name?.toLowerCase().includes(lowercaseSearch);
    });
  }, [matches, searchTerm]);

  // Set default sport immediately on component mount
  useEffect(() => {
    if (!selectedSport) {
      console.log('🏈 Auto-selecting "All Sports" as default');
      setSelectedSport('all');
    }
  }, [selectedSport]);

  // Optimized search handler
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Optimized sport selection with caching
  const handleSelectSport = async (sportId: string) => {
    console.log(`🎯 Selecting sport: ${sportId}, current: ${selectedSport}`);
    if (selectedSport === sportId) return;
    
    setSelectedSport(sportId);
    
    // For "All Sports", we don't need to load specific matches
    // as AllSportsLiveMatches component handles its own data fetching
    if (sportId === 'all') {
      setMatches([]);
      return;
    }
    
    setLoadingMatches(true);
    console.log('🔄 Loading matches for sport:', sportId);
    
    try {
      if (allMatchesCache[sportId]) {
        console.log('📁 Using cached matches:', allMatchesCache[sportId].length);
        setMatches(allMatchesCache[sportId]);
      } else {
        const rawMatchesData = await fetchMatches(sportId);
        console.log('📥 Raw matches data:', rawMatchesData.length);
        
        // Filter and consolidate matches to remove duplicates and combine stream sources
        const cleanMatches = filterCleanMatches(rawMatchesData);
        console.log('🧹 Clean matches:', cleanMatches.length);
        const consolidatedMatches = consolidateMatches(cleanMatches);
        console.log('🔗 Consolidated matches:', consolidatedMatches.length);
        
        setMatches(consolidatedMatches);
        
        setAllMatchesCache(prev => ({
          ...prev,
          [sportId]: consolidatedMatches
        }));
      }
    } catch (error) {
      console.error('Error loading matches:', error);
      toast({
        title: "Error",
        description: "Failed to load matches data.",
        variant: "destructive",
      });
    } finally {
      setLoadingMatches(false);
      console.log('✅ Finished loading matches');
    }
  };

  return (
    <PageLayout searchTerm={searchTerm} onSearch={handleSearch}>
      <Helmet>
        <title>DamiTV - Free Live Football Streaming | Watch Sports Online</title>
        <meta name="description" content="Watch free live football streams - Premier League, Champions League, La Liga. No registration needed. Stream sports online now!" />
        <meta name="keywords" content="free live football streaming, premier league stream, champions league stream, watch sports online free, live sports streaming, DamiTV" />
        <link rel="canonical" href="https://damitv.pro/" />
        
        {/* Organization Schema */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "DamiTV",
            "url": "https://damitv.pro",
            "logo": "https://damitv.pro/favicon.png",
            "description": "Leading sports streaming site alternative offering free HD streams for all major sports",
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.7",
              "reviewCount": "15847",
              "bestRating": "5",
              "worstRating": "1"
            },
            "sameAs": [
              "https://t.me/Sports_matches_bot"
            ]
          })}
        </script>
        
        {/* WebSite Schema */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "DamiTV - Best Sports Streaming Alternative",
            "url": "https://damitv.pro",
            "potentialAction": {
              "@type": "SearchAction",
              "target": "https://damitv.pro/live?q={search_term_string}",
              "query-input": "required name=search_term_string"
            }
          })}
        </script>
      </Helmet>
      
      <main className="py-4">
        {/* SEO H1 - Visible for better SEO */}
        <h1 className="text-2xl md:text-3xl font-bold text-center mb-4 text-white">
          Free Live Football Streaming - Watch Sports Online
        </h1>

        {/* Custom Match Cards - Above Hero Carousel */}
        <CustomMatchCards />

        {/* Hero Carousel */}
        <div className="mb-4">
          <HeroCarousel />
        </div>

        {/* Sports Category Nav - Below hero */}
        <div className="mb-6">
          <SportsNav 
            sports={sports}
            onSelectSport={handleSelectSport}
            selectedSport={selectedSport}
            isLoading={loadingSports}
          />
        </div>

        <div>
          <FeaturedMatches visibleManualMatches={visibleManualMatches} />
        </div>

        <React.Suspense fallback={<div className="h-32 bg-[#242836] rounded-lg animate-pulse" />}>
          <FeaturedChannels />
        </React.Suspense>

        {/* Non-intrusive banner - dismissible, no popups */}
        <HomeBanner />

        <Separator className="my-8 bg-[#343a4d]" />
            
            {/* Popular by Viewers Section - Only show on home page (no sport selected or All Sports) */}
            {liveMatches.length > 0 && (!selectedSport || selectedSport === 'all') && (
              <React.Suspense fallback={<div className="h-32 bg-[#242836] rounded-lg animate-pulse" />}>
                <div className="mb-8">
                  <PopularMatches 
                    popularMatches={liveMatches}
                    selectedSport={null}
                  />
                </div>
              </React.Suspense>
            )}
            
            <div className="mb-8">
              {selectedSport && (
                <>
                  {selectedSport === 'all' ? (
                    <div>
                      <div className="mb-6">
                        <h2 className="text-xl md:text-2xl font-extrabold text-foreground uppercase tracking-wider">
                          Live Matches
                        </h2>
                        <p className="text-sm text-muted-foreground mt-2">
                          Currently live across all sports
                        </p>
                      </div>
                      <AllSportsLiveMatches searchTerm={searchTerm} />
                    </div>
                  ) : (
                    <>
                      <div className="mb-6">
                        <h2 className="text-xl md:text-2xl font-extrabold text-foreground uppercase tracking-wider">
                          {sports.find(s => s.id === selectedSport)?.name || 'Matches'}
                        </h2>
                        <p className="text-sm text-muted-foreground mt-2">
                          {filteredMatches.length} matches available
                        </p>
                      </div>
                      <MatchesList
                        matches={filteredMatches}
                        sportId={selectedSport}
                        isLoading={loadingMatches}
                      />
                    </>
                  )}
                </>
              )}
            </div>
            
            
            {/* Hidden SEO content for competitor targeting */}
            <CompetitorSEOContent showFAQ={true} showCompetitorMentions={true} />
            
            {/* AI Match Previews - Internal Links for SEO */}
            <UpcomingMatchPreviews />
            
            {/* Latest Highlights Section */}
            <LatestHighlights />
            
            {/* Football News Section - Powered by Perplexity */}
            <PerplexityNews />
            
            {/* Call to Action Section */}
            <section className="mb-10 mt-10">
              <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-transparent rounded-xl p-8 md:p-10 border border-primary/30">
                <div className="max-w-2xl">
                  <h2 className="text-2xl md:text-3xl font-extrabold text-foreground mb-4 uppercase tracking-wide">Start Watching Now</h2>
                  <p className="text-muted-foreground mb-8 text-lg">
                    Join thousands of sports fans streaming live matches in HD quality.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <Link to="/live">
                      <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold uppercase px-6">
                        <Tv className="mr-2 h-4 w-4" /> Watch Live
                      </Button>
                    </Link>
                    <Link to="/channels">
                      <Button variant="outline" className="border-border hover:bg-muted font-bold uppercase px-6">
                        <Calendar className="mr-2 h-4 w-4" /> Browse Channels
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </section>

            {/* SEO Content Section - Compact and organized */}
            <section className="mb-8">
              <div className="prose prose-invert max-w-none">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-foreground mb-3">Popular Sports Available</h2>
                    <ul className="text-muted-foreground space-y-1 text-sm">
                      <li>• Live Football Streaming (Premier League, Champions League, La Liga)</li>
                      <li>• Basketball Games (NBA, EuroLeague)</li>
                      <li>• Tennis Tournaments (ATP, WTA, Grand Slams)</li>
                      <li>• Boxing and MMA Events</li>
                      <li>• Motor Sports (Formula 1, MotoGP)</li>
                    </ul>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-foreground mb-3">Why Choose DamiTV?</h2>
                    <ul className="text-muted-foreground space-y-1 text-sm">
                      <li>• No registration or subscription required</li>
                      <li>• HD quality streaming on all devices</li>
                      <li>• Multiple streaming sources for reliability</li>
                      <li>• Live chat and match discussions</li>
                      <li>• Regular updates and new channels</li>
                    </ul>
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-3">How DamiTV Works</h3>
                    <p className="text-muted-foreground mb-3 text-sm">
                      DamiTV provides free access to live sports streaming through our user-friendly platform. Simply browse our sports categories, select your preferred match or channel, and start watching instantly. No downloads, no registration, and no hidden fees.
                    </p>
                    <p className="text-muted-foreground text-sm">
                      Our streaming technology ensures reliable connections with multiple backup sources for each event. If one stream experiences issues, our system automatically switches to an alternative source to maintain uninterrupted viewing.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-3">Comprehensive Sports Coverage</h3>
                    <p className="text-muted-foreground mb-3 text-sm">
                      We cover major sports leagues worldwide including Premier League football, Champions League, NBA basketball, ATP tennis, Formula 1 racing, and boxing events. Our coverage spans European football leagues, American sports, and international tournaments.
                    </p>
                    <p className="text-muted-foreground text-sm">
                      DamiTV provides comprehensive sports entertainment with live matches, extensive TV channels, and complete schedules for all major sports. Looking for reliable streaming platforms? Check out our detailed guide on <Link to="/daddylivehd-alternatives" className="text-primary hover:text-primary/80 font-semibold underline">DaddyliveHD streaming site alternatives</Link>, our safety-focused review of <Link to="/batmanstream-alternatives" className="text-primary hover:text-primary/80 font-semibold underline">Batmanstream alternatives and safe links</Link>, and our comprehensive comparison of <Link to="/hesgoal-alternatives" className="text-primary hover:text-primary/80 font-semibold underline">Hesgoal live stream alternatives and legal links</Link> to discover the best secure options available today.
                    </p>
                  </div>
            </div>
          </div>
        </section>

        {/* Rich Homepage Content for AdSense Approval */}
        
        {/* Rich Homepage Content for AdSense Approval */}
        <HomepageContent />
      </main>
    </PageLayout>
  );
};

export default Index;
