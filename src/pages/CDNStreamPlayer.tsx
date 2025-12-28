import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const CDNStreamPlayer = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Get stream info from URL params
  const streamUrl = searchParams.get('url') || '';
  const title = searchParams.get('title') || 'Live Stream';
  const league = searchParams.get('league') || 'Football';
  const homeTeam = searchParams.get('home') || '';
  const awayTeam = searchParams.get('away') || '';

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: title,
        url: window.location.href,
      });
    } catch (err) {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (!streamUrl) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground text-center">
          <p className="text-xl mb-4">Stream not found</p>
          <Button onClick={handleGoBack} className="bg-primary">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const displayTitle = homeTeam && awayTeam ? `${homeTeam} vs ${awayTeam}` : title;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Helmet>
        <title>{displayTitle} - Live Stream | DamiTV</title>
        <meta name="description" content={`Watch ${displayTitle} live stream online for free on DamiTV`} />
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
            <h1 className="text-lg font-bold text-foreground truncate">{displayTitle}</h1>
            <p className="text-xs text-muted-foreground">{league}</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge className="bg-red-500 text-white text-xs animate-pulse">
              • LIVE
            </Badge>
          </div>
        </div>
      </div>

      {/* Video Player - Direct CDN Iframe */}
      <div className="w-full aspect-video bg-black">
        <iframe
          src={streamUrl}
          className="w-full h-full border-0"
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="no-referrer"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation allow-popups-to-escape-sandbox"
        />
      </div>

      {/* Match Info */}
      <div className="p-4">
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-foreground">{displayTitle}</h2>
              <p className="text-sm text-muted-foreground mt-1">{league}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="bg-muted border-border text-foreground hover:bg-accent"
            >
              <Share className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
          
          {homeTeam && awayTeam && (
            <div className="flex items-center justify-center gap-8 py-4">
              <div className="text-center">
                <div className="text-lg font-bold text-foreground">{homeTeam}</div>
                <div className="text-xs text-muted-foreground">Home</div>
              </div>
              <div className="text-2xl font-bold text-primary">VS</div>
              <div className="text-center">
                <div className="text-lg font-bold text-foreground">{awayTeam}</div>
                <div className="text-xs text-muted-foreground">Away</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CDNStreamPlayer;
