import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useIsMobile } from '../../hooks/use-mobile';
import { Home, Loader2, Shield, Play } from 'lucide-react';
import { Button } from '../ui/button';
import { useNavigate } from 'react-router-dom';
import { Match } from '../../types/sports';
import { ManualMatch } from '../../types/manualMatch';
import { removeAdsFromIframe, setupDelayedAdBlocking, injectAdBlockStyles } from '../../utils/adBlocker';

interface IframeVideoPlayerProps {
  src: string;
  onLoad: () => void;
  onError: () => void;
  title?: string;
  matchStartTime?: number | Date | null;
  match?: Match | ManualMatch | null;
}

// Number of clicks to absorb before allowing through to iframe
const CLICKS_TO_ABSORB = 3;

const IframeVideoPlayer: React.FC<IframeVideoPlayerProps> = ({ src, onLoad, onError, title, matchStartTime, match }) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSrc, setLastSrc] = useState('');
  const [reloadCount, setReloadCount] = useState(0);
  const [countdown, setCountdown] = useState<string>('');
  
  // Pop-up blocker state
  const [clicksAbsorbed, setClicksAbsorbed] = useState(0);
  const [showOverlay, setShowOverlay] = useState(true);
  const [overlayMessage, setOverlayMessage] = useState('Tap to play');
  
  // Global popup blocker for mobile - blocks window.open calls
  useEffect(() => {
    if (!isMobile) return;
    
    const originalOpen = window.open;
    
    // Block popup windows on mobile
    window.open = function(...args) {
      console.log('🛡️ Mobile popup blocked:', args[0]);
      return null;
    };
    
    // Block touch-triggered popups
    const blockPopupEvent = (e: Event) => {
      const target = e.target as HTMLElement;
      // If click is outside our controlled elements, it might be an ad trigger
      if (target.tagName === 'A' && target.getAttribute('target') === '_blank') {
        e.preventDefault();
        e.stopPropagation();
        console.log('🛡️ Mobile: Blocked external link popup');
      }
    };
    
    document.addEventListener('click', blockPopupEvent, true);
    document.addEventListener('touchend', blockPopupEvent, true);
    
    return () => {
      window.open = originalOpen;
      document.removeEventListener('click', blockPopupEvent, true);
      document.removeEventListener('touchend', blockPopupEvent, true);
    };
  }, [isMobile]);
  
  // Handle overlay clicks - absorb first few clicks to block pop-ups
  const handleOverlayClick = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const newCount = clicksAbsorbed + 1;
    setClicksAbsorbed(newCount);
    
    if (newCount >= CLICKS_TO_ABSORB) {
      // All ad-triggering clicks absorbed, allow through
      setShowOverlay(false);
      console.log('🛡️ Pop-up blocker: All ad clicks absorbed, playing stream');
    } else {
      // Show progress message
      const remaining = CLICKS_TO_ABSORB - newCount;
      const action = isMobile ? 'Tap' : 'Click';
      setOverlayMessage(remaining === 1 ? `${action} once more to play` : `${action} ${remaining} more times to play`);
      console.log(`🛡️ Pop-up blocker: Absorbed click ${newCount}/${CLICKS_TO_ABSORB}`);
    }
  }, [clicksAbsorbed, isMobile]);
  
  // Reset overlay when source changes
  useEffect(() => {
    setClicksAbsorbed(0);
    setShowOverlay(true);
    setOverlayMessage(isMobile ? 'Tap to play' : 'Click to play');
  }, [src, isMobile]);

  // Calculate countdown for upcoming matches
  useEffect(() => {
    if (!matchStartTime) {
      setCountdown('');
      return;
    }

    const matchDate = typeof matchStartTime === 'number' ? matchStartTime : new Date(matchStartTime).getTime();

    if (matchDate <= Date.now()) {
      setCountdown('');
      return;
    }

    const updateCountdown = () => {
      const now = Date.now();
      const timeUntilMatch = matchDate - now;

      if (timeUntilMatch <= 0) {
        setCountdown('');
        return;
      }

      const days = Math.floor(timeUntilMatch / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeUntilMatch % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeUntilMatch % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeUntilMatch % (1000 * 60)) / 1000);

      if (days > 0) {
        setCountdown(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setCountdown(`${hours}h ${minutes}m ${seconds}s`);
      } else if (minutes > 0) {
        setCountdown(`${minutes}m ${seconds}s`);
      } else {
        setCountdown(`${seconds}s`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [matchStartTime]);

  // Handle home navigation
  const handleHomeClick = () => {
    console.log('DAMITV home button clicked from iframe player');
    navigate('/');
  };


  // Handle iframe load success with ad blocking
  const handleIframeLoad = () => {
    console.log('✅ Iframe content loaded');
    setIsLoading(false);
    onLoad();
    
    // Apply ad blocking on iframe load
    if (iframeRef.current) {
      removeAdsFromIframe(iframeRef.current);
      injectAdBlockStyles(iframeRef.current);
      setupDelayedAdBlocking(iframeRef.current, () => {
        console.log('🎬 Stream ready with ad blocking applied');
      });
    }
  };

  // Handle iframe load error
  const handleIframeError = () => {
    console.error('❌ Iframe failed to load');
    setIsLoading(false);
    onError();
  };

  // Smart iframe reloading - only when src actually changes and with proper delay
  useEffect(() => {
    if (!src || src === lastSrc) return;
    
    console.log('🔄 Stream URL changed, reloading iframe...');
    setLastSrc(src);
    setIsLoading(true);
    setReloadCount(prev => prev + 1);
    
    if (iframeRef.current) {
      // Clear existing src first
      iframeRef.current.src = 'about:blank';
      
      // Wait longer before setting new src to ensure clean reload
      setTimeout(() => {
        if (iframeRef.current && src) {
          console.log('🎯 Setting new iframe src:', src.substring(0, 80) + '...');
          iframeRef.current.src = src;
        }
      }, 300); // Increased delay for better reliability
    }
  }, [src, lastSrc]);

  // Timeout handling with longer duration for streaming content
  useEffect(() => {
    if (!isLoading) return;
    
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.log('⏰ Iframe load timeout - assuming successful');
        setIsLoading(false);
        onLoad(); // Assume success after reasonable wait time
      }
    }, 15000); // Increased to 15 seconds for streaming content

    return () => clearTimeout(timeout);
  }, [isLoading, onLoad, reloadCount]);

  // Auto-hide controls
  useEffect(() => {
    if (!showControls) return;
    
    const timer = setTimeout(() => {
      setShowControls(false);
    }, 5000); // Increased to 5 seconds

    const handleMouseMove = () => {
      setShowControls(true);
    };

    const container = iframeRef.current?.parentElement;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      return () => {
        container.removeEventListener('mousemove', handleMouseMove);
        clearTimeout(timer);
      };
    }

    return () => clearTimeout(timer);
  }, [showControls]);

  // Parse countdown into separate parts for styled display
  const parseCountdown = () => {
    const countdownParts = countdown.split(/[hms\s]+/).filter(Boolean);
    const hasHours = countdown.includes('h');
    const hasMinutes = countdown.includes('m');
    const hasDays = countdown.includes('d');
    
    let hours = '00', minutes = '00', seconds = '00';
    if (hasDays) {
      hours = countdownParts[1]?.padStart(2, '0') || '00';
      minutes = countdownParts[2]?.padStart(2, '0') || '00';
      seconds = '00';
    } else if (hasHours) {
      hours = countdownParts[0]?.padStart(2, '0') || '00';
      minutes = countdownParts[1]?.padStart(2, '0') || '00';
      seconds = countdownParts[2]?.padStart(2, '0') || '00';
    } else if (hasMinutes) {
      hours = '00';
      minutes = countdownParts[0]?.padStart(2, '0') || '00';
      seconds = countdownParts[1]?.padStart(2, '0') || '00';
    } else {
      seconds = countdownParts[0]?.padStart(2, '0') || '00';
    }
    
    return { hours, minutes, seconds };
  };

  const { hours, minutes, seconds } = parseCountdown();

  // Get team info from match
  const homeTeam = match && 'teams' in match ? match.teams?.home : null;
  const awayTeam = match && 'teams' in match ? match.teams?.away : null;
  const tournament = match && 'tournament' in match ? match.tournament : null;

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      {/* Countdown Display - Mobile-friendly design */}
      {countdown && matchStartTime && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-gradient-to-br from-[#0f1419] via-[#1a1f2e] to-[#0f1419]">
          {/* Background decoration - colorful blurs */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-20 -left-20 w-40 h-40 sm:w-64 sm:h-64 bg-blue-600/30 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -right-20 w-40 h-40 sm:w-64 sm:h-64 bg-red-500/20 rounded-full blur-3xl" />
            <div className="absolute top-1/2 right-0 w-32 h-32 sm:w-48 sm:h-48 bg-purple-500/20 rounded-full blur-3xl" />
          </div>
          
          <div className="text-center text-white p-3 sm:p-6 z-10 w-full max-w-lg">
            {/* Watch Live In */}
            <p className="text-xs sm:text-sm text-gray-300 mb-2 sm:mb-3 tracking-wide">Watch Live In</p>
            
            {/* Countdown Timer Boxes */}
            <div className="flex items-center justify-center gap-1 sm:gap-2 mb-4 sm:mb-6">
              <div className="bg-white text-black font-bold text-xl sm:text-3xl md:text-4xl px-2 sm:px-4 py-1 sm:py-2 rounded-md min-w-[40px] sm:min-w-[60px]">
                {hours}
              </div>
              <span className="text-white text-xl sm:text-3xl font-bold">:</span>
              <div className="bg-white text-black font-bold text-xl sm:text-3xl md:text-4xl px-2 sm:px-4 py-1 sm:py-2 rounded-md min-w-[40px] sm:min-w-[60px]">
                {minutes}
              </div>
              <span className="text-white text-xl sm:text-3xl font-bold">:</span>
              <div className="bg-white text-black font-bold text-xl sm:text-3xl md:text-4xl px-2 sm:px-4 py-1 sm:py-2 rounded-md min-w-[40px] sm:min-w-[60px]">
                {seconds}
              </div>
            </div>

            {/* Tournament/League Name */}
            {tournament && (
              <p className="text-xs sm:text-sm text-gray-400 mb-3 sm:mb-4 line-clamp-1">
                {typeof tournament === 'string' ? tournament : (tournament as { name?: string })?.name || ''}
              </p>
            )}

            {/* Teams Display */}
            {(homeTeam || awayTeam) && (
              <div className="flex items-center justify-center gap-2 sm:gap-4 mb-3 sm:mb-4">
                {/* Home Team */}
                <div className="flex flex-col items-center gap-1 sm:gap-2 flex-1 min-w-0">
                  {typeof homeTeam === 'object' && homeTeam?.badge && (
                    <img 
                      src={homeTeam.badge} 
                      alt={homeTeam.name || 'Home'} 
                      className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 object-contain"
                      onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                    />
                  )}
                  <span className="text-white text-xs sm:text-sm font-medium text-center line-clamp-2 max-w-[80px] sm:max-w-[100px]">
                    {typeof homeTeam === 'object' ? homeTeam?.name : homeTeam}
                  </span>
                </div>

                {/* VS Separator */}
                <div className="bg-orange-500 text-white font-bold text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-md flex-shrink-0">
                  Vs
                </div>

                {/* Away Team */}
                <div className="flex flex-col items-center gap-1 sm:gap-2 flex-1 min-w-0">
                  {typeof awayTeam === 'object' && awayTeam?.badge && (
                    <img 
                      src={awayTeam.badge} 
                      alt={awayTeam.name || 'Away'} 
                      className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 object-contain"
                      onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                    />
                  )}
                  <span className="text-white text-xs sm:text-sm font-medium text-center line-clamp-2 max-w-[80px] sm:max-w-[100px]">
                    {typeof awayTeam === 'object' ? awayTeam?.name : awayTeam}
                  </span>
                </div>
              </div>
            )}

            {/* Match Title (if no teams) */}
            {title && !homeTeam && !awayTeam && (
              <p className="text-sm sm:text-base text-white/80 font-semibold line-clamp-2">
                {title}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Branded Loading State with Spinner */}
      {isLoading && !countdown && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gradient-to-br from-background via-muted to-background">
          <div className="relative">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-primary/20" />
          </div>
          <p className="mt-4 text-foreground font-medium">Loading stream...</p>
          <p className="text-muted-foreground text-sm mt-1">DAMITV</p>
          <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
            <Shield className="w-4 h-4 text-green-500" />
            <span>Ad blocker active</span>
          </div>
        </div>
      )}

      <iframe 
        ref={iframeRef}
        className="w-full h-full absolute inset-0"
        allowFullScreen
        title={title || "Live Stream"}
        onLoad={handleIframeLoad}
        onError={handleIframeError}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
        referrerPolicy="no-referrer"
        loading="lazy"
        style={{ 
          border: 'none',
          pointerEvents: showOverlay ? 'none' : 'auto'
        }}
      />
      
      {/* Pop-up Blocker Overlay - Absorbs first clicks/taps that trigger ads */}
      {showOverlay && !isLoading && !countdown && (
        <div 
          className="absolute inset-0 z-40 cursor-pointer flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity touch-manipulation"
          onClick={handleOverlayClick}
          onTouchEnd={handleOverlayClick}
        >
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Shield className="w-8 h-8 text-green-400" />
              <span className="text-white font-bold text-lg">Ad Blocker Active</span>
            </div>
            <div className="bg-primary/90 hover:bg-primary active:bg-primary/80 text-primary-foreground px-6 py-3 rounded-lg flex items-center gap-2 mx-auto cursor-pointer transition-colors select-none">
              <Play className="w-5 h-5" />
              <span className="font-medium">{overlayMessage}</span>
            </div>
            <p className="text-white/60 text-xs mt-3">
              {clicksAbsorbed > 0 
                ? `${CLICKS_TO_ABSORB - clicksAbsorbed} ${isMobile ? 'taps' : 'clicks'} remaining` 
                : 'Blocking pop-up ads...'}
            </p>
          </div>
        </div>
      )}

      {/* Always Visible DAMITV Home Button - Top Center */}
      <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-50">
        <Button
          variant="ghost"
          onClick={handleHomeClick}
          className="bg-black/80 hover:bg-black/90 text-white px-2 py-1 h-7 flex items-center gap-1 border border-white/20 shadow-lg"
          title="Go to DAMITV Home"
        >
          <Home className="h-3 w-3" />
          <span className="font-bold text-xs">DAMITV</span>
        </Button>
      </div>

      {/* Match Title with Team Logos - Bottom of Player */}
      {match && 'teams' in match && match.teams && (
        <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 z-40">
          <div className="bg-black/80 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center gap-2 border border-white/10">
            {/* Home team logo - only for Match type with Team objects */}
            {typeof match.teams.home === 'object' && match.teams.home?.badge && (
              <img 
                src={match.teams.home.badge} 
                alt={match.teams.home.name || 'Home'} 
                className="w-5 h-5 object-contain"
                onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
              />
            )}
            <span className="text-white text-xs font-medium max-w-[200px] truncate">
              {title || match.title}
            </span>
            {/* Away team logo - only for Match type with Team objects */}
            {typeof match.teams.away === 'object' && match.teams.away?.badge && (
              <img 
                src={match.teams.away.badge} 
                alt={match.teams.away.name || 'Away'} 
                className="w-5 h-5 object-contain"
                onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
              />
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default IframeVideoPlayer;
