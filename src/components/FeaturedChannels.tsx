import React, { useEffect, useState } from 'react';
import { useFeaturedChannels } from '../hooks/useCDNChannels';
import ChannelCard from './ChannelCard';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Link } from 'react-router-dom';
import { getNowPlaying, hasEPGSupport, NowPlaying } from '../services/epgService';

const FeaturedChannels = () => {
  const { channels: featuredChannels, isLoading } = useFeaturedChannels(10);
  const [nowPlayingData, setNowPlayingData] = useState<Record<string, string>>({});
  const [epgLoading, setEpgLoading] = useState(false);

  // Fetch "Now Playing" data for channels that have EPG support
  useEffect(() => {
    if (featuredChannels.length === 0) return;

    const fetchNowPlaying = async () => {
      setEpgLoading(true);
      const newData: Record<string, string> = {};

      // Only fetch for channels with EPG support (limit to avoid too many requests)
      const channelsWithEPG = featuredChannels
        .filter(ch => hasEPGSupport(ch.title))
        .slice(0, 6); // Limit to first 6 to avoid rate limits

      // Fetch in parallel with small batches
      const promises = channelsWithEPG.map(async (channel) => {
        try {
          const nowPlaying = await getNowPlaying(channel.title);
          if (nowPlaying?.title) {
            newData[channel.id] = nowPlaying.title;
          }
        } catch (error) {
          // Silently fail for individual channels
        }
      });

      await Promise.all(promises);
      setNowPlayingData(newData);
      setEpgLoading(false);
    };

    // Delay EPG fetch to not block initial render
    const timer = setTimeout(fetchNowPlaying, 1000);
    return () => clearTimeout(timer);
  }, [featuredChannels]);

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
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold text-foreground">Featured Channels</h2>
          {epgLoading && (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          )}
        </div>
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
              nowPlaying={nowPlayingData[channel.id]}
            />
          </Link>
        ))}
      </div>
    </div>
  );
};

export default FeaturedChannels;
