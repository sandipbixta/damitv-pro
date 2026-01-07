import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import VideoPlayerSelector from '@/components/StreamPlayer/VideoPlayerSelector';
import IframeVideoPlayer from '@/components/StreamPlayer/IframeVideoPlayer';
import { useCDNChannel } from '@/hooks/useCDNChannels';
import { useViewerTracking } from '@/hooks/useViewerTracking';
import { ArrowLeft, Star, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import MatchDetails from '@/components/MatchDetails';
import { triggerStreamChangeAd } from '@/utils/streamAdTrigger';
import AdsterraSocialBar from '@/components/AdsterraSocialBar';

const ChannelPlayer = () => {
  const { country, channelId } = useParams();
  const navigate = useNavigate();
  
  // Track viewer count for this channel
  useViewerTracking(channelId);
  
  // Use CDN channels API
  const { channel, otherChannels, isLoading, error } = useCDNChannel(country, channelId);
  
  // Detect if HLS stream
  const isHlsStream = channel?.embedUrl ? /\.m3u8(\?|$)/i.test(channel.embedUrl) : false;

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
    window.location.reload();
  };

  const handleChannelSwitch = (newChannelId: string) => {
    triggerStreamChangeAd(channelId || newChannelId);
    navigate(`/channel/${country}/${newChannelId}`);
  };

  if (isLoading || !channel) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading channel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AdsterraSocialBar />
      <Helmet>
        <title>{channel.title} - Live Stream | DamiTV</title>
        <meta name="description" content={`Watch ${channel.title} live stream online for free on DamiTV`} />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes" />
      </Helmet>

      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between p-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGoBack}
            className="text-foreground hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </Button>
          
          <div className="flex-1 text-center">
            <h1 className="text-lg font-bold text-foreground truncate">{channel.title}</h1>
          </div>
          
          <Badge className="bg-red-500 text-white text-xs">
            • LIVE
          </Badge>
        </div>
      </div>

      {/* Video Player */}
      <div className="w-full aspect-video bg-black">
        {isHlsStream ? (
          <VideoPlayerSelector
            src={channel.embedUrl}
            title={channel.title}
            onLoad={() => console.log('Stream loaded')}
            onError={handleRetry}
          />
        ) : (
          <IframeVideoPlayer
            src={channel.embedUrl}
            title={channel.title}
            onLoad={() => console.log('Stream loaded')}
            onError={handleRetry}
          />
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-4 p-4">
        {/* Channel Info */}
        <div className="flex-1">
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
          
          <div className="bg-card rounded-xl p-4 border border-border mt-4">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                {channel.logo ? (
                  <img 
                    src={channel.logo} 
                    alt={channel.title}
                    className="w-12 h-12 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-lg font-bold text-foreground">
                    {channel.title.split(' ').map((word: string) => word.charAt(0).toUpperCase()).slice(0, 2).join('')}
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-foreground mb-2">{channel.title}</h2>
                <p className="text-muted-foreground text-sm mb-3">Live Sports Channel</p>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-card border-border text-foreground hover:bg-muted"
                >
                  <Star className="h-4 w-4 mr-2" />
                  Favorite
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Other Channels Sidebar */}
        <div className="lg:w-80">
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold text-foreground text-sm">Other Channels</h3>
              <p className="text-xs text-muted-foreground mt-1">Switch to another channel</p>
            </div>
            
            <ScrollArea className="h-[400px]">
              <div className="p-2">
                {otherChannels.map(otherChannel => (
                  <div
                    key={otherChannel.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors group"
                    onClick={() => handleChannelSwitch(otherChannel.id)}
                  >
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                      {otherChannel.logo ? (
                        <img 
                          src={otherChannel.logo} 
                          alt={otherChannel.title}
                          className="w-8 h-8 object-contain"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-foreground">
                          {otherChannel.title.split(' ').map((word: string) => word.charAt(0).toUpperCase()).slice(0, 2).join('')}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                        {otherChannel.title}
                      </h4>
                    </div>
                    
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
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
