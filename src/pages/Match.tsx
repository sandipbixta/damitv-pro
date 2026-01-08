import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Match as MatchType } from '@/types/sports';
import { fetchMatch, fetchMatches, getBohoImageUrl } from '@/api/sportsApi';
import { useStreamPlayer } from '@/hooks/useStreamPlayer';
import { useViewerTracking } from '@/hooks/useViewerTracking';
import { Helmet } from 'react-helmet-async';
import { isTrendingMatch } from '@/utils/popularLeagues';
import { generateMatchSlug } from '@/utils/matchSlug';

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
import AdsterraSocialBar from '@/components/AdsterraSocialBar';


const Match = () => {
  const { toast } = useToast();
  const { sportId, matchId } = useParams();
  const [match, setMatch] = useState<MatchType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [allMatches, setAllMatches] = useState<MatchType[]>([]);
  const [recommendedMatches, setRecommendedMatches] = useState<MatchType[]>([]);
  const [trendingMatches, setTrendingMatches] = useState<MatchType[]>([]);

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

  // Load match data and streams
  useEffect(() => {
    const loadMatchData = async () => {
      if (!sportId || !matchId) return;

      try {
        setIsLoading(true);
        console.log(`Loading match: ${sportId}/${matchId}`);
        
        // Fetch the specific match
        const matchData = await fetchMatch(sportId, matchId);
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
        }, 500);

        // Load all matches for recommended sections
        const allMatches = await fetchMatches(sportId);
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
  }, [sportId, matchId, toast, handleMatchSelect]);

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
      <AdsterraSocialBar />
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
        <div className="w-full flex justify-center mb-4">
          <div className="text-center max-w-4xl px-4">
            {homeTeam && awayTeam ? (
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center justify-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <TeamLogoDisplay logo={homeLogo} teamName={homeTeam} size="lg" />
                    <span className="text-2xl md:text-3xl font-bold text-white">{homeTeam}</span>
                  </div>
                  <span className="text-xl md:text-2xl font-medium text-gray-400">vs</span>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl md:text-3xl font-bold text-white">{awayTeam}</span>
                    <TeamLogoDisplay logo={awayLogo} teamName={awayTeam} size="lg" />
                  </div>
                </div>
                <h1 className="text-lg md:text-xl text-gray-300">Live Stream</h1>
              </div>
            ) : (
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">{matchTitle} Live Stream</h1>
            )}
            <p className="text-sm md:text-base text-gray-400 mt-2">Watch {matchTitle} with HD quality on DamiTV</p>
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

            {/* Viewer Statistics */}
            <div className="mt-6">
              <ViewerStats match={match} />
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