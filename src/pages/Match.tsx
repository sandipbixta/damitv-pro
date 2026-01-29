import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Match as MatchType } from '@/types/sports';
import { fetchMatch, getBohoImageUrl } from '@/api/sportsApi';
import { useStreamPlayer } from '@/hooks/useStreamPlayer';
import { useViewerTracking } from '@/hooks/useViewerTracking';
import { Helmet } from 'react-helmet-async';
import { isTrendingMatch } from '@/utils/popularLeagues';
import { generateMatchSlug } from '@/utils/matchSlug';
import { useSportsData } from '@/contexts/SportsDataContext';
import { ChevronLeft, Home, Share2 } from 'lucide-react';

import { teamLogoService } from '@/services/teamLogoService';
import SEOMetaTags from '@/components/SEOMetaTags';
import SocialShare from '@/components/SocialShare';

// Component imports
import StreamTab from '@/components/match/StreamTab';
import LoadingState from '@/components/match/LoadingState';
import NotFoundState from '@/components/match/NotFoundState';
import MatchCard from '@/components/MatchCard';
import MatchAnalysis from '@/components/match/MatchAnalysis';
import { ViewerStats } from '@/components/match/ViewerStats';
import BannerAd from '@/components/BannerAd';
import SidebarAd from '@/components/SidebarAd';
import LeaderboardAd from '@/components/LeaderboardAd';
import NativeBannerAd from '@/components/NativeBannerAd';
import AdsterraSocialBar from '@/components/AdsterraSocialBar';
import PopunderAd from '@/components/PopunderAd';


