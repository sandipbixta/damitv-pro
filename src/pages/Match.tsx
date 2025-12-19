import React, { useEffect, useState, lazy, Suspense } from 'react';
import { useParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Match as MatchType } from '@/types/sports';
import { fetchMatch, fetchMatches } from '@/api/sportsApi';
import { useStreamPlayer } from '@/hooks/useStreamPlayer';
import { useViewerTracking } from '@/hooks/useViewerTracking';
import { Helmet } from 'react-helmet-async';
import { isTrendingMatch } from '@/utils/popularLeagues';
import { teamLogoService } from '@/services/teamLogoService';

// Direct imports for critical components - faster initial render
import TelegramBanner from '@/components/TelegramBanner';
import SEOMetaTags from '@/components/SEOMetaTags';
import SocialShare from '@/components/SocialShare';
import MatchHeader from '@/components/match/MatchHeader';
import StreamTab from '@/components/match/StreamTab';
import StreamViewerDisplay from '@/components/StreamViewerDisplay';
import { ViewerStats } from '@/components/match/ViewerStats';
import LoadingState from '@/components/match/LoadingState';
import NotFoundState from '@/components/match/NotFoundState';

// Lazy load non-critical components
const MatchCard = lazy(() => import('@/components/MatchCard'));
const MatchAnalysis = lazy(() => import('@/components/match/MatchAnalysis'));

// Loading placeholder
const LoadingPlaceholder = ({ height = "h-32" }: { height?: string }) => (
  <div className={`${height} bg-card rounded-lg animate-pulse`} />
);

