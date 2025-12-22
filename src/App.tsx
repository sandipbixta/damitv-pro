
import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { usePopunderAd } from "./hooks/usePopunderAd";
import AdsterraSocialBar from "./components/AdsterraSocialBar";
import SEOPageTracker from "./components/SEOPageTracker";
import MonetizationTracker from "./components/MonetizationTracker";

// Import pages directly instead of lazy loading to avoid module import errors
import Index from "./pages/Index";
import Match from "./pages/Match";
import Schedule from "./pages/Schedule";
import Live from "./pages/Live";
import Channels from "./pages/Channels";
import ChannelPlayer from "./pages/ChannelPlayer";
import ManualMatchPlayer from "./pages/ManualMatchPlayer";
import Analytics from "./pages/Analytics";
import DMCANotice from "./pages/DMCANotice";
import NotFound from "./pages/NotFound";
import About from "./pages/About";
import Contact from "./pages/Contact";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Install from "./pages/Install";
import DaddylivehdAlternatives from "./pages/DaddylivehdAlternatives";
import BatmanstreamAlternatives from "./pages/BatmanstreamAlternatives";
import HesgoalAlternatives from "./pages/HesgoalAlternatives";
import Hesgoal from "./pages/Hesgoal";
import Vipleague from "./pages/Vipleague";
import Myp2p from "./pages/Myp2p";
import CrackstreamsAlternative from "./pages/CrackstreamsAlternative";
import FreestreamsLive1 from "./pages/FreestreamsLive1";
import TotalsportekFormula1 from "./pages/TotalsportekFormula1";
import TotalsportekTennis from "./pages/TotalsportekTennis";
import HesgoalLiveStream from "./pages/HesgoalLiveStream";
import HesgoalTV from "./pages/HesgoalTV";
import Sport365Live from "./pages/Sport365Live";
import WatchPremierLeague from "./pages/WatchPremierLeague";
import NbaStreaming from "./pages/NbaStreaming";
import UfcStreaming from "./pages/UfcStreaming";
import GoogleAnalytics from "./components/GoogleAnalytics";
import TelegramFAB from "./components/TelegramFAB";

// Optimized query client configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes (v4 uses cacheTime, not gcTime)
    }
  }
});

const App: React.FC = () => {
  // Initialize ad hooks
  usePopunderAd();

  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <BrowserRouter>
          <GoogleAnalytics />
          <MonetizationTracker>
            <TooltipProvider>
              <AdsterraSocialBar />
              <TelegramFAB />
              <Toaster />
              <Sonner />
            <Routes>
              <Route path="/" element={
                <SEOPageTracker pageTitle="DamiTV - Free Live Football Streaming" contentType="home">
                  <Index />
                </SEOPageTracker>
              } />
              <Route path="/match/:sportId/:matchId/:slug?" element={
                <SEOPageTracker contentType="match">
                  <Match />
                </SEOPageTracker>
              } />
              <Route path="/manual-match/:matchId" element={
                <SEOPageTracker contentType="match">
                  <ManualMatchPlayer />
                </SEOPageTracker>
              } />
              <Route path="/schedule" element={
                <SEOPageTracker pageTitle="Sports Schedule - Live Matches Today" contentType="schedule">
                  <Schedule />
                </SEOPageTracker>
              } />
              <Route path="/live" element={
                <SEOPageTracker pageTitle="Live Sports Streaming Now" contentType="live">
                  <Live />
                </SEOPageTracker>
              } />
              <Route path="/channels" element={
                <SEOPageTracker pageTitle="Free Sports TV Channels" contentType="channels">
                  <Channels />
                </SEOPageTracker>
              } />
              <Route path="/channel/:country/:channelId" element={
                <SEOPageTracker contentType="channels">
                  <ChannelPlayer />
                </SEOPageTracker>
              } />
              <Route path="/analytics" element={
                <SEOPageTracker pageTitle="Website Analytics" contentType="home">
                  <Analytics />
                </SEOPageTracker>
              } />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/dmca" element={<DMCANotice />} />
              <Route path="/install" element={
                <SEOPageTracker pageTitle="Install DamiTV App" contentType="home">
                  <Install />
                </SEOPageTracker>
              } />
              <Route path="/daddylivehd-alternatives" element={
                <SEOPageTracker pageTitle="DaddyliveHD Alternatives - Best Sports Streaming Sites" contentType="home">
                  <DaddylivehdAlternatives />
                </SEOPageTracker>
              } />
              <Route path="/batmanstream-alternatives" element={
                <SEOPageTracker pageTitle="Batmanstream Alternatives - Safe Sports Streaming Sites" contentType="home">
                  <BatmanstreamAlternatives />
                </SEOPageTracker>
              } />
              <Route path="/hesgoal-alternatives" element={
                <SEOPageTracker pageTitle="Hesgoal Alternatives - Legal Sports Streaming Sites" contentType="home">
                  <HesgoalAlternatives />
                </SEOPageTracker>
              } />
              <Route path="/hesgoal" element={<Hesgoal />} />
              <Route path="/vipleague" element={<Vipleague />} />
              <Route path="/myp2p" element={<Myp2p />} />
              <Route path="/crackstreams-alternative" element={<CrackstreamsAlternative />} />
              <Route path="/freestreams-live1" element={<FreestreamsLive1 />} />
              <Route path="/totalsportek-formula-1" element={<TotalsportekFormula1 />} />
              <Route path="/totalsportek-tennis" element={<TotalsportekTennis />} />
              <Route path="/hesgoal-live-stream" element={<HesgoalLiveStream />} />
              <Route path="/hesgoal-tv" element={<HesgoalTV />} />
              <Route path="/sport365-live" element={<Sport365Live />} />
              <Route path="/watch-premier-league-free" element={
                <SEOPageTracker pageTitle="Watch Premier League Free" contentType="home">
                  <WatchPremierLeague />
                </SEOPageTracker>
              } />
              <Route path="/nba-streaming-free" element={
                <SEOPageTracker pageTitle="NBA Streaming Free" contentType="home">
                  <NbaStreaming />
                </SEOPageTracker>
              } />
              <Route path="/ufc-streaming-free" element={
                <SEOPageTracker pageTitle="UFC Streaming Free" contentType="home">
                  <UfcStreaming />
                </SEOPageTracker>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </MonetizationTracker>
      </BrowserRouter>
    </HelmetProvider>
  </QueryClientProvider>
);
};

export default App;
