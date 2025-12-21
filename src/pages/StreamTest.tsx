import React, { useState, useRef, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import Hls from 'hls.js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Video, Trophy, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import MainNav from '@/components/MainNav';
import Footer from '@/components/Footer';

interface StreamChannel {
  title: string;
  league: string;
  url: string;
  status?: 'untested' | 'working' | 'failed';
}

// Pre-extracted streams from sportslive.run
const EXTRACTED_STREAMS: StreamChannel[] = [
  {
    title: 'Channel 01',
    league: 'Live Stream',
    url: 'https://live-en.aisports.cc/moviebox/device01/playlist.m3u8',
    status: 'untested',
  },
  {
    title: 'Channel 016',
    league: 'Sports Channel',
    url: 'https://live-en.aisports.cc/moviebox/bsy_016/playlist.m3u8',
    status: 'untested',
  },
  {
    title: 'Channel 011',
    league: 'Sports Channel',
    url: 'https://live-en.aisports.cc/moviebox/bsy_011/playlist.m3u8',
    status: 'untested',
  },
  {
    title: 'Channel 027',
    league: 'Sports Channel',
    url: 'https://live-en.aisports.cc/moviebox/bsy_027/playlist.m3u8',
    status: 'untested',
  },
  {
    title: 'Channel 02',
    league: 'Live Stream',
    url: 'https://live-en.aisports.cc/moviebox/device02/playlist.m3u8',
    status: 'untested',
  },
  {
    title: 'Football 001',
    league: 'Football',
    url: 'https://live-en.aisports.cc/moviebox/football001/playlist.m3u8',
    status: 'untested',
  },
];

const StreamTest: React.FC = () => {
  const [streams, setStreams] = useState<StreamChannel[]>(EXTRACTED_STREAMS);
  const [selectedStream, setSelectedStream] = useState<StreamChannel | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const { toast } = useToast();

  const playStream = (stream: StreamChannel) => {
    setSelectedStream(stream);
    setIsPlaying(false);
  };

  useEffect(() => {
    if (!selectedStream || !videoRef.current) return;

    // Cleanup previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const video = videoRef.current;

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      hlsRef.current = hls;
      hls.loadSource(selectedStream.url);
      hls.attachMedia(video);
      
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play()
          .then(() => {
            setIsPlaying(true);
            updateStreamStatus(selectedStream.url, 'working');
            toast({
              title: '✅ Stream Working!',
              description: `${selectedStream.title} is playing successfully`,
            });
          })
          .catch(() => {
            updateStreamStatus(selectedStream.url, 'failed');
          });
      });
      
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          updateStreamStatus(selectedStream.url, 'failed');
          toast({
            title: '❌ Stream Failed',
            description: `${selectedStream.title} could not be played`,
            variant: 'destructive',
          });
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = selectedStream.url;
      video.play()
        .then(() => {
          setIsPlaying(true);
          updateStreamStatus(selectedStream.url, 'working');
        })
        .catch(() => {
          updateStreamStatus(selectedStream.url, 'failed');
        });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [selectedStream, toast]);

  const updateStreamStatus = (url: string, status: 'working' | 'failed') => {
    setStreams(prev => prev.map(s => 
      s.url === url ? { ...s, status } : s
    ));
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'working':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'working':
        return <Badge className="bg-green-500/20 text-green-500 border-green-500/50">Working</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">Untested</Badge>;
    }
  };

  return (
    <>
      <Helmet>
        <title>Stream Test - DamiTV</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <MainNav />
        
        <main className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Stream Test Page</h1>
            <p className="text-muted-foreground">
              Test pre-extracted HLS streams from sportslive.run - Click any stream to play it.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Video Player */}
            <Card className="lg:sticky lg:top-4 h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="w-5 h-5" />
                  {selectedStream ? selectedStream.title : 'Stream Player'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                  {selectedStream ? (
                    <video
                      ref={videoRef}
                      className="w-full h-full"
                      controls
                      playsInline
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <Play className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Select a stream to test</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {selectedStream && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{selectedStream.title}</span>
                      {getStatusBadge(streams.find(s => s.url === selectedStream.url)?.status)}
                    </div>
                    <p className="text-xs font-mono text-muted-foreground break-all">
                      {selectedStream.url}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stream Cards */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                Available Streams
                <Badge variant="secondary">{streams.length}</Badge>
              </h2>
              
              <div className="grid gap-4">
                {streams.map((stream, index) => (
                  <Card 
                    key={index}
                    className={`cursor-pointer transition-all hover:border-primary/50 ${
                      selectedStream?.url === stream.url ? 'border-primary bg-primary/5' : ''
                    }`}
                    onClick={() => playStream(stream)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getStatusIcon(stream.status)}
                            <h3 className="font-semibold text-foreground">{stream.title}</h3>
                            {getStatusBadge(stream.status)}
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <Trophy className="w-4 h-4" />
                            <span>{stream.league}</span>
                          </div>
                          
                          <p className="text-xs font-mono text-muted-foreground break-all">
                            {stream.url}
                          </p>
                        </div>
                        
                        <Button 
                          size="sm"
                          variant={selectedStream?.url === stream.url ? 'default' : 'outline'}
                          onClick={(e) => {
                            e.stopPropagation();
                            playStream(stream);
                          }}
                        >
                          <Play className="w-4 h-4 mr-1" />
                          {selectedStream?.url === stream.url ? 'Playing' : 'Play'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <Card className="bg-muted/50">
                <CardContent className="p-4 text-sm text-muted-foreground">
                  <p className="font-medium mb-2">ℹ️ Testing Results:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>✅ <strong>Working</strong> = Stream plays successfully, ready to integrate</li>
                    <li>❌ <strong>Failed</strong> = Stream has CORS issues or is offline</li>
                    <li>If streams fail here but work on external players, you may need a proxy</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    </>
  );
};

export default StreamTest;
