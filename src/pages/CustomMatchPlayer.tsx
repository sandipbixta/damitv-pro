import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Maximize2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageLayout from '@/components/PageLayout';
import Hls from 'hls.js';
import { CustomMatch } from './AdminCustomMatch';

const STORAGE_KEY = 'damitv_custom_matches';

const CustomMatchPlayer = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [match, setMatch] = useState<CustomMatch | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load match from localStorage
  useEffect(() => {
    const savedMatches = localStorage.getItem(STORAGE_KEY);
    if (savedMatches) {
      const matches: CustomMatch[] = JSON.parse(savedMatches);
      const foundMatch = matches.find(m => m.id === matchId);
      if (foundMatch) {
        setMatch(foundMatch);
      } else {
        setError('Match not found');
      }
    } else {
      setError('No matches available');
    }
    setIsLoading(false);
  }, [matchId]);

  // Initialize video player
  useEffect(() => {
    if (!match || !videoRef.current) return;

    const video = videoRef.current;
    const streamUrl = match.streamUrl;

    // Check if it's an HLS stream
    const isHls = streamUrl.includes('.m3u8');

    if (isHls) {
      if (Hls.isSupported()) {
        console.log('Initializing HLS.js player');
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90,
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
        });

        hls.loadSource(streamUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          console.log('HLS manifest loaded');
          video.play().catch(err => console.error('Playback error:', err));
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          console.error('HLS error:', data);
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls.recoverMediaError();
                break;
              default:
                setError('Stream error occurred');
                hls.destroy();
                break;
            }
          }
        });

        hlsRef.current = hls;
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS support (Safari)
        video.src = streamUrl;
        video.play().catch(err => console.error('Playback error:', err));
      } else {
        setError('HLS not supported in this browser');
      }
    } else {
      // Direct video or iframe handling
      video.src = streamUrl;
      video.play().catch(err => console.error('Playback error:', err));
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [match]);

  const handleFullscreen = () => {
    const element = containerRef.current;
    if (element?.requestFullscreen) {
      element.requestFullscreen();
    }
  };

  const isIframeStream = match?.streamUrl && !match.streamUrl.includes('.m3u8') && 
    !match.streamUrl.includes('.mp4') && !match.streamUrl.includes('.webm');

  if (isLoading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
        </div>
      </PageLayout>
    );
  }

  if (error || !match) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Match Not Found</h1>
            <p className="text-muted-foreground mb-6">{error || 'The requested match could not be found.'}</p>
            <Link to="/">
              <Button>
                <ArrowLeft className="mr-2" size={16} /> Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2" size={16} /> Back
            </Button>
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users size={16} />
              <span className="text-sm">Live</span>
            </div>
          </div>
        </div>

        {/* Match Title */}
        <div className="mb-4">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            {match.homeTeam} vs {match.awayTeam}
          </h1>
          <p className="text-muted-foreground mt-1">
            {match.category} • {new Date(match.date).toLocaleString()}
          </p>
        </div>

        {/* Video Player */}
        <div 
          ref={containerRef}
          className="relative w-full aspect-video bg-black rounded-xl overflow-hidden mb-6"
        >
          {isIframeStream ? (
            <iframe
              src={match.streamUrl}
              className="w-full h-full"
              allowFullScreen
              allow="autoplay; fullscreen"
              title={`${match.homeTeam} vs ${match.awayTeam}`}
            />
          ) : (
            <video
              ref={videoRef}
              className="w-full h-full"
              controls
              playsInline
              autoPlay
              muted
              poster={match.imageUrl}
            />
          )}
          
          {/* Fullscreen Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleFullscreen}
            className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white"
          >
            <Maximize2 size={20} />
          </Button>
        </div>

        {/* Match Image Preview */}
        {match.imageUrl && (
          <div className="mt-6">
            <img
              src={match.imageUrl}
              alt={`${match.homeTeam} vs ${match.awayTeam}`}
              className="w-full max-w-2xl mx-auto rounded-lg"
            />
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default CustomMatchPlayer;
