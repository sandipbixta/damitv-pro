import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Play, Radio, Trophy, Users, Tv } from 'lucide-react';
import { useLiveMatchesWithChannels, LiveMatchWithChannels } from '@/hooks/useLiveMatchesWithChannels';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { triggerPopunderAd } from '@/utils/popunderAd';

// Live match card with channels
const LiveMatchCard: React.FC<{ match: LiveMatchWithChannels }> = ({ match }) => {
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    triggerPopunderAd(match.id, 'live_match_click');
    // Navigate to match player with first channel
    if (match.channels.length > 0) {
      const channelId = encodeURIComponent(match.channels[0].id);
      navigate(`/cdn-player/${channelId}?match=${encodeURIComponent(match.id)}`);
    }
  };

  const sportEmoji = {
    'soccer': '⚽',
    'football': '⚽',
    'basketball': '🏀',
    'american football': '🏈',
    'ice hockey': '🏒',
    'baseball': '⚾',
    'tennis': '🎾',
    'cricket': '🏏',
    'rugby': '🏉',
    'motorsport': '🏎️',
    'boxing': '🥊',
    'mma': '🥋',
  }[match.sport.toLowerCase()] || '🏆';

  return (
    <div onClick={handleClick} className="flex-shrink-0 w-[280px] md:w-[320px] group cursor-pointer">
      <div className="relative bg-card rounded-xl overflow-hidden border border-border hover:border-primary/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
        {/* Match Header */}
        <div className="relative bg-gradient-to-br from-primary/20 via-background to-muted p-4">
          {/* Live Badge */}
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            <Radio className="w-3 h-3 animate-pulse" />
            LIVE
          </div>

          {/* Sport Badge */}
          <div className="absolute top-2 right-2 text-lg">
            {sportEmoji}
          </div>

          {/* Teams Display */}
          <div className="flex items-center justify-between mt-6 mb-2">
            {/* Home Team */}
            <div className="flex flex-col items-center flex-1">
              {match.homeBadge ? (
                <img 
                  src={match.homeBadge} 
                  alt={match.homeTeam}
                  className="w-12 h-12 object-contain mb-1"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-1">
                  <Trophy className="w-6 h-6 text-muted-foreground" />
                </div>
              )}
              <span className="text-xs font-medium text-foreground text-center line-clamp-1 max-w-[80px]">
                {match.homeTeam}
              </span>
            </div>

            {/* Score */}
            <div className="flex flex-col items-center px-3">
              <div className="text-xl font-bold text-foreground">
                {match.homeScore ?? '-'} : {match.awayScore ?? '-'}
              </div>
              <span className="text-xs text-primary font-medium">
                {match.progress || match.status}
              </span>
            </div>

            {/* Away Team */}
            <div className="flex flex-col items-center flex-1">
              {match.awayBadge ? (
                <img 
                  src={match.awayBadge} 
                  alt={match.awayTeam}
                  className="w-12 h-12 object-contain mb-1"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-1">
                  <Trophy className="w-6 h-6 text-muted-foreground" />
                </div>
              )}
              <span className="text-xs font-medium text-foreground text-center line-clamp-1 max-w-[80px]">
                {match.awayTeam}
              </span>
            </div>
          </div>

          {/* Play overlay on hover */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="bg-primary rounded-full p-3">
              <Play className="w-6 h-6 text-primary-foreground fill-current" />
            </div>
          </div>
        </div>

        {/* Match Info */}
        <div className="p-3 border-t border-border">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span className="flex items-center gap-1 truncate max-w-[60%]">
              <Trophy className="w-3 h-3" />
              {match.league}
            </span>
            <span className="capitalize">{match.sport}</span>
          </div>

          {/* Available Channels - Show actual broadcasters */}
          {match.channels.length > 0 ? (
            <div className="flex items-center gap-1 flex-wrap">
              <Tv className="w-3 h-3 text-primary" />
              {match.channels.slice(0, 3).map((channel) => (
                <span 
                  key={channel.id}
                  className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded font-medium"
                >
                  {channel.name.length > 15 ? channel.name.slice(0, 15) + '...' : channel.name}
                </span>
              ))}
              {match.channels.length > 3 && (
                <span className="text-xs text-primary">
                  +{match.channels.length - 3}
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Tv className="w-3 h-3" />
              <span>No broadcast info</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const LiveMatchesCarousel: React.FC = () => {
  const { matches, isLoading, error } = useLiveMatchesWithChannels(undefined, 20);

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: 'start', slidesToScroll: 1, dragFree: true },
    [Autoplay({ delay: 5000, stopOnInteraction: true })]
  );

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 w-48 bg-muted rounded animate-pulse" />
        </div>
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex-shrink-0 w-[280px] md:w-[320px] h-[200px] bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Don't render if no matches or error
  if (error || matches.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Radio className="w-5 h-5 text-red-500 animate-pulse" />
          <h2 className="text-lg md:text-xl font-bold text-foreground">
            Live Now
          </h2>
          <span className="text-xs bg-red-500/20 text-red-500 px-2 py-0.5 rounded-full font-medium">
            {matches.length} Live
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
          {matches.map((match) => (
            <LiveMatchCard key={match.id} match={match} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default LiveMatchesCarousel;
