import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Match as MatchType } from '@/types/sports';
import { fetchMatch, getBohoImageUrl } from '@/api/sportsApi';
import { useStreamPlayer } from '@/hooks/useStreamPlayer';
import { useViewerTracking } from '@/hooks/useViewerTracking';
import { Helmet } from 'react-helmet-async';
import { isTrendingMatch } from '@/utils/popularLeagues';
import { generateMatchSlug } from '@/utils/matchSlug';
import { useSportsData } from '@/contexts/SportsDataContext';

import { teamLogoService } from '@/services/teamLogoService';
import SEOMetaTags from '@/components/SEOMetaTags';
import SocialShare from '@/components/SocialShare';
import { useMatchTeamLogos } from '@/hooks/useTeamLogo';
import TeamLogoDisplay from '@/components/TeamLogoDisplay';

// Component imports
import MatchHeader from '@/components/match/MatchHeader';
import StreamTab from '@/components/match/StreamTab';
import LoadingState from '@/components/match/LoadingState';
import NotFoundState from '@/components/match/NotFoundState';
import MatchCard from '@/components/MatchCard';
import MatchAnalysis from '@/components/match/MatchAnalysis';
import { ViewerStats } from '@/components/match/ViewerStats';
import BannerAd from '@/components/BannerAd';
import SidebarAd from '@/components/SidebarAd';
import LeaderboardAd from '@/components/LeaderboardAd';
import PopularMatchesList from '@/components/match/PopularMatchesList';


