import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Play, Radio, Tv, Users } from 'lucide-react';
import { useCDNChannelEvents, CDNChannelEvent } from '@/hooks/useCDNChannelEvents';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { triggerPopunderAd } from '@/utils/popunderAd';

// Channel card component
const ChannelEventCard: React.FC<{ channel: CDNChannelEvent }> = ({ channel }) => {
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // Trigger popunder ad on click
    triggerPopunderAd(channel.id, 'cdn_channel_click');
    // Navigate to CDN channel player
    navigate(`/cdn-player/${encodeURIComponent(channel.id)}`);
  };

  return (
    <div onClick={handleClick} className="flex-shrink-0 w-[180px] md:w-[220px] group cursor-pointer">
      <div className="relative bg-card rounded-xl overflow-hidden border border-border hover:border-primary/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
        {/* Channel Logo/Image */}
        <div className="relative h-24 md:h-28 bg-gradient-to-br from-primary/20 to-muted overflow-hidden flex items-center justify-center">
          {channel.logo ? (
            <img 
              src={channel.logo} 
              alt={channel.title} 
              className="w-full h-full object-contain p-3"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <Tv className="w-12 h-12 text-muted-foreground/50" />
          )}

          {/* Live Badge */}
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            <Radio className="w-3 h-3 animate-pulse" />
            LIVE
          </div>

          {/* Country Badge */}
          <div className="absolute top-2 right-2 bg-black/60 text-white text-xs font-medium px-2 py-0.5 rounded">
            {channel.country}
          </div>

          {/* Play overlay on hover */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="bg-primary rounded-full p-3">
              <Play className="w-6 h-6 text-primary-foreground fill-current" />
            </div>
          </div>
        </div>

        {/* Channel Info */}
        <div className="p-3">
          <h3 className="text-sm font-semibold text-foreground line-clamp-1 mb-1">
            {channel.title}
          </h3>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {channel.viewers.toLocaleString()}
            </span>
            <span>TV Channel</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const CDNEventsCarousel: React.FC = () => {
  const { channels, isLoading, error } = useCDNChannelEvents(20);
  
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: 'start', slidesToScroll: 1, dragFree: true },
    [Autoplay({ delay: 4000, stopOnInteraction: true })]
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
          <div className="h-6 w-40 bg-muted rounded animate-pulse" />
        </div>
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex-shrink-0 w-[180px] md:w-[220px] h-[160px] bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Don't render if no channels or error
  if (error || channels.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Tv className="w-5 h-5 text-primary" />
          <h2 className="text-lg md:text-xl font-bold text-foreground">
            Live TV Channels
          </h2>
          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-medium">
            {channels.length} Live
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
          {channels.map((channel) => (
            <ChannelEventCard key={channel.id} channel={channel} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default CDNEventsCarousel;
