import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import ChannelPlayerSelector, { PlayerType } from '@/components/StreamPlayer/ChannelPlayerSelector';
import { useCDNChannel } from '@/hooks/useCDNChannels';
import { useViewerTracking } from '@/hooks/useViewerTracking';
import { ArrowLeft, Share, Star, ChevronRight, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

import MatchDetails from '@/components/MatchDetails';
import { triggerStreamChangeAd } from '@/utils/streamAdTrigger';

const ChannelPlayer = () => {
  const { country, channelId } = useParams();
  const navigate = useNavigate();
  
  // Track viewer count for this channel
  useViewerTracking(channelId);
  
  // Use CDN channels API
  const { channel, otherChannels, isLoading, error } = useCDNChannel(country, channelId);
  
  // Auto-detect player type based on stream URL
  const [playerType, setPlayerType] = useState<PlayerType>('simple');
  
  // Update player type when channel loads - use html5 for HLS streams
  useEffect(() => {
    if (channel?.embedUrl) {
      const isHLS = /\.m3u8(\?|$)/i.test(channel.embedUrl);
      if (isHLS) {
        console.log('📺 HLS stream detected, using html5 player');
        setPlayerType('html5');
      }
    }
  }, [channel?.embedUrl]);
  const [showPlayerSettings, setShowPlayerSettings] = useState(false);

  // Navigate to channels if not found
  useEffect(() => {
    if (!isLoading && error) {
      navigate('/channels');
    }
  }, [isLoading, error, navigate]);

  const handleGoBack = () => {
    navigate('/channels');
  };

  const handleRetry = () => {
    // Force reload by navigating to same page
    window.location.reload();
  };

  const handleChannelSwitch = (newChannelId: string) => {
    triggerStreamChangeAd();
    navigate(`/channel/${country}/${newChannelId}`);
  };

  if (isLoading || !channel) {
    return (
      <div className="min-h-screen bg-[#0A0F1C] flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff5a36] mx-auto mb-4"></div>
          <p>Loading channel...</p>
        </div>
      </div>
    );
  }

  const stream = {
    id: channel.id,
    streamNo: 1,
    language: 'English',
    hd: true,
    embedUrl: channel.embedUrl,
    source: 'TV Channel'
  };

  return (
    <div className="min-h-screen bg-[#0A0F1C] text-white">
      <Helmet>
        <title>{channel.title} - Live Stream | DamiTV</title>
        <meta name="description" content={`Watch ${channel.title} live stream online for free on DamiTV`} />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes" />
      </Helmet>

      {/* Mobile-optimized header */}
      <div className="sticky top-0 z-50 bg-[#0A0F1C]/95 backdrop-blur-sm border-b border-[#343a4d]">
        <div className="flex items-center justify-between p-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGoBack}
            className="text-white hover:bg-[#242836]"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </Button>
          
          <div className="flex-1 text-center">
            <h1 className="text-lg font-bold text-white truncate">{channel.title}</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPlayerSettings(!showPlayerSettings)}
              className="text-white hover:bg-[#242836]"
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Badge className="bg-red-500 text-white text-xs">
              • LIVE
            </Badge>
          </div>
        </div>
      </div>


      {/* Player Settings Panel */}
      {showPlayerSettings && (
        <div className="px-4 pb-4">
          <div className="bg-[#151922] rounded-xl p-4 border border-[#343a4d]">
            <h3 className="text-white font-semibold mb-3">Video Player Settings</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { type: 'simple' as PlayerType, name: 'Smart Player', desc: 'Best working option (recommended)' },
                { type: 'iframe' as PlayerType, name: 'Direct Embed', desc: 'Shows provider controls' },
                { type: 'custom' as PlayerType, name: 'Custom Overlay', desc: 'Visual controls (limited function)' },
                { type: 'basic' as PlayerType, name: 'Basic Player', desc: 'Simple iframe fallback' },
                { type: 'extracted' as PlayerType, name: 'Stream Extractor', desc: 'Advanced (may not work with protected sites)' },
                { type: 'html5' as PlayerType, name: 'HTML5 Player', desc: 'For direct video streams only' }
              ].map((player) => (
                <button
                  key={player.type}
                  onClick={() => setPlayerType(player.type)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    playerType === player.type
                      ? 'bg-[#ff5a36] border-[#ff5a36] text-white'
                      : 'bg-[#242836] border-[#343a4d] text-white hover:bg-[#343a4d]'
                  }`}
                >
                  <div className="font-medium text-sm">{player.name}</div>
                  <div className="text-xs text-gray-400 mt-1">{player.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Video Player - Full width, optimized for mobile */}
      <div className="w-full">
        <ChannelPlayerSelector
          stream={stream}
          isLoading={false}
          onRetry={handleRetry}
          playerType={playerType}
          title={channel.title}
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-4 p-4">
        {/* Channel Info */}
        <div className="flex-1">
          {/* Match Details or Channel Info */}
          <MatchDetails 
            match={{
              id: channel.id,
              title: channel.title,
              category: 'Live TV',
              date: Date.now(),
              popular: true,
              sources: [{ source: 'TV Channel', id: channel.id }]
            } as any}
            isLive={true}
            showCompact={false}
          />
          
          <div className="bg-[#151922] rounded-xl p-4 border border-[#343a4d] mt-4">
            <div className="flex items-start gap-4">
              {/* Channel Logo */}
              <div className="w-16 h-16 rounded-xl bg-[#343a4d] flex items-center justify-center overflow-hidden flex-shrink-0">
                {channel.logo ? (
                  <img 
                    src={channel.logo} 
                    alt={channel.title}
                    className="w-12 h-12 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div className={`w-full h-full flex items-center justify-center text-lg font-bold text-white ${channel.logo ? 'hidden' : ''}`}>
                  {channel.title.split(' ').map((word: string) => word.charAt(0).toUpperCase()).slice(0, 2).join('')}
                </div>
              </div>
              
              {/* Channel Details */}
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-white mb-2">{channel.title}</h2>
                <p className="text-gray-400 text-sm mb-3">Live Sports Channel</p>
                
                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-[#242836] border-[#343a4d] text-white hover:bg-[#343a4d]"
                  >
                    <Star className="h-4 w-4 mr-2" />
                    Favorite
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-[#242836] border-[#343a4d] text-white hover:bg-[#343a4d]"
                  >
                    <Share className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Other Channels Sidebar */}
        <div className="lg:w-80">
          <div className="bg-[#151922] rounded-xl border border-[#343a4d] overflow-hidden">
            <div className="p-4 border-b border-[#343a4d]">
              <h3 className="font-semibold text-white text-sm">Other Channels</h3>
              <p className="text-xs text-gray-400 mt-1">Switch to another channel</p>
            </div>
            
            <ScrollArea className="h-[400px]">
              <div className="p-2">
                {otherChannels.map(otherChannel => (
                  <div
                    key={otherChannel.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#242836] cursor-pointer transition-colors group"
                    onClick={() => handleChannelSwitch(otherChannel.id)}
                  >
                    <div className="w-10 h-10 rounded-lg bg-[#343a4d] flex items-center justify-center overflow-hidden flex-shrink-0">
                      {otherChannel.logo ? (
                        <img 
                          src={otherChannel.logo} 
                          alt={otherChannel.title}
                          className="w-8 h-8 object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div className={`w-full h-full flex items-center justify-center text-xs font-bold text-white ${otherChannel.logo ? 'hidden' : ''}`}>
                        {otherChannel.title.split(' ').map((word: string) => word.charAt(0).toUpperCase()).slice(0, 2).join('')}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-white truncate group-hover:text-[#ff5a36] transition-colors">
                        {otherChannel.title}
                      </h4>
                    </div>
                    
                    <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-[#ff5a36] transition-colors" />
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>

    </div>
  );
};

export default ChannelPlayer;
