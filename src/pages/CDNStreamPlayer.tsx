import React, { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Settings, Share, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ChannelPlayerSelector, { PlayerType } from '@/components/StreamPlayer/ChannelPlayerSelector';

const CDNStreamPlayer = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Get stream info from URL params
  const streamUrl = searchParams.get('url') || '';
  const title = searchParams.get('title') || 'Live Stream';
  const league = searchParams.get('league') || 'Football';
  const homeTeam = searchParams.get('home') || '';
  const awayTeam = searchParams.get('away') || '';
  
  const [playerType, setPlayerType] = useState<PlayerType>('simple');
  const [showPlayerSettings, setShowPlayerSettings] = useState(false);

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleRetry = () => {
    window.location.reload();
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: title,
        url: window.location.href,
      });
    } catch (err) {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (!streamUrl) {
    return (
      <div className="min-h-screen bg-[#0A0F1C] flex items-center justify-center">
        <div className="text-white text-center">
          <p className="text-xl mb-4">Stream not found</p>
          <Button onClick={handleGoBack} className="bg-primary">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const stream = {
    id: 'cdn-stream',
    streamNo: 1,
    language: 'English',
    hd: true,
    embedUrl: streamUrl,
    source: 'CDN Live'
  };

  const displayTitle = homeTeam && awayTeam ? `${homeTeam} vs ${awayTeam}` : title;

  return (
    <div className="min-h-screen bg-[#0A0F1C] text-white">
      <Helmet>
        <title>{displayTitle} - Live Stream | DamiTV</title>
        <meta name="description" content={`Watch ${displayTitle} live stream online for free on DamiTV`} />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes" />
      </Helmet>

      {/* Header */}
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
            <h1 className="text-lg font-bold text-white truncate">{displayTitle}</h1>
            <p className="text-xs text-muted-foreground">{league}</p>
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
            <Badge className="bg-red-500 text-white text-xs animate-pulse">
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

      {/* Video Player */}
      <div className="w-full">
        <ChannelPlayerSelector
          stream={stream}
          isLoading={false}
          onRetry={handleRetry}
          playerType={playerType}
          title={displayTitle}
        />
      </div>

      {/* Match Info */}
      <div className="p-4">
        <div className="bg-[#151922] rounded-xl p-4 border border-[#343a4d]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-white">{displayTitle}</h2>
              <p className="text-sm text-muted-foreground mt-1">{league}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="bg-[#242836] border-[#343a4d] text-white hover:bg-[#343a4d]"
            >
              <Share className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
          
          {homeTeam && awayTeam && (
            <div className="flex items-center justify-center gap-8 py-4">
              <div className="text-center">
                <div className="text-lg font-bold text-white">{homeTeam}</div>
                <div className="text-xs text-muted-foreground">Home</div>
              </div>
              <div className="text-2xl font-bold text-green-500">VS</div>
              <div className="text-center">
                <div className="text-lg font-bold text-white">{awayTeam}</div>
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