const Match = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { sportId, matchId } = useParams();
  const [match, setMatch] = useState<MatchType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { allMatches: cachedMatches } = useSportsData();

  useViewerTracking(matchId);

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

  const recommendedMatches = useMemo(() => {
    if (!match || cachedMatches.length === 0) return [];
    return cachedMatches
      .filter(m => m.category === match.category && m.id !== match.id)
      .slice(0, 6);
  }, [match, cachedMatches]);

  const cachedMatchesRef = React.useRef(cachedMatches);
  cachedMatchesRef.current = cachedMatches;

  useEffect(() => {
    const loadMatchData = async () => {
      if (!sportId || !matchId) return;

      try {
        setIsLoading(true);
        let matchData: MatchType | null = null;

        const cachedMatch = cachedMatchesRef.current.find(m => {
          if (m.id === matchId) return true;
          const matchNumeric = matchId.match(/-(\d+)$/)?.[1] || matchId.match(/(\d+)/)?.[0];
          const cachedNumeric = m.id.match(/-(\d+)$/)?.[1] || m.id.match(/(\d+)/)?.[0];
          return matchNumeric && cachedNumeric && matchNumeric === cachedNumeric;
        });

        if (cachedMatch) {
          matchData = cachedMatch;
        } else {
          matchData = await fetchMatch(sportId, matchId);
        }

        const enhancedMatch = teamLogoService.enhanceMatchWithLogos(matchData);
        setMatch(enhancedMatch);
        await handleMatchSelect(enhancedMatch);

        setTimeout(() => {
          const el = document.querySelector('[data-stream-container]');
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
  }, [sportId, matchId, toast, handleMatchSelect]);

  if (isLoading) return <LoadingState />;
  if (!match) return <NotFoundState />;

  const homeTeam = match.teams?.home?.name || '';
  const awayTeam = match.teams?.away?.name || '';
  const matchTitle = homeTeam && awayTeam ? `${homeTeam} vs ${awayTeam}` : match.title;
  const matchSlug = generateMatchSlug(homeTeam, awayTeam, match.title);
  const matchDate = new Date(match.date);
  const now = new Date();
  const isOldMatch = (now.getTime() - matchDate.getTime()) / (1000 * 60 * 60 * 24) > 3;
  const seoTitle = `Watch ${matchTitle} Live Stream - HD Score`;
  const seoDescription = `Watch ${matchTitle} live stream with real-time scores, stats, and HD coverage on DamiTV.`;
  const canonicalUrl = `https://damitv.pro/match/${sportId}/${matchId}/${matchSlug}`;

  const getMatchPosterUrl = () => {
    if (match.poster && match.poster.trim() !== '') {
      const baseUrl = getBohoImageUrl(match.poster);
      if (baseUrl) return `${baseUrl}?v=${Date.now()}`;
    }
    return 'https://i.imgur.com/m4nV9S8.png';
  };
  const matchPosterUrl = getMatchPosterUrl();

  return (
    <div className="min-h-screen bg-[#0a0e17] text-white">
      <AdsterraSocialBar />
      <PopunderAd />
      <SEOMetaTags
        title={seoTitle}
        description={seoDescription}
        keywords={`${homeTeam} live stream, ${awayTeam} online, ${matchTitle}, live football streaming`}
        canonicalUrl={canonicalUrl}
        ogImage={matchPosterUrl}
        matchInfo={{ homeTeam, awayTeam, league: match.category || 'Football', date: match.date ? new Date(match.date) : new Date() }}
        breadcrumbs={[
          { name: 'Home', url: 'https://damitv.pro/' },
          { name: 'Live Matches', url: 'https://damitv.pro/live' },
          { name: `${matchTitle} Live Stream`, url: canonicalUrl }
        ]}
      />
      <Helmet>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes" />
        {isOldMatch && <meta name="robots" content="noindex, follow" />}
        {!isOldMatch && (
          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SportsEvent",
              "name": matchTitle,
              "description": seoDescription,
              "startDate": match.date ? new Date(match.date).toISOString() : new Date().toISOString(),
              "eventStatus": "https://schema.org/EventScheduled",
              "eventAttendanceMode": "https://schema.org/OnlineEventAttendanceMode",
              "location": { "@type": "VirtualLocation", "url": canonicalUrl },
              "image": matchPosterUrl,
              "organizer": { "@type": "Organization", "name": "DamiTV", "url": "https://damitv.pro" },
              "competitor": [
                { "@type": "SportsTeam", "name": homeTeam },
                { "@type": "SportsTeam", "name": awayTeam }
              ]
            })}
          </script>
        )}
      </Helmet>

      {/* ─── Slim Top Nav ─── */}
      <nav className="sticky top-0 z-50 bg-[#0d1220]/95 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="flex items-center justify-between h-12">
            <div className="flex items-center gap-1">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors px-2 py-1.5 rounded-md hover:bg-white/5"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back</span>
              </button>
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors px-2 py-1.5 rounded-md hover:bg-white/5"
              >
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">Home</span>
              </button>
            </div>

            <h1 className="text-xs sm:text-sm font-medium text-gray-300 truncate max-w-[200px] sm:max-w-none">
              {matchTitle}
            </h1>

            <SocialShare
              title={matchTitle}
              description={seoDescription}
              image={matchPosterUrl}
              url={canonicalUrl}
            />
          </div>
        </div>
      </nav>

      {/* ─── Main Content ─── */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Ad */}
        <BannerAd className="mb-4" />

        {/* ─── Player + Sidebar Layout ─── */}
        <div className="flex flex-col lg:flex-row gap-5">

          {/* ─── Left Column: Player + Analysis ─── */}
          <div className="flex-1 min-w-0 space-y-4">

            {/* Video Player */}
            <div id="stream-container" data-stream-container>
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
            </div>

            {/* Match Analysis Tabs */}
            <MatchAnalysis match={match} />

            {/* Leaderboard Ad */}
            <LeaderboardAd />

            {/* Viewer Stats */}
            <ViewerStats match={match} />
          </div>

          {/* ─── Right Sidebar: Desktop ─── */}
          <aside className="hidden lg:flex flex-col gap-4 w-[280px] flex-shrink-0">
            {/* Sticky ad */}
            <div className="sticky top-16">
              <SidebarAd />
            </div>
          </aside>
        </div>

        {/* ─── Recommended Matches ─── */}
        {recommendedMatches.length > 0 && (
          <section className="mt-10">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-lg font-bold text-white">More Matches</h2>
              <div className="flex-1 h-px bg-white/10" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
              {recommendedMatches.map((m) => (
                <MatchCard key={m.id} match={m} sportId={m.category} isCompact={true} />
              ))}
            </div>
          </section>
        )}

        {/* Native Ad */}
        <NativeBannerAd className="mt-8" />
      </main>

      {/* ─── Footer ─── */}
      <footer className="border-t border-white/5 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-500">&copy; {new Date().getFullYear()} DamiTV. All rights reserved.</p>
          <a
            href="https://foreseehawancestor.com/zbt0wegpe?key=39548340a9430381e48a2856c8cf8d37"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-primary transition-colors"
          >
            Support DamiTV
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </a>
        </div>
      </footer>
    </div>
  );
};

export default Match;
