import React, { Suspense, lazy, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { usePopunderAd } from "./hooks/usePopunderAd";
import { useServiceWorkerUpdate } from "./hooks/useServiceWorkerUpdate";
import { useLiveScoreUpdates } from "./hooks/useLiveScoreUpdates";
import PopupAd from "./components/PopupAd";
import AdsterraSocialBar from "./components/AdsterraSocialBar";
import SEOPageTracker from "./components/SEOPageTracker";
import MonetizationTracker from "./components/MonetizationTracker";
import ErrorBoundary from "./components/ErrorBoundary";
import { queryClient, prefetchQueries } from "./lib/queryClient";

import RequireAdmin from "./components/admin/RequireAdmin";

// Only NotFound and Match are critical - other pages lazy loaded
import NotFound from "./pages/NotFound";
import Match from "./pages/Match";

// Lazy load ALL other pages for faster initial load
const Index = lazy(() => import("./pages/Index"));
const Live = lazy(() => import("./pages/Live"));

// Lazy load non-critical pages for faster initial load
const Schedule = lazy(() => import("./pages/Schedule"));
const Channels = lazy(() => import("./pages/Channels"));
const ChannelPlayer = lazy(() => import("./pages/ChannelPlayer"));
const ManualMatchPlayer = lazy(() => import("./pages/ManualMatchPlayer"));
const Analytics = lazy(() => import("./pages/Analytics"));
const DMCANotice = lazy(() => import("./pages/DMCANotice"));
const Install = lazy(() => import("./pages/Install"));
const DaddylivehdAlternatives = lazy(() => import("./pages/DaddylivehdAlternatives"));
const BatmanstreamAlternatives = lazy(() => import("./pages/BatmanstreamAlternatives"));
const HesgoalAlternatives = lazy(() => import("./pages/HesgoalAlternatives"));
const StreameastAlternatives = lazy(() => import("./pages/StreameastAlternatives"));
const Hesgoal = lazy(() => import("./pages/Hesgoal"));
const Vipleague = lazy(() => import("./pages/Vipleague"));
const Myp2p = lazy(() => import("./pages/Myp2p"));
const CrackstreamsAlternative = lazy(() => import("./pages/CrackstreamsAlternative"));
const FreestreamsLive1 = lazy(() => import("./pages/FreestreamsLive1"));
const TotalsportekFormula1 = lazy(() => import("./pages/TotalsportekFormula1"));
const TotalsportekTennis = lazy(() => import("./pages/TotalsportekTennis"));
const HesgoalLiveStream = lazy(() => import("./pages/HesgoalLiveStream"));
const HesgoalTV = lazy(() => import("./pages/HesgoalTV"));
const Sport365Live = lazy(() => import("./pages/Sport365Live"));
const WatchPremierLeague = lazy(() => import("./pages/WatchPremierLeague"));
const NbaStreaming = lazy(() => import("./pages/NbaStreaming"));
const UfcStreaming = lazy(() => import("./pages/UfcStreaming"));
const SelectedMatchPlayer = lazy(() => import("./pages/SelectedMatchPlayer"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const AdminBlog = lazy(() => import("./pages/AdminBlog"));
const AdminBlogEditor = lazy(() => import("./pages/AdminBlogEditor"));
const Auth = lazy(() => import("./pages/Auth"));

// League Pages
const LaLigaStreaming = lazy(() => import("./pages/leagues/LaLigaStreaming"));
const BundesligaStreaming = lazy(() => import("./pages/leagues/BundesligaStreaming"));
const SerieAStreaming = lazy(() => import("./pages/leagues/SerieAStreaming"));
const Ligue1Streaming = lazy(() => import("./pages/leagues/Ligue1Streaming"));
const ChampionsLeagueStreaming = lazy(() => import("./pages/leagues/ChampionsLeagueStreaming"));
const EuropaLeagueStreaming = lazy(() => import("./pages/leagues/EuropaLeagueStreaming"));

// American Sports Pages
const NFLStreaming = lazy(() => import("./pages/sports/NFLStreaming"));
const MLBStreaming = lazy(() => import("./pages/sports/MLBStreaming"));
const NHLStreaming = lazy(() => import("./pages/sports/NHLStreaming"));
const MLSStreaming = lazy(() => import("./pages/sports/MLSStreaming"));

// Combat & Motorsports Pages
const BoxingStreaming = lazy(() => import("./pages/sports/BoxingStreaming"));
const WWEStreaming = lazy(() => import("./pages/sports/WWEStreaming"));
const MotoGPStreaming = lazy(() => import("./pages/sports/MotoGPStreaming"));

// Tools
const HlsExtractor = lazy(() => import("./pages/HlsExtractor"));
const StreamTest = lazy(() => import("./pages/StreamTest"));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="animate-pulse flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-muted-foreground text-sm">Loading...</p>
    </div>
  </div>
);

const App: React.FC = () => {
  // Initialize ad hooks
  usePopunderAd();
  useServiceWorkerUpdate();
  
  // Initialize live score updates globally (populates the global score store)
  useLiveScoreUpdates(30000);

  // Prefetch critical data on app load
  useEffect(() => {
    // Delay slightly to not block initial render
    const timer = setTimeout(() => {
      prefetchQueries();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <ErrorBoundary>
          <BrowserRouter>
            
            <MonetizationTracker>
              <TooltipProvider>
                <PopupAd />
                <AdsterraSocialBar />
                <Toaster />
                <Sonner />
                <Routes>
              <Route path="/" element={
                <SEOPageTracker pageTitle="DamiTV - Free Live Football Streaming" contentType="home">
                  <Suspense fallback={<PageLoader />}><Index /></Suspense>
                </SEOPageTracker>
              } />
              <Route path="/match/:sportId/:matchId" element={
                <SEOPageTracker contentType="match">
                  <Suspense fallback={<PageLoader />}><Match /></Suspense>
                </SEOPageTracker>
              } />
              <Route path="/manual-match/:matchId" element={
                <SEOPageTracker contentType="match">
                  <Suspense fallback={<PageLoader />}><ManualMatchPlayer /></Suspense>
                </SEOPageTracker>
              } />
              <Route path="/schedule" element={
                <SEOPageTracker pageTitle="Sports Schedule - Live Matches Today" contentType="schedule">
                  <Suspense fallback={<PageLoader />}><Schedule /></Suspense>
                </SEOPageTracker>
              } />
              <Route path="/live" element={
                <SEOPageTracker pageTitle="Live Sports Streaming Now" contentType="live">
                  <Suspense fallback={<PageLoader />}><Live /></Suspense>
                </SEOPageTracker>
              } />
              <Route path="/channels" element={
                <SEOPageTracker pageTitle="Free Sports TV Channels" contentType="channels">
                  <Suspense fallback={<PageLoader />}><Channels /></Suspense>
                </SEOPageTracker>
              } />
              <Route path="/channel/:country/:channelId" element={
                <SEOPageTracker contentType="channels">
                  <Suspense fallback={<PageLoader />}><ChannelPlayer /></Suspense>
                </SEOPageTracker>
              } />
              <Route path="/selected-match/:matchId" element={
                <SEOPageTracker contentType="match">
                  <Suspense fallback={<PageLoader />}><SelectedMatchPlayer /></Suspense>
                </SEOPageTracker>
              } />
              <Route path="/analytics" element={
                <SEOPageTracker pageTitle="Website Analytics" contentType="home">
                  <Suspense fallback={<PageLoader />}><Analytics /></Suspense>
                </SEOPageTracker>
              } />
              <Route path="/dmca" element={<Suspense fallback={<PageLoader />}><DMCANotice /></Suspense>} />
              <Route path="/install" element={
                <SEOPageTracker pageTitle="Install DamiTV App" contentType="home">
                  <Suspense fallback={<PageLoader />}><Install /></Suspense>
                </SEOPageTracker>
              } />
              <Route path="/daddylivehd-alternatives" element={
                <SEOPageTracker pageTitle="DaddyliveHD Alternatives - Best Sports Streaming Sites" contentType="home">
                  <Suspense fallback={<PageLoader />}><DaddylivehdAlternatives /></Suspense>
                </SEOPageTracker>
              } />
              <Route path="/batmanstream-alternatives" element={
                <SEOPageTracker pageTitle="Batmanstream Alternatives - Safe Sports Streaming Sites" contentType="home">
                  <Suspense fallback={<PageLoader />}><BatmanstreamAlternatives /></Suspense>
                </SEOPageTracker>
              } />
              <Route path="/hesgoal-alternatives" element={
                <SEOPageTracker pageTitle="Hesgoal Alternatives - Legal Sports Streaming Sites" contentType="home">
                  <Suspense fallback={<PageLoader />}><HesgoalAlternatives /></Suspense>
                </SEOPageTracker>
              } />
              <Route path="/streameast-alternatives" element={
                <SEOPageTracker pageTitle="StreamEast Alternatives - Best Free Sports Streaming Sites" contentType="home">
                  <Suspense fallback={<PageLoader />}><StreameastAlternatives /></Suspense>
                </SEOPageTracker>
              } />
              <Route path="/hesgoal" element={<Suspense fallback={<PageLoader />}><Hesgoal /></Suspense>} />
              <Route path="/vipleague" element={<Suspense fallback={<PageLoader />}><Vipleague /></Suspense>} />
              <Route path="/myp2p" element={<Suspense fallback={<PageLoader />}><Myp2p /></Suspense>} />
              <Route path="/crackstreams-alternative" element={<Suspense fallback={<PageLoader />}><CrackstreamsAlternative /></Suspense>} />
              <Route path="/freestreams-live1" element={<Suspense fallback={<PageLoader />}><FreestreamsLive1 /></Suspense>} />
              <Route path="/totalsportek-formula-1" element={<Suspense fallback={<PageLoader />}><TotalsportekFormula1 /></Suspense>} />
              <Route path="/totalsportek-tennis" element={<Suspense fallback={<PageLoader />}><TotalsportekTennis /></Suspense>} />
              <Route path="/hesgoal-live-stream" element={<Suspense fallback={<PageLoader />}><HesgoalLiveStream /></Suspense>} />
              <Route path="/hesgoal-tv" element={<Suspense fallback={<PageLoader />}><HesgoalTV /></Suspense>} />
              <Route path="/sport365-live" element={<Suspense fallback={<PageLoader />}><Sport365Live /></Suspense>} />
              <Route path="/watch-premier-league-free" element={
                <SEOPageTracker pageTitle="Watch Premier League Free" contentType="home">
                  <Suspense fallback={<PageLoader />}><WatchPremierLeague /></Suspense>
                </SEOPageTracker>
              } />
              {/* League Pages */}
              <Route path="/la-liga-streaming" element={<Suspense fallback={<PageLoader />}><LaLigaStreaming /></Suspense>} />
              <Route path="/bundesliga-streaming" element={<Suspense fallback={<PageLoader />}><BundesligaStreaming /></Suspense>} />
              <Route path="/serie-a-streaming" element={<Suspense fallback={<PageLoader />}><SerieAStreaming /></Suspense>} />
              <Route path="/ligue-1-streaming" element={<Suspense fallback={<PageLoader />}><Ligue1Streaming /></Suspense>} />
              <Route path="/champions-league-streaming" element={<Suspense fallback={<PageLoader />}><ChampionsLeagueStreaming /></Suspense>} />
              <Route path="/europa-league-streaming" element={<Suspense fallback={<PageLoader />}><EuropaLeagueStreaming /></Suspense>} />
              {/* American Sports */}
              <Route path="/nfl-streaming" element={<Suspense fallback={<PageLoader />}><NFLStreaming /></Suspense>} />
              <Route path="/mlb-streaming" element={<Suspense fallback={<PageLoader />}><MLBStreaming /></Suspense>} />
              <Route path="/nhl-streaming" element={<Suspense fallback={<PageLoader />}><NHLStreaming /></Suspense>} />
              <Route path="/mls-streaming" element={<Suspense fallback={<PageLoader />}><MLSStreaming /></Suspense>} />
              {/* Combat & Motorsports */}
              <Route path="/boxing-streaming" element={<Suspense fallback={<PageLoader />}><BoxingStreaming /></Suspense>} />
              <Route path="/wwe-streaming" element={<Suspense fallback={<PageLoader />}><WWEStreaming /></Suspense>} />
              <Route path="/motogp-streaming" element={<Suspense fallback={<PageLoader />}><MotoGPStreaming /></Suspense>} />
              <Route path="/nba-streaming-free" element={
                <SEOPageTracker pageTitle="NBA Streaming Free" contentType="home">
                  <Suspense fallback={<PageLoader />}><NbaStreaming /></Suspense>
                </SEOPageTracker>
              } />
              <Route path="/ufc-streaming-free" element={
                <SEOPageTracker pageTitle="UFC Streaming Free" contentType="home">
                  <Suspense fallback={<PageLoader />}><UfcStreaming /></Suspense>
                </SEOPageTracker>
              } />
              {/* Blog Pages */}
              <Route path="/blog" element={
                <SEOPageTracker pageTitle="Blog - Sports News & Updates" contentType="home">
                  <Suspense fallback={<PageLoader />}><Blog /></Suspense>
                </SEOPageTracker>
              } />
              <Route path="/blog/:slug" element={
                <SEOPageTracker contentType="home">
                  <Suspense fallback={<PageLoader />}><BlogPost /></Suspense>
                </SEOPageTracker>
              } />
              {/* Admin Blog Pages */}
              <Route
                path="/admin/blog"
                element={
                  <RequireAdmin>
                    <Suspense fallback={<PageLoader />}>
                      <AdminBlog />
                    </Suspense>
                  </RequireAdmin>
                }
              />
              <Route
                path="/admin/blog/new"
                element={
                  <RequireAdmin>
                    <Suspense fallback={<PageLoader />}>
                      <AdminBlogEditor />
                    </Suspense>
                  </RequireAdmin>
                }
              />
              <Route
                path="/admin/blog/edit/:id"
                element={
                  <RequireAdmin>
                    <Suspense fallback={<PageLoader />}>
                      <AdminBlogEditor />
                    </Suspense>
                  </RequireAdmin>
                }
              />
              {/* Auth */}
              <Route path="/auth" element={<Suspense fallback={<PageLoader />}><Auth /></Suspense>} />
              {/* Tools */}
              <Route path="/hls-extractor" element={<Suspense fallback={<PageLoader />}><HlsExtractor /></Suspense>} />
              <Route path="/stream-test" element={<Suspense fallback={<PageLoader />}><StreamTest /></Suspense>} />
              <Route path="*" element={<NotFound />} />
                </Routes>
              </TooltipProvider>
            </MonetizationTracker>
          </BrowserRouter>
      </ErrorBoundary>
    </HelmetProvider>
  </QueryClientProvider>
);
};

export default App;
