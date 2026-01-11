import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Maximize2, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { manualMatches } from '@/data/manualMatches';
import { ManualMatchLink } from '@/types/manualMatch';
import { useViewerTracking } from '@/hooks/useViewerTracking';
import { Helmet } from 'react-helmet-async';
import VideoPlayerSelector from '@/components/StreamPlayer/VideoPlayerSelector';
import MatchDetails from '@/components/MatchDetails';
import AdsterraSocialBar from '@/components/AdsterraSocialBar';

const ManualMatchPlayer = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  
  // Track viewer count for this match
  useViewerTracking(matchId);
  
  const match = manualMatches.find(m => m.id === matchId);
  const [selectedLink, setSelectedLink] = useState<ManualMatchLink | null>(
    match?.links?.[0] || null
  );
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  const handleFullscreen = () => {
    const playerContainer = document.querySelector('[data-player-container]') as HTMLElement;
    if (playerContainer) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        playerContainer.requestFullscreen();
      }
    }
  };

  const handleVideoLoad = () => {
    console.log('Manual match video loaded');
    setIsVideoLoaded(true);
  };

  const handleVideoError = () => {
    console.error('Manual match video failed to load');
    setIsVideoLoaded(false);
  };

  if (!match) {
    return (
      <div className="min-h-screen bg-[#0A0F1C] flex items-center justify-center">
        <Helmet>
          <title>Match Not Found | DamiTV</title>
          <meta name="description" content="The requested match could not be found on DamiTV." />
        </Helmet>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Match Not Found</h1>
          <p className="text-gray-400 mb-6">The requested match could not be found.</p>
          <Button onClick={() => navigate('/')} className="bg-[#ff5a36] hover:bg-[#e64d2e]">
            Go Back Home
          </Button>
        </div>
      </div>
    );
  }

  const homeTeam = match.teams.home;
  const awayTeam = match.teams.away;
  const matchDate = new Date(match.date);
  const formattedDate = matchDate.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  const formattedTime = matchDate.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  const seoTitle = `${match.title} Live Stream Free | ${formattedDate} | DamiTV`;
  const seoDescription = match.seo?.description || 
    `Watch ${match.title} live stream online for free on ${formattedDate} at ${formattedTime}. High-quality ${match.seo?.category || 'sports'} streaming on DamiTV with multiple sources available. ${match.title} on damitv.pro`;
  
  // Generate team-specific hashtags
  const teamAClean = homeTeam?.replace(/\s+/g, '').toLowerCase() || '';
  const teamBClean = awayTeam?.replace(/\s+/g, '').toLowerCase() || '';
  const matchHashtag = teamAClean && teamBClean ? `${teamAClean}vs${teamBClean}` : '';
  
  const seoKeywords = match.seo?.keywords || 
    `${match.title} live stream, ${match.title} watch online, ${match.title} free stream, ${match.title} on damitv.pro, live ${match.seo?.category || 'sports'} streaming, ${match.title} ${formattedDate}, #${teamAClean}, #${teamBClean}, #${matchHashtag}, watch${matchHashtag}, ${homeTeam} live stream, ${awayTeam} online`;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    "name": match.title,
    "description": seoDescription,
    "startDate": match.date,
    "url": `https://damitv.pro/manual-match/${match.id}`,
    "location": {
      "@type": "VirtualLocation",
      "name": "DamiTV Streaming Platform",
      "url": "https://damitv.pro"
    },
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
    ],
    "video": {
      "@type": "VideoObject",
      "name": `${match.title} Live Stream`,
      "description": `Live streaming video for ${match.title}`,
      "uploadDate": match.date,
      "thumbnailUrl": match.image || "https://damitv.pro/logo.png",
      "embedUrl": selectedLink?.url,
      "duration": "PT180M"
    },
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock"
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0F1C]">
      <AdsterraSocialBar />
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <meta name="keywords" content={seoKeywords} />
        <link rel="canonical" href={`https://damitv.pro/manual-match/${match.id}`} />
        
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://damitv.pro/manual-match/${match.id}`} />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:image" content={match.image || "https://damitv.pro/logo.png"} />
        <meta property="og:site_name" content="DamiTV" />
        
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content={`https://damitv.pro/manual-match/${match.id}`} />
        <meta property="twitter:title" content={seoTitle} />
        <meta property="twitter:description" content={seoDescription} />
        <meta property="twitter:image" content={match.image || "https://damitv.pro/logo.png"} />
        
        <meta name="robots" content="index, follow" />
        <meta name="author" content="DamiTV" />
        <meta name="category" content={match.seo?.category || "Sports"} />
        <meta name="coverage" content="Worldwide" />
        <meta name="distribution" content="Global" />
        <meta name="rating" content="General" />
        
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>
      
      <div className="bg-[#242836] border-b border-[#343a4d] p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="text-gray-400 hover:text-white hover:bg-[#343a4d]"
            >
              <ArrowLeft size={20} />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-white">
                {match.title}
              </h1>
              <p className="text-sm text-gray-400">{match.title} on damitv.pro</p>
              {selectedLink && (
                <p className="text-xs text-[#9b87f5]">
                  {selectedLink.name} {selectedLink.quality && `(${selectedLink.quality})`}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleFullscreen}
              className="text-gray-400 hover:text-white hover:bg-[#343a4d]"
              title="Fullscreen"
            >
              <Maximize2 size={18} />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-2 sm:p-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
          <div className="lg:col-span-3">
            <div className="bg-[#242836] rounded-lg overflow-hidden border border-[#343a4d]">
              <div className="bg-[#1a1f2e] p-2 sm:p-3 border-b border-[#343a4d]">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <span className="text-white font-semibold text-sm sm:text-base">{match.title}</span>
                  <div className="flex items-center gap-2">
                    <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1">
                      <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                      LIVE
                    </span>
                    <div className="text-xs sm:text-sm text-gray-400 hidden sm:block">
                      {formattedDate} at {formattedTime}
                    </div>
                  </div>
                </div>
              </div>

              {selectedLink && (
                <div className="bg-[#242836] px-2 sm:px-4 py-1 border-b border-[#343a4d]">
                  <h2 className="text-sm sm:text-base font-medium text-white text-center">
                    {selectedLink.name}
                  </h2>
                </div>
              )}
              
              {/* Video Player Container */}
              <div className="relative w-full bg-black" style={{ paddingTop: '56.25%' }}>
                <div className="absolute inset-0">
                  {selectedLink ? (
                    <VideoPlayerSelector
                      src={selectedLink.url}
                      onLoad={handleVideoLoad}
                      onError={handleVideoError}
                      videoRef={videoRef}
                      title={`${match.title} Stream`}
                      isManualChannel={true}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-white">
                      <p>No stream available</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Match Details Below Player */}
              <div className="p-4">
                <MatchDetails 
                  match={match}
                  isLive={true}
                  showCompact={false}
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-[#242836] rounded-lg border border-[#343a4d] p-3 sm:p-4">
              <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Stream Sources</h3>
              <div className="space-y-2">
                {match.links.map((link) => (
                  <Button
                    key={link.id}
                    onClick={() => setSelectedLink(link)}
                    variant={selectedLink?.id === link.id ? "default" : "outline"}
                    className={`w-full justify-start text-left text-sm ${
                      selectedLink?.id === link.id
                        ? "bg-[#ff5a36] hover:bg-[#e64d2e] text-white"
                        : "bg-transparent border-[#343a4d] text-gray-300 hover:bg-[#343a4d] hover:text-white"
                    }`}
                  >
                    <Play size={14} className="mr-2 flex-shrink-0" />
                    <div className="flex flex-col items-start min-w-0">
                      <span className="font-medium truncate w-full">{link.name}</span>
                      {link.quality && (
                        <span className="text-xs opacity-75">{link.quality}</span>
                      )}
                    </div>
                  </Button>
                ))}
              </div>
              
              <div className="mt-4 sm:mt-6 pt-4 border-t border-[#343a4d]">
                <h4 className="text-sm sm:text-md font-semibold text-white mb-2">Match Details</h4>
                <div className="space-y-2 text-xs sm:text-sm text-gray-400">
                  <p><span className="text-white">Title:</span> {match.title}</p>
                  <p><span className="text-white">Date:</span> {formattedDate}</p>
                  <p><span className="text-white">Time:</span> {formattedTime}</p>
                  {match.seo?.category && (
                    <p><span className="text-white">Category:</span> {match.seo.category}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManualMatchPlayer;
