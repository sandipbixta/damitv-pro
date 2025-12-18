
import React, { useEffect } from 'react';
import PageLayout from '../components/PageLayout';
import { generateCompetitorTitle, generateCompetitorDescription } from '../utils/competitorSEO';
import CompetitorSEOContent from '../components/CompetitorSEOContent';
import ChannelsGrid from '../components/ChannelsGrid';
import Advertisement from '../components/Advertisement';

import { useIsMobile } from '../hooks/use-mobile';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Helmet } from 'react-helmet-async';
import { Calendar } from 'lucide-react';
import TelegramBanner from '../components/TelegramBanner';

const Channels = () => {
  const isMobile = useIsMobile();
  
  // Log when the Channels page loads
  useEffect(() => {
    console.log('Channels page loaded', new Date().toISOString());
    console.log('EPG data will be loaded for all available countries');
  }, []);
  
  return (
    <PageLayout>
      <Helmet>
        <title>Live TV Sports Channels Free - 70+ Channels | DamiTV</title>
        <meta name="description" content="Watch 70+ free sports TV channels online. International channels for football, basketball, tennis and more. HD streaming, no registration." />
        <meta name="keywords" content="live tv channels, sports tv, football streams, live football, premier league stream, champions league stream, free sports channels, tv guide, epg, totalsportek channels, hesgoal alternative, vipleague alternative" />
        <link rel="canonical" href="https://damitv.pro/channels" />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        
        <meta property="og:title" content="Live TV Channels & Football Streams | DamiTV Sports" />
        <meta property="og:description" content="Watch free live football streams, Premier League, Champions League, La Liga and all major sports. Updated with trending games daily." />
        <meta property="og:url" content="https://damitv.pro/channels" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://i.imgur.com/m4nV9S8.png" />
        
        <script type="application/ld+json">
        {`
          {
            "@context": "https://schema.org",
            "@type": "BroadcastService",
            "name": "DamiTV Sports Channels",
            "url": "https://damitv.pro/channels",
            "broadcastDisplayName": "DamiTV",
            "broadcastTimezone": "UTC",
            "broadcaster": {
              "@type": "Organization",
              "name": "DamiTV Sports",
              "url": "https://damitv.pro"
            },
            "inLanguage": "en",
            "potentialAction": {
              "@type": "WatchAction",
              "target": {
                "@type": "EntryPoint",
                "urlTemplate": "https://damitv.pro/channels"
              }
            },
            "about": {
              "@type": "Thing",
              "name": "Football Streaming",
              "description": "Watch football streams, Premier League, Champions League, La Liga and all major leagues"
            },
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": "https://damitv.pro/channels"
            }
          }
        `}
        </script>
        
        <script type="application/ld+json">
        {`
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "item": {
                  "@type": "SportsEvent",
                  "name": "Premier League Live Streams",
                  "url": "https://damitv.pro/channels",
                  "location": {
                    "@type": "VirtualLocation",
                    "name": "DamiTV"
                  },
                  "description": "Watch all Premier League matches live on DamiTV"
                }
              },
              {
                "@type": "ListItem",
                "position": 2,
                "item": {
                  "@type": "SportsEvent",
                  "name": "Champions League Live Streams",
                  "url": "https://damitv.pro/channels",
                  "location": {
                    "@type": "VirtualLocation",
                    "name": "DamiTV"
                  },
                  "description": "Champions League football matches streaming live"
                }
              },
              {
                "@type": "ListItem",
                "position": 3,
                "item": {
                  "@type": "SportsEvent",
                  "name": "La Liga Live Streams",
                  "url": "https://damitv.pro/channels",
                  "location": {
                    "@type": "VirtualLocation",
                    "name": "DamiTV"
                  },
                  "description": "Spanish La Liga football streaming online"
                }
              }
            ]
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
                "name": "TV Channels",
                "item": "https://damitv.pro/channels"
              }
            ]
          }
        `}
        </script>
      </Helmet>
      
      {/* Popunder Ad removed */}
      
      <div className="mb-6 sm:mb-8">
        <header className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground">Live TV Sports Channels</h1>
            <Link to="/schedule" className="hidden sm:flex items-center gap-2">
              <Button variant="outline" size="sm" className="bg-background border-border text-foreground hover:bg-muted">
                <Calendar className="h-4 w-4 mr-2" />
                Full Schedule
              </Button>
            </Link>
          </div>
          <p className="text-muted-foreground">
            Access 70+ international sports channels streaming live in HD quality. Watch football, basketball, tennis and more. DamiTV is your trusted <a href="https://damitv.pro/" className="text-primary hover:underline font-medium">vipleague alternative with HD streams</a> for all major sports.
          </p>
        </header>
        
        {/* Telegram Banner */}
        <div className="mb-4">
          <TelegramBanner />
        </div>
        
        <ChannelsGrid />
        
        {/* Cross-promotion section */}
        <section className="my-12 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl p-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/hero-pattern.svg')] opacity-10"></div>
          <div className="relative">
            <h3 className="text-2xl font-bold mb-4">Watch Live Sports Now</h3>
            <p className="text-lg mb-6 max-w-2xl">
              Browse <a href="/live" className="underline hover:no-underline">live matches</a> or check the <a href="/schedule" className="underline hover:no-underline">sports schedule</a> for upcoming games. HD streaming available on all channels.
            </p>
            <div className="flex gap-3">
              <Link to="/live">
                <Button variant="secondary" className="bg-white text-purple-600 hover:bg-gray-100">
                  Watch Live Now
                </Button>
              </Link>
              <Link to="/schedule">
                <Button variant="outline" className="border-white text-white hover:bg-white hover:text-purple-600">
                  View Schedule
                </Button>
              </Link>
            </div>
          </div>
        </section>
        
        
        {/* Video Advertisement - moved to bottom */}
        <div className="mt-6">
          <Advertisement type="video" className="w-full" />
        </div>
        
        {/* Sidebar Advertisement - at the bottom */}
        <div className="mt-6">
          <Advertisement type="sidebar" className="w-full" />
        </div>
        
        {/* SEO Content Section */}
        <section className="my-12">
          <div className="prose prose-invert max-w-none">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-3">Free Sports TV Channels</h2>
                <p className="text-muted-foreground text-sm mb-3">
                  Stream 70+ live sports TV channels free on DamiTV. Watch international sports channels broadcasting football, basketball, tennis, UFC, Formula 1 and more. All channels available in HD quality without registration or subscription fees.
                </p>
                <p className="text-muted-foreground text-sm">
                  Our <a href="/channels" className="text-primary hover:underline">TV channels</a> complement our <a href="/live" className="text-primary hover:underline">live match streaming</a> and complete <a href="/schedule" className="text-primary hover:underline">sports schedule</a>. Access everything sports in one place.
                </p>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-3">Channel Categories</h2>
                <ul className="text-muted-foreground space-y-1 text-sm">
                  <li>• Football: Sky Sports, BT Sport, beIN Sports</li>
                  <li>• Basketball: NBA TV, ESPN, EuroSport</li>
                  <li>• Tennis: Tennis Channel, Sport TV</li>
                  <li>• Combat Sports: UFC, Boxing channels</li>
                  <li>• Racing: F1 TV, MotoGP channels</li>
                  <li>• 24/7 sports news and analysis</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
        
        {/* Hidden SEO content for competitor targeting */}
        <CompetitorSEOContent showFAQ={true} showCompetitorMentions={true} />
      </div>
    </PageLayout>
  );
};

export default Channels;

