import React from 'react';
import { useFeaturedChannels } from '../hooks/useCDNChannels';
import ChannelCard from './ChannelCard';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Link } from 'react-router-dom';

const FeaturedChannels = () => {
  const { channels: featuredChannels, isLoading } = useFeaturedChannels(10);

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
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-foreground">Featured Channels</h2>
        <Link to="/channels">
          <Button variant="outline" className="backdrop-blur-md shadow-lg rounded-full">
            View All Channels <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        {featuredChannels.map(channel => (
          <Link
            key={channel.id}
            to={`/channel/${channel.country}/${channel.id}`}
            className="block"
          >
            <ChannelCard
              title={channel.title}
              embedUrl={channel.embedUrl}
              logo={channel.logo}
              viewers={channel.viewers}
            />
          </Link>
        ))}
      </div>
    </div>
  );
};

export default FeaturedChannels;
