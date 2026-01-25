import React, { useEffect, useState, useRef } from 'react';
import { useFeaturedChannels } from '../hooks/useCDNChannels';
import ChannelCard from './ChannelCard';
import { ArrowRight, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Link } from 'react-router-dom';
import { getNowPlaying, hasEPGSupport } from '../services/epgService';

const FeaturedChannels = () => {
  const { channels: featuredChannels, isLoading } = useFeaturedChannels(12);
  const [nowPlayingData, setNowPlayingData] = useState<Record<string, string>>({});
  const [epgLoading, setEpgLoading] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Fetch "Now Playing" data for channels that have EPG support
  useEffect(() => {
    if (featuredChannels.length === 0) return;

    const fetchNowPlaying = async () => {
      setEpgLoading(true);
      const newData: Record<string, string> = {};

      // Only fetch for channels with EPG support
      const channelsWithEPG = featuredChannels
        .filter(ch => hasEPGSupport(ch.title))
        .slice(0, 8);

      const promises = channelsWithEPG.map(async (channel) => {
        try {
          const nowPlaying = await getNowPlaying(channel.title);
          if (nowPlaying?.title) {
            newData[channel.id] = nowPlaying.title;
          }
        } catch (error) {
          // Silently fail
        }
      });

      await Promise.all(promises);
      setNowPlayingData(newData);
      setEpgLoading(false);
    };

    const timer = setTimeout(fetchNowPlaying, 1000);
    return () => clearTimeout(timer);
  }, [featuredChannels]);

  // Scroll handlers
  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 400;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (isLoading) {
    return (
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-foreground">Featured Channels</h2>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (featuredChannels.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold text-foreground">Featured Channels</h2>
          {epgLoading && (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Scroll buttons - hidden on mobile */}
          <div className="hidden sm:flex gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => scroll('left')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => scroll('right')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Link to="/channels">
            <Button variant="outline" className="rounded-full text-sm">
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Horizontal Scroll Container */}
      <div className="relative">
        <div
          ref={scrollContainerRef}
          className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide scroll-smooth"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {featuredChannels.map(channel => (
            <Link
              key={channel.id}
              to={`/channel/${channel.country}/${channel.id}`}
              className="block flex-shrink-0"
            >
              <ChannelCard
                title={channel.title}
                embedUrl={channel.embedUrl}
                logo={channel.logo}
                viewers={channel.viewers}
                nowPlaying={nowPlayingData[channel.id]}
              />
            </Link>
          ))}
        </div>

        {/* Gradient fade on edges */}
        <div className="absolute top-0 left-0 h-full w-8 bg-gradient-to-r from-background to-transparent pointer-events-none hidden sm:block" />
        <div className="absolute top-0 right-0 h-full w-8 bg-gradient-to-l from-background to-transparent pointer-events-none hidden sm:block" />
      </div>
    </div>
  );
};

export default FeaturedChannels;
