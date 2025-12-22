
import React from 'react';
import { tvChannels } from '../data/tvChannels';
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
  // Get more featured channels for the scrolling carousel
  const featuredChannels = [
    tvChannels.find(ch => ch.id === 'sky-sports-news'),
    tvChannels.find(ch => ch.id === 'sky-sports-premier-league'),
    tvChannels.find(ch => ch.id === 'espn-usa'),
    tvChannels.find(ch => ch.id === 'fox-sports1-usa'),
    tvChannels.find(ch => ch.id === 'tnt-sports-1'),
    tvChannels.find(ch => ch.id === 'star-sports1-india'),
    tvChannels.find(ch => ch.id === 'bein-sport1-france'),
    tvChannels.find(ch => ch.id === 'fox-501'),
    tvChannels.find(ch => ch.id === 'sky-sports-football'),
    tvChannels.find(ch => ch.id === 'espn2-usa'),
    tvChannels.find(ch => ch.id === 'nbc-sports'),
    tvChannels.find(ch => ch.id === 'cbs-sports'),
  ].filter(Boolean);

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
                to={`/channels?channel=${channel.id}`}
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
