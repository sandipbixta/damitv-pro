import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Users, Radio, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageLayout from '@/components/PageLayout';

// Embed domain for streams
const EMBED_DOMAIN = 'https://stream.streamapi.cc';

interface CDNChannel {
  channel_name: string;
  channel_code: string;
  url: string;
  image?: string;
  viewers?: number;
}

interface CDNMatch {
  gameID: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamIMG?: string;
  awayTeamIMG?: string;
  time?: string;
  tournament?: string;
  country?: string;
  countryIMG?: string;
  status?: string;
  start?: string;
  channels?: CDNChannel[];
}

// Build embed URL from channel info
const buildEmbedUrl = (channel: CDNChannel): string => {
  // Extract channel name and code to build embed URL
  const channelName = encodeURIComponent(channel.channel_name.toLowerCase().replace(/\s+/g, '-'));
  const channelCode = channel.channel_code || 'us';
  return `${EMBED_DOMAIN}/embed/channel/${channelCode}/${channelName}`;
};

const CDNPlayer: React.FC = () => {
  const { gameId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const match = location.state?.match as CDNMatch | undefined;
  
  const [selectedChannel, setSelectedChannel] = useState(0);

  if (!match) {
    return (
      <PageLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
          <h1 className="text-2xl font-bold mb-4">Match Not Found</h1>
          <p className="text-muted-foreground mb-6">The match data is not available.</p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </PageLayout>
    );
  }

  const channels = match.channels || [];
  const currentChannel = channels[selectedChannel];
  const isLive = match.status === 'live' || match.status === 'playing';

  return (
    <PageLayout>
      <div className="py-4">
        {/* Back Button */}
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back</span>
        </button>

        {/* Match Header */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            {isLive && (
              <span className="flex items-center gap-1 px-2 py-1 bg-red-500/20 rounded text-red-500 text-xs font-semibold">
                <Radio className="w-3 h-3 animate-pulse" />
                LIVE
              </span>
            )}
            {match.countryIMG && (
              <img src={match.countryIMG} alt="" className="w-5 h-4 rounded-sm" />
            )}
            <span className="text-sm text-muted-foreground">{match.tournament}</span>
          </div>
          
          <h1 className="text-xl md:text-2xl font-bold text-foreground">
            {match.homeTeam} vs {match.awayTeam}
          </h1>
        </div>

        {/* Video Player */}
        <div className="mb-6">
          {currentChannel ? (
            <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden">
              <iframe
                key={selectedChannel}
                src={buildEmbedUrl(currentChannel)}
                className="w-full h-full"
                allowFullScreen
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                referrerPolicy="origin"
              />
            </div>
          ) : (
            <div className="w-full aspect-video bg-muted rounded-xl flex items-center justify-center">
              <p className="text-muted-foreground">No stream available</p>
            </div>
          )}
        </div>

        {/* Channel Selector */}
        {channels.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Available Channels ({channels.length})</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {channels.map((channel, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedChannel(index)}
                  className={`p-3 rounded-lg border transition-all ${
                    selectedChannel === index
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-card hover:border-primary/50'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    {channel.image ? (
                      <img 
                        src={channel.image} 
                        alt={channel.channel_name}
                        className="w-10 h-10 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-10 h-10 bg-muted rounded flex items-center justify-center text-xs font-bold">
                        {channel.channel_code?.toUpperCase() || 'TV'}
                      </div>
                    )}
                    <span className="text-xs font-medium text-center truncate w-full">
                      {channel.channel_name}
                    </span>
                    {channel.viewers !== undefined && channel.viewers > 0 && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="w-3 h-3" />
                        {channel.viewers}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Match Info */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {match.homeTeamIMG && (
                  <img src={match.homeTeamIMG} alt="" className="w-8 h-8 object-contain" />
                )}
                <span className="font-medium">{match.homeTeam}</span>
              </div>
              <span className="text-muted-foreground">vs</span>
              <div className="flex items-center gap-2">
                {match.awayTeamIMG && (
                  <img src={match.awayTeamIMG} alt="" className="w-8 h-8 object-contain" />
                )}
                <span className="font-medium">{match.awayTeam}</span>
              </div>
            </div>
            {match.time && (
              <span className="text-sm text-muted-foreground">{match.time}</span>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default CDNPlayer;
