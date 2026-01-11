import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Play, Radio } from 'lucide-react';
import { useSportsData } from '@/contexts/SportsDataContext';
import { Match } from '@/types/sports';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { triggerPopunderAd } from '@/utils/popunderAd';
import { getBohoImageUrl, getTeamBadgeUrl } from '@/api/sportsApi';

const CDNEventCard: React.FC<{ match: Match }> = ({ match }) => {
  const navigate = useNavigate();
  
  // Get the first source to build embed URL
  const firstSource = match.sources?.[0];
  const sportSlug = (match.sportId || match.category || 'football').toLowerCase().replace(/\s+/g, '-');
  
  // Build channel-style URL for CDN events
  const channelUrl = `/channel/${sportSlug}/${match.id}`;

  // Handle card click with popunder ad
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // Trigger popunder ad on click
    triggerPopunderAd(match.id, 'cdn_event_click');
    // Navigate to channel player
    navigate(channelUrl);
  };

  // Get team badges
  const homeBadge = match.teams?.home?.badge ? getTeamBadgeUrl(match.teams.home.badge) : null;
  const awayBadge = match.teams?.away?.badge ? getTeamBadgeUrl(match.teams.away.badge) : null;
  const hasBadges = homeBadge || awayBadge;
  
  // Get poster image
  const posterUrl = match.poster ? getBohoImageUrl(match.poster) : null;

  // Format time
  const matchTime = new Date(match.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Check if live
  const now = Date.now();
  const isLive = match.date <= now && match.date > now - (3 * 60 * 60 * 1000);

  return (
    <div
      onClick={handleClick}
      className="flex-shrink-0 w-[200px] md:w-[240px] group cursor-pointer"
    >
      <div className="relative bg-card rounded-xl overflow-hidden border border-border hover:border-primary/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
        {/* Event Image/Poster */}
        <div className="relative h-28 md:h-32 bg-gradient-to-br from-primary/20 to-muted overflow-hidden">
          {posterUrl ? (
            <img
              src={posterUrl}
              alt={match.title}
              className="w-full h-full object-contain"
              loading="lazy"
            />
          ) : hasBadges ? (
            <div className="flex items-center justify-center h-full gap-3 px-4">
              {homeBadge && (
                <img
                  src={homeBadge}
                  alt={match.teams?.home?.name || 'Home'}
                  className="w-12 h-12 md:w-14 md:h-14 object-contain"
                  loading="lazy"
                />
              )}
              <span className="text-muted-foreground font-bold text-sm">VS</span>
              {awayBadge && (
                <img
                  src={awayBadge}
                  alt={match.teams?.away?.name || 'Away'}
                  className="w-12 h-12 md:w-14 md:h-14 object-contain"
                  loading="lazy"
                />
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <Play className="w-10 h-10 text-muted-foreground/50" />
            </div>
          )}

          {/* Live Badge */}
          {isLive && (
            <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              <Radio className="w-3 h-3 animate-pulse" />
              LIVE
            </div>
          )}

          {/* Play overlay on hover */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="bg-primary rounded-full p-3">
              <Play className="w-6 h-6 text-primary-foreground fill-current" />
            </div>
          </div>
        </div>

        {/* Event Info */}
        <div className="p-3">
          <h3 className="text-sm font-semibold text-foreground line-clamp-2 mb-1">
            {match.title}
          </h3>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="capitalize">{match.sportId || match.category || 'Sports'}</span>
            <span>{matchTime}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const CDNEventsCarousel: React.FC = () => {
  const { liveMatches, loading } = useSportsData();
  
  // Get featured events from live matches
  const events = useMemo(() => {
    return liveMatches
      .filter(m => m.sources && m.sources.length > 0)
      .slice(0, 15);
  }, [liveMatches]);
  
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { 
      loop: true, 
      align: 'start',
      slidesToScroll: 1,
      dragFree: true
    },
    [Autoplay({ delay: 4000, stopOnInteraction: true })]
  );

  const scrollPrev = React.useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = React.useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  // Loading skeleton
  if (loading) {
    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 w-40 bg-muted rounded animate-pulse" />
        </div>
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex-shrink-0 w-[200px] md:w-[240px] h-[180px] bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Don't render if no events
  if (events.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Radio className="w-5 h-5 text-primary animate-pulse" />
          <h2 className="text-lg md:text-xl font-bold text-foreground">
            Live Events
          </h2>
          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-medium">
            {events.length} Live
          </span>
        </div>
        
        {/* Navigation Arrows */}
        <div className="flex gap-2">
          <button
            onClick={scrollPrev}
            className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
            aria-label="Previous"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={scrollNext}
            className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
            aria-label="Next"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Carousel */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4">
          {events.map((match) => (
            <CDNEventCard key={match.id} match={match} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default CDNEventsCarousel;
