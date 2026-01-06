import React, { useRef, useEffect, useState } from 'react';
import { useIsMobile } from '../../hooks/use-mobile';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '../ui/button';
import { useNavigate } from 'react-router-dom';
import { Match } from '../../types/sports';
import { ManualMatch } from '../../types/manualMatch';
import { getBohoImageUrl } from '../../api/sportsApi';
import { removeAdsFromIframe, setupDelayedAdBlocking, injectAdBlockStyles } from '../../utils/adBlocker';
import { buildFallbackEmbedUrl } from '../../services/bohoSportApi';

interface IframeVideoPlayerProps {
  src: string;
  fallbackSrc?: string;
  onLoad: () => void;
  onError: () => void;
  title?: string;
  matchStartTime?: number | Date | null;
  match?: Match | ManualMatch | null;
}

const IframeVideoPlayer: React.FC<IframeVideoPlayerProps> = ({ src, fallbackSrc, onLoad, onError, title, matchStartTime, match }) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSrc, setLastSrc] = useState('');
  const [reloadCount, setReloadCount] = useState(0);
  const [countdown, setCountdown] = useState<string>('');
  const [currentSrc, setCurrentSrc] = useState(src);
  const [hasTriedFallback, setHasTriedFallback] = useState(false);
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

  // Handle iframe load error - try fallback first
  const handleIframeError = () => {
    console.error('❌ Iframe failed to load:', currentSrc);
    
    // Try fallback URL if available and not already tried
    if (fallbackSrc && !hasTriedFallback) {
      console.log('🔄 Primary stream failed, switching to fallback:', fallbackSrc);
      setHasTriedFallback(true);
      setCurrentSrc(fallbackSrc);
      setIsLoading(true);
      return;
    }
    
    setIsLoading(false);
    onError();
  };

  // Reset fallback state when src changes
  useEffect(() => {
    if (src !== lastSrc) {
      setHasTriedFallback(false);
      setCurrentSrc(src);
    }
  }, [src, lastSrc]);

  // Smart iframe reloading - only when currentSrc actually changes and with proper delay
  useEffect(() => {
    if (!currentSrc || currentSrc === lastSrc) return;
    
    console.log('🔄 Stream URL changed, reloading iframe...');
    setLastSrc(currentSrc);
    setIsLoading(true);
    setReloadCount(prev => prev + 1);
    
    if (iframeRef.current) {
      // Clear existing src first
      iframeRef.current.src = 'about:blank';
      
      // Wait longer before setting new src to ensure clean reload
      setTimeout(() => {
        if (iframeRef.current && currentSrc) {
          console.log('🎯 Setting new iframe src:', currentSrc.substring(0, 80) + '...');
          iframeRef.current.src = currentSrc;
        }
      }, 300);
    }
  }, [currentSrc, lastSrc]);

  // Timeout handling with longer duration for streaming content
  useEffect(() => {
    if (!isLoading) return;
    
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.log('⏰ Iframe load timeout - assuming successful');
        setIsLoading(false);
        onLoad();
      }
    }, 15000);

    return () => clearTimeout(timeout);
  }, [isLoading, onLoad, reloadCount]);

  // Auto-hide controls
  useEffect(() => {
    if (!showControls) return;
    
    const timer = setTimeout(() => {
      setShowControls(false);
    }, 5000);

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
  const matchPoster = match && 'poster' in match ? match.poster : null;

  // Format the match start time for display
  const formattedDateTime = matchStartTime 
    ? format(typeof matchStartTime === 'number' ? new Date(matchStartTime) : matchStartTime, "d MMM, h:mm a")
    : '';

  // Get home and away team names
  const homeTeamName = typeof homeTeam === 'object' ? homeTeam?.name : homeTeam || '';
  const awayTeamName = typeof awayTeam === 'object' ? awayTeam?.name : awayTeam || '';

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      {/* Countdown Display - Styled like reference image */}
      {countdown && matchStartTime && (
        <div className="absolute inset-0 z-30 overflow-hidden">
          {/* Background with gradient and match poster */}
          <div className="absolute inset-0">
            {/* Match poster as background if available */}
            {matchPoster && (
              <img 
                src={typeof matchPoster === 'string' ? getBohoImageUrl(matchPoster) : ''}
                alt=""
                className="absolute inset-0 w-full h-full object-cover opacity-40"
                onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
              />
            )}
            {/* Gradient overlay - Pink/Red to Blue like reference */}
            <div className="absolute inset-0 bg-gradient-to-r from-rose-600/80 via-purple-600/60 to-blue-600/80" />
            {/* Dark overlay for text readability */}
            <div className="absolute inset-0 bg-black/30" />
            {/* Diagonal lines pattern overlay */}
            <div 
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, white 2px, white 3px)',
              }}
            />
          </div>
          
          {/* Content positioned bottom-left like reference */}
          <div className="absolute bottom-0 left-0 p-6 sm:p-8 md:p-12 z-10 max-w-2xl">
            {/* WATCH LIVE label */}
            <p className="text-white/80 text-xs sm:text-sm font-medium tracking-widest uppercase mb-2">
              WATCH LIVE
            </p>
            
            {/* Date and Time */}
            <p className="text-white text-lg sm:text-xl md:text-2xl font-semibold mb-4">
              {formattedDateTime}
            </p>
            
            {/* Team Names */}
            {(homeTeamName || awayTeamName) ? (
              <div className="space-y-1">
                <h2 className="text-white text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
                  {homeTeamName}
                </h2>
                <div className="flex items-center gap-3">
                  <span className="text-white/60 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light italic">Vs</span>
                  <h2 className="text-white text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
                    {awayTeamName}
                  </h2>
                </div>
              </div>
            ) : title ? (
              <h2 className="text-white text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
                {title}
              </h2>
            ) : null}
            
            {/* Tournament/League Name */}
            {tournament && (
              <p className="text-white/70 text-sm sm:text-base mt-4 font-medium">
                {typeof tournament === 'string' ? tournament : (tournament as { name?: string })?.name || ''}
              </p>
            )}
            
            {/* Countdown timer - smaller, bottom */}
            <div className="flex items-center gap-2 mt-6 bg-black/40 backdrop-blur-sm rounded-lg px-4 py-2 w-fit">
              <span className="text-white/70 text-xs uppercase tracking-wide">Starts in:</span>
              <span className="text-white font-bold text-sm sm:text-base font-mono">
                {hours}:{minutes}:{seconds}
              </span>
            </div>
          </div>
          
          {/* League logo at top center if available */}
          {tournament && typeof tournament === 'object' && (tournament as any).logo && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10">
              <img 
                src={(tournament as any).logo}
                alt=""
                className="h-12 sm:h-16 md:h-20 object-contain"
                onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
              />
            </div>
          )}
        </div>
      )}

      {/* Premium Loading State */}
      {isLoading && !countdown && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gradient-to-br from-[#0a0a0a] via-[#111111] to-[#0a0a0a]">
          {/* Animated rings */}
          <div className="relative">
            <div className="absolute inset-0 w-16 h-16 rounded-full border-2 border-primary/30 animate-ping" />
            <div className="absolute inset-0 w-16 h-16 rounded-full border border-primary/20" />
            <div className="relative w-16 h-16 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          </div>
          <p className="mt-6 text-white/90 font-semibold text-sm tracking-wide">Connecting to stream...</p>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
            <p className="text-white/40 text-xs font-medium uppercase tracking-widest">DAMITV</p>
          </div>
        </div>
      )}

      <iframe 
        ref={iframeRef}
        src={currentSrc}
        className="w-full h-full absolute inset-0"
        allowFullScreen
        title={title || "Live Stream"}
        onLoad={handleIframeLoad}
        onError={handleIframeError}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
        loading="eager"
        style={{ 
          border: 'none'
        }}
      />
    </div>
  );
};

export default IframeVideoPlayer;