const Match = () => {
  const { toast } = useToast();
  const { sportId, matchId } = useParams();
  const [match, setMatch] = useState<MatchType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Use shared sports data context for recommended matches (already cached!)
  const { allMatches: cachedMatches, liveMatches } = useSportsData();

  // Track viewer count for this match
  useViewerTracking(matchId);

  // IMPORTANT: All hooks must be called before any conditional returns
  // Fetch team logos - call hook unconditionally with safe fallbacks
  const { homeLogo, awayLogo } = useMatchTeamLogos(
    match?.teams?.home,
    match?.teams?.away
  );

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

  // Compute recommended matches from cached data (no API call!)
  const recommendedMatches = useMemo(() => {
    if (!match || cachedMatches.length === 0) return [];
    return cachedMatches
      .filter(m => m.category === match.category && m.id !== match.id)
      .slice(0, 6);
  }, [match, cachedMatches]);

  // Compute trending matches from cached data (no API call!)
  const trendingMatches = useMemo(() => {
    if (cachedMatches.length === 0) return [];
    return cachedMatches
      .filter(m => isTrendingMatch(m.title).isTrending && m.id !== match?.id)
      .slice(0, 6);
  }, [match, cachedMatches]);

  // Load match data and streams - optimized to be faster
  useEffect(() => {
    const loadMatchData = async () => {
      if (!sportId || !matchId) return;

      try {
        setIsLoading(true);
        console.log(`Loading match: ${sportId}/${matchId}`);
        
        // First, try to find the match in cached data (instant!)
        let matchData: MatchType | null = null;
        
        // Check cached matches first for instant load
        // First try exact match, then match by numeric ID suffix
        const cachedMatch = cachedMatches.find(m => {
          if (m.id === matchId) return true;
          // Extract trailing numeric ID from both sides and compare
          const matchNumeric = matchId.match(/-(\d+)$/)?.[1] || matchId.match(/(\d+)/)?.[0];
          const cachedNumeric = m.id.match(/-(\d+)$/)?.[1] || m.id.match(/(\d+)/)?.[0];
          return matchNumeric && cachedNumeric && matchNumeric === cachedNumeric;
        });
        
        if (cachedMatch) {
          console.log('✅ Match found in cache - instant load!');
          matchData = cachedMatch;
        } else {
          // Fall back to API fetch
          matchData = await fetchMatch(sportId, matchId);
        }
        
        const enhancedMatch = teamLogoService.enhanceMatchWithLogos(matchData);
        setMatch(enhancedMatch);

        // Use the enhanced stream player to load all streams
        await handleMatchSelect(enhancedMatch);

        // Auto-scroll to video player after data loads
        setTimeout(() => {
          const streamElement = document.querySelector('[data-stream-container]') || 
                              document.querySelector('#stream-player') ||
                              document.querySelector('.stream-player');
          if (streamElement) {
            streamElement.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'start' 
            });
          }
        }, 300);
        
      } catch (error) {
        console.error('Error loading match:', error);
        setMatch(null);
        toast({
          title: "Error loading match",
          description: "Failed to load match details. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadMatchData();
  }, [sportId, matchId, toast, handleMatchSelect, cachedMatches]);

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
  const matchSlug = generateMatchSlug(homeTeam, awayTeam, match.title);
  
  // SEO-optimized title and description
  const seoTitle = `Watch ${matchTitle} Live Stream - HD Score`;
  const seoDescription = `Watch ${matchTitle} live stream with real-time scores, stats, and HD coverage on DamiTV.`;
  const canonicalUrl = `https://damitv.pro/match/${sportId}/${matchId}/${matchSlug}`;

  // Generate match poster URL for social sharing
  const getMatchPosterUrl = () => {
    if (match.poster && match.poster.trim() !== '') {
      const baseUrl = getBohoImageUrl(match.poster);
      if (baseUrl) return `${baseUrl}?v=${Date.now()}`;
    }
    return 'https://i.imgur.com/m4nV9S8.png';
  };

  const matchPosterUrl = getMatchPosterUrl();

  return (
    <div className="min-h-screen bg-sports-dark text-sports-light">
      <SEOMetaTags
        title={seoTitle}
        description={seoDescription}
        keywords={`${homeTeam} live stream, ${awayTeam} online, ${matchTitle}, ${matchTitle} on damitv.pro, live football streaming`}
        canonicalUrl={canonicalUrl}
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
          { name: `${matchTitle} Live Stream`, url: canonicalUrl }
        ]}
      />

      <Helmet>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SportsEvent",
            "name": matchTitle,
            "description": seoDescription,
            "startDate": match.date ? new Date(match.date).toISOString() : new Date().toISOString(),
            "eventStatus": "https://schema.org/EventScheduled",
            "eventAttendanceMode": "https://schema.org/OnlineEventAttendanceMode",
            "location": {
              "@type": "VirtualLocation",
              "url": canonicalUrl
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
          <div className="flex items-center gap-2">
            <SocialShare
              title={matchTitle}
              description={seoDescription}
              image={matchPosterUrl}
              url={canonicalUrl}
            />
          </div>
        }
      />
      
      <div className="container mx-auto px-4 py-4 sm:py-8">
        {/* Banner Ad at top of player page */}
        <BannerAd className="mb-4" />
        
        <div className="w-full mb-4">
          <div className="text-left">
            {homeTeam && awayTeam ? (
              <div className="flex flex-col items-start gap-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <TeamLogoDisplay logo={homeLogo} teamName={homeTeam} size="lg" />
                    <span className="text-xl md:text-2xl font-bold text-white">{homeTeam}</span>
                  </div>
                  <span className="text-lg md:text-xl font-medium text-gray-400">vs</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xl md:text-2xl font-bold text-white">{awayTeam}</span>
                    <TeamLogoDisplay logo={awayLogo} teamName={awayTeam} size="lg" />
                  </div>
                </div>
                <p className="text-sm text-gray-400">Watch with HD quality on DamiTV</p>
              </div>
            ) : (
              <div className="flex flex-col items-start gap-1">
                <h1 className="text-xl md:text-2xl font-bold text-white">{matchTitle} Live Stream</h1>
                <p className="text-sm text-gray-400">Watch {matchTitle} with HD quality on DamiTV</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Video Player and Sidebar Ad Layout */}
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

            {/* Leaderboard Ad - Below video player on desktop */}
            <LeaderboardAd className="mt-4" />

            {/* Viewer Statistics */}
            <div className="mt-6">
              <ViewerStats match={match} />
            </div>
          </div>

          {/* Sidebar Ad - Desktop Only (160x600 Skyscraper) */}
          <div className="hidden lg:block flex-shrink-0">
            <div className="sticky top-4">
              <SidebarAd />
            </div>
          </div>
        </div>

        {/* Match Analysis and Preview Content */}
        <div className="mt-8">
          <MatchAnalysis match={match} />
        </div>

        {/* Recommended Matches */}
        {recommendedMatches.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Similar Matches You Might Like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr">
              {recommendedMatches.map((relatedMatch) => (
                <MatchCard key={relatedMatch.id} match={relatedMatch} sportId={relatedMatch.category} isCompact={true} />
              ))}
            </div>
          </div>
        )}
        {/* Native Ad removed from mobile - Adsterra invoke.js causes auto-popup on mobile */}
      </div>
      
      <footer className="bg-sports-darker text-gray-400 py-6 mt-10">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-2">© 2025 DamiTV - All rights reserved</p>
          <a
            href="https://foreseehawancestor.com/zbt0wegpe?key=39548340a9430381e48a2856c8cf8d37"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
          >
            <span>Support DamiTV</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </a>
        </div>
      </footer>
    </div>
  );
};

export default Match;