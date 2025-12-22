import React from 'react';
import { useFeaturedChannels } from '../hooks/useCDNChannels';
import ChannelCard from './ChannelCard';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Link } from 'react-router-dom';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel"
import Autoplay from "embla-carousel-autoplay"

const FeaturedChannels = () => {
  const { channels: featuredChannels, isLoading } = useFeaturedChannels(12);

  if (isLoading) {
    return (
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-foreground">Live TV Channels</h2>
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
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-foreground">Live TV Channels</h2>
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
          }),
        ]}
        className="w-full"
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {featuredChannels.map(channel => (
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
