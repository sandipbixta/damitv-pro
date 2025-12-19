
import React, { useState, useEffect } from 'react';
import { fetchChannelsFromAPI, Channel } from '../data/tvChannels';
import ChannelCard from './ChannelCard';
import { ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import { Link } from 'react-router-dom';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel"
import Autoplay from "embla-carousel-autoplay"

const FeaturedChannels = () => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadChannels = async () => {
      try {
        const allChannels = await fetchChannelsFromAPI();
        // Get first 12 channels as featured
        setChannels(allChannels.slice(0, 12));
      } catch (error) {
        console.error('Failed to load featured channels:', error);
      } finally {
        setLoading(false);
      }
    };
    loadChannels();
  }, []);

  if (loading) {
    return (
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-foreground">Live TV Channels</h2>
        </div>
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="w-40 h-32 bg-card rounded-xl animate-pulse flex-shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  if (channels.length === 0) {
    return (
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-foreground">Live TV Channels</h2>
          <Link to="/channels">
            <Button variant="outline" className="backdrop-blur-md shadow-lg rounded-full">
              View All Channels <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
        <p className="text-muted-foreground">No channels available at the moment.</p>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-6 bg-primary rounded-full" />
          <h2 className="text-lg md:text-xl font-bold text-foreground">Live TV Channels</h2>
        </div>
        <Link to="/channels">
          <Button variant="outline" className="backdrop-blur-md shadow-lg rounded-full">
            View All Channels <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>

      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        plugins={[
          Autoplay({
            delay: 3000,
            stopOnInteraction: false,
            stopOnMouseEnter: true,
          }) as any,
        ]}
        className="w-full"
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {channels.map(channel => (
            <CarouselItem key={channel.id} className="pl-2 md:pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6">
              <Link 
                to={`/channel/${channel.country}/${channel.id}`}
                className="block"
              >
                <ChannelCard
                  title={channel.title}
                  embedUrl={channel.embedUrl}
                  logo={channel.logo}
                />
              </Link>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
};

export default FeaturedChannels;
