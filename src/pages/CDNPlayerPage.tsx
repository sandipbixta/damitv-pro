import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Radio, Maximize, Tv, Users, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { triggerPopunderAd } from '@/utils/popunderAd';
import PageLayout from '@/components/PageLayout';

interface CDNChannelData {
  id: string;
  title: string;
  country: string;
  embedUrl: string;
  logo: string | null;
  viewers: number;
}

const SUPABASE_URL = 'https://wxvsteaayxgygihpshoz.supabase.co';

const CDNPlayerPage: React.FC = () => {
  const { channelId } = useParams<{ channelId: string }>();
  const navigate = useNavigate();
  const [channel, setChannel] = useState<CDNChannelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasTriggeredAd, setHasTriggeredAd] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const loadChannel = async () => {
      if (!channelId) return;
      
      setLoading(true);
      try {
        // Fetch all channels and find the matching one
        const response = await fetch(
          `${SUPABASE_URL}/functions/v1/cdn-events?limit=1000`,
          { headers: { 'Accept': 'application/json' } }
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.channels) {
            const found = data.channels.find((ch: CDNChannelData) => 
              ch.id === decodeURIComponent(channelId)
            );
            setChannel(found || null);
          }
        }
      } catch (error) {
        console.error('Error loading channel:', error);
      } finally {
        setLoading(false);
      }
    };

    loadChannel();
  }, [channelId]);

  // Trigger popunder ad on first interaction
  const handlePlayerInteraction = () => {
    if (!hasTriggeredAd && channel) {
      triggerPopunderAd(channel.id, 'cdn_player_play');
      setHasTriggeredAd(true);
    }
  };

  const handleFullscreen = () => {
    if (iframeRef.current) {
      if (iframeRef.current.requestFullscreen) {
        iframeRef.current.requestFullscreen();
      }
    }
  };

  const handleShare = async () => {
    if (navigator.share && channel) {
      await navigator.share({
        title: `Watch ${channel.title} Live`,
        url: window.location.href
      });
    }
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </PageLayout>
    );
  }

  if (!channel) {
    return (
      <PageLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <Tv className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-4">Channel Not Found</h2>
          <p className="text-muted-foreground mb-6">The channel you're looking for is not available.</p>
          <Button onClick={() => navigate('/')}>Go Back Home</Button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="max-w-6xl mx-auto px-4 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">
              <Radio className="w-3 h-3 animate-pulse" />
              LIVE
            </div>
            <Button variant="ghost" size="icon" onClick={handleShare}>
              <Share2 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleFullscreen}>
              <Maximize className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Channel Title */}
        <div className="mb-4 flex items-center gap-4">
          {channel.logo && (
            <img 
              src={channel.logo} 
              alt={channel.title}
              className="w-12 h-12 object-contain rounded-lg bg-muted p-1"
            />
          )}
          <div>
            <h1 className="text-xl md:text-2xl font-bold">{channel.title}</h1>
            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
              <span>{channel.country}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {channel.viewers.toLocaleString()} watching
              </span>
            </div>
          </div>
        </div>

        {/* Video Player */}
        <div 
          className="relative w-full bg-black rounded-xl overflow-hidden"
          style={{ aspectRatio: '16/9' }}
          onClick={handlePlayerInteraction}
        >
          {channel.embedUrl ? (
            <iframe
              ref={iframeRef}
              src={channel.embedUrl}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
              frameBorder="0"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-white text-lg">Stream not available</p>
            </div>
          )}
        </div>

        {/* Channel Info */}
        <div className="mt-6 p-4 bg-card rounded-xl border border-border">
          <h3 className="font-semibold mb-3">Channel Information</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Channel</span>
              <p className="font-medium">{channel.title}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Country</span>
              <p className="font-medium">{channel.country}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Status</span>
              <p className="font-medium text-green-500">Live Now</p>
            </div>
            <div>
              <span className="text-muted-foreground">Viewers</span>
              <p className="font-medium">{channel.viewers.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default CDNPlayerPage;
