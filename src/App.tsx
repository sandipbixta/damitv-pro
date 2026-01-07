
import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import SEOPageTracker from "./components/SEOPageTracker";
import MonetizationTracker from "./components/MonetizationTracker";

// Import pages directly
import Index from "./pages/Index";
import Match from "./pages/Match";
import Schedule from "./pages/Schedule";
import Live from "./pages/Live";
import Channels from "./pages/Channels";
import ChannelPlayer from "./pages/ChannelPlayer";
import ManualMatchPlayer from "./pages/ManualMatchPlayer";
import AdminCustomMatch from "./pages/AdminCustomMatch";
import CustomMatchPlayer from "./pages/CustomMatchPlayer";
import Analytics from "./pages/Analytics";
import DMCANotice from "./pages/DMCANotice";
import NotFound from "./pages/NotFound";
import About from "./pages/About";
import Contact from "./pages/Contact";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Install from "./pages/Install";
import MatchDetail from "./pages/MatchDetail";

// Optimized query client configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
    }
  }
});

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <BrowserRouter>
          <MonetizationTracker>
            <TooltipProvider>
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
                <Route path="/admin/blog/new" element={<AdminCustomMatch />} />
                <Route path="/custom-match/:matchId" element={
                  <SEOPageTracker contentType="match">
                    <CustomMatchPlayer />
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
                <Route path="/match/:matchName" element={
                  <SEOPageTracker contentType="match">
                    <MatchDetail />
                  </SEOPageTracker>
                } />
                <Route path="/m/:matchName" element={
                  <SEOPageTracker contentType="match">
                    <MatchDetail />
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