const MATCH_CACHE_KEY = 'damitv_match_cache';
const MATCH_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Get cached match from localStorage
const getCachedMatch = (matchId: string) => {
  try {
    const cached = localStorage.getItem(`${MATCH_CACHE_KEY}_${matchId}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < MATCH_CACHE_DURATION) {
        return parsed.match;
      }
    }
  } catch (e) {}
  return null;
};

// Set cached match to localStorage
const setCachedMatch = (matchId: string, match: MatchType) => {
  try {
    localStorage.setItem(`${MATCH_CACHE_KEY}_${matchId}`, JSON.stringify({
      match,
      timestamp: Date.now()
    }));
  } catch (e) {}
};

const Match = () => {
  const { toast } = useToast();
  const { sportId, matchId } = useParams();
  
  // Initialize with cached match for instant display
  const [match, setMatch] = useState<MatchType | null>(() => {
    if (matchId) {
      const cached = getCachedMatch(matchId);
      if (cached) {
        console.log('✅ Using cached match data for instant display');
        return cached;
      }
    }
    return null;
  });
  
  // Only show loading if no cached match
  const [isLoading, setIsLoading] = useState(() => {
    if (matchId) {
      return !getCachedMatch(matchId);
    }
    return true;
  });
  
  const [allMatches, setAllMatches] = useState<MatchType[]>([]);
  const [recommendedMatches, setRecommendedMatches] = useState<MatchType[]>([]);
  const [trendingMatches, setTrendingMatches] = useState<MatchType[]>([]);

  // Track viewer count for this match
  useViewerTracking(matchId);

  // Use enhanced stream player hook for comprehensive stream management
  const {
    currentStream: stream,
    streamLoading: loadingStream,
    activeSource,
    allStreams,
    streamDiscovery,
    handleSourceChange,
    handleMatchSelect,
    handleRefreshStreams
  } = useStreamPlayer();

  // Store handleMatchSelect in a ref to avoid dependency issues
  const handleMatchSelectRef = React.useRef(handleMatchSelect);
  handleMatchSelectRef.current = handleMatchSelect;

  // Load match data and streams - only runs when sportId or matchId changes
  useEffect(() => {
    let isMounted = true;
    
    const loadMatchData = async () => {
      if (!sportId || !matchId) return;

      try {
        // If we have cached match, start loading streams immediately
        const cachedMatch = getCachedMatch(matchId);
        if (cachedMatch && isMounted) {
          // Start stream loading with cached match immediately
          handleMatchSelectRef.current(cachedMatch);
        }
        
        // Only show loading if no cached data
        if (!cachedMatch && isMounted) {
          setIsLoading(true);
        }
        
        console.log(`Loading match: ${sportId}/${matchId}`);
        
        // Fetch the specific match
        const matchData = await fetchMatch(sportId, matchId);
        if (!isMounted) return;
        
        const enhancedMatch = teamLogoService.enhanceMatchWithLogos(matchData);
        setMatch(enhancedMatch);
        
        // Cache the match for instant loading next time
        setCachedMatch(matchId, enhancedMatch);

        // Only load streams if we didn't already start with cached data
        if (!cachedMatch) {
          await handleMatchSelectRef.current(enhancedMatch);
        }

        if (!isMounted) return;

        // Scroll to top first when page loads
        window.scrollTo({ top: 0, behavior: 'instant' });

        // Load all matches for recommended sections
        const allMatches = await fetchMatches(sportId);
        if (!isMounted) return;
        
        const otherMatches = allMatches.filter(m => m.id !== matchId);
        setAllMatches(allMatches);
        
        // Recommended matches (similar category)
        const recommended = otherMatches
          .filter(m => m.category === matchData.category && m.id !== matchId)
          .slice(0, 6);
        
        // Trending matches (using trending logic)
        const trending = otherMatches
          .filter(m => isTrendingMatch(m.title).isTrending)
          .slice(0, 6);

        setRecommendedMatches(recommended);
        setTrendingMatches(trending);
        
      } catch (error) {
        console.error('Error loading match:', error);
        if (isMounted) {
          setMatch(null);
          toast({
            title: "Error loading match",
            description: "Failed to load match details. Please try again.",
            variant: "destructive",
          });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadMatchData();
    
    return () => {
      isMounted = false;
    };
  }, [sportId, matchId, toast]); // Removed handleMatchSelect from dependencies

  if (isLoading) {
    return <LoadingState />;
  }

  if (!match) {
    return <NotFoundState />;
  }
  
  // Format match title for SEO
  const homeTeam = match.teams?.home?.name || '';
  const awayTeam = match.teams?.away?.name || '';
  const matchTitle = homeTeam && awayTeam ? `${homeTeam} vs ${awayTeam}` : match.title;
  const matchDescription = `Watch ${matchTitle} live stream online for free on DamiTV. HD quality streaming with multiple sources available.`;

  // Generate match poster URL for social sharing
  const getMatchPosterUrl = () => {
    if (match.poster && match.poster.trim() !== '') {
      const baseUrl = match.poster.startsWith('http') 
        ? match.poster 
        : `https://api.cdn-live.tv${match.poster}`;
      return baseUrl + `?v=${Date.now()}`;
    }
    return 'https://i.imgur.com/m4nV9S8.png';
  };

  const matchPosterUrl = getMatchPosterUrl();

  return (
    <div className="min-h-screen bg-sports-dark text-sports-light">
      <SEOMetaTags
        title={`${matchTitle} - Live Stream | DamiTV`}
        description={`${matchDescription} - Watch ${matchTitle} on damitv.pro with HD quality streaming.`}
        keywords={`${homeTeam} live stream, ${awayTeam} online, ${matchTitle}, ${matchTitle} on damitv.pro, live football streaming`}
        canonicalUrl={`https://damitv.pro/match/${sportId}/${matchId}`}
        ogImage={matchPosterUrl}
        matchInfo={{
          homeTeam,
          awayTeam,
          league: match.category || 'Football',
          date: match.date ? new Date(match.date) : new Date(),
        }}
        breadcrumbs={[
          { name: 'Home', url: 'https://damitv.pro/' },
          { name: 'Live Matches', url: 'https://damitv.pro/live' },
          { name: `${matchTitle} on damitv.pro`, url: `https://damitv.pro/match/${sportId}/${matchId}` }
        ]}
      />

      <Helmet>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SportsEvent",
            "name": matchTitle,
            "description": matchDescription,
            "startDate": match.date ? new Date(match.date).toISOString() : new Date().toISOString(),
            "eventStatus": "https://schema.org/EventScheduled",
            "eventAttendanceMode": "https://schema.org/OnlineEventAttendanceMode",
            "location": {
              "@type": "VirtualLocation",
              "url": `https://damitv.pro/match/${sportId}/${matchId}`
            },
            "image": matchPosterUrl,
            "organizer": {
              "@type": "Organization",
              "name": "DamiTV",
              "url": "https://damitv.pro"
            },
            "competitor": [
              {
                "@type": "SportsTeam",
                "name": homeTeam
              },
              {
                "@type": "SportsTeam",
                "name": awayTeam
              }
            ]
          })}
        </script>
      </Helmet>
      
      <MatchHeader 
        match={match} 
        streamAvailable={!!stream && stream.id !== "error"}
        socialShare={
          <SocialShare 
            title={matchTitle}
            description={matchDescription}
            image={matchPosterUrl}
            url={`https://damitv.pro/match/${sportId}/${matchId}`}
          />
        }
      />
      
      <div className="container mx-auto px-4 py-4 sm:py-8">
        <div className="mb-4">
          <TelegramBanner />
        </div>
        
        <div className="w-full flex justify-center mb-4">
          <div className="text-center max-w-4xl px-4">
            <div className="flex items-center justify-center gap-3 mb-2">
              {match.teams?.home?.badge && (
                <img 
                  src={match.teams.home.badge} 
                  alt={match.teams.home.name || 'Home'} 
                  className="w-8 h-8 md:w-10 md:h-10 object-contain"
                  onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                />
              )}
              <h1 className="text-2xl md:text-3xl font-bold text-white">{match.title}</h1>
              {match.teams?.away?.badge && (
                <img 
                  src={match.teams.away.badge} 
                  alt={match.teams.away.name || 'Away'} 
                  className="w-8 h-8 md:w-10 md:h-10 object-contain"
                  onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                />
              )}
            </div>
            <p className="text-sm md:text-base text-gray-400">{matchTitle} on damitv.pro</p>
          </div>
        </div>
        
        {/* Video Player and Ad Sidebar Layout */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Video Player Section */}
          <div className="flex-1 min-w-0" id="stream-container" data-stream-container>
            <StreamTab
              match={match}
              stream={stream}
              loadingStream={loadingStream}
              activeSource={activeSource}
              handleSourceChange={handleSourceChange}
              popularMatches={[]}
              sportId={sportId || ''}
              allStreams={allStreams}
              streamDiscovery={streamDiscovery}
              onRefreshStreams={handleRefreshStreams}
            />

            {/* Live Viewer Count Display */}
            <div className="mt-4">
              <StreamViewerDisplay matchId={matchId || ''} isLive={true} />
            </div>

            {/* Viewer Statistics */}
            <div className="mt-4">
              <ViewerStats match={match} />
            </div>
          </div>
        </div>

        {/* Match Analysis and Preview Content */}
        <div className="mt-8">
          <Suspense fallback={<LoadingPlaceholder height="h-48" />}>
            <MatchAnalysis match={match} />
          </Suspense>
        </div>

        {/* Recommended Matches */}
        {recommendedMatches.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Similar Matches You Might Like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Suspense fallback={<LoadingPlaceholder />}>
                {recommendedMatches.map((relatedMatch) => (
                  <MatchCard key={relatedMatch.id} match={relatedMatch} />
                ))}
              </Suspense>
            </div>
          </div>
        )}
      </div>
      
      <footer className="bg-sports-darker text-gray-400 py-6 mt-10">
        <div className="container mx-auto px-4 text-center">
          <p>© 2025 DamiTV - All rights reserved</p>
        </div>
      </footer>
    </div>
  );
};

export default Match;