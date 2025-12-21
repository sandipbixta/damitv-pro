import React, { useState, useRef, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import Hls from 'hls.js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Play, Link2, Video, AlertCircle, CheckCircle2, Copy, ExternalLink, Users, Trophy, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { extractHlsFromUrl, ExtractedStream, MatchInfo } from '@/services/hlsExtractorService';
import MainNav from '@/components/MainNav';
import Footer from '@/components/Footer';

const HlsExtractor: React.FC = () => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streams, setStreams] = useState<ExtractedStream[]>([]);
  const [selectedStream, setSelectedStream] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pageInfo, setPageInfo] = useState<{ length: number; message: string } | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const { toast } = useToast();

  const handleExtract = async () => {
    if (!url.trim()) {
      toast({
        title: 'URL Required',
        description: 'Please enter a URL to extract streams from',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setStreams([]);
    setSelectedStream(null);
    setError(null);
    setPageInfo(null);

    try {
      const result = await extractHlsFromUrl(url.trim());
      
      if (result.success) {
        setStreams(result.streams);
        setPageInfo({ length: result.pageLength, message: result.message });
        
        if (result.streams.length === 0) {
          toast({
            title: 'No Streams Found',
            description: result.message,
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Streams Found!',
            description: `Found ${result.streams.length} stream(s)`,
          });
        }
      } else {
        setError(result.error || 'Failed to extract streams');
        toast({
          title: 'Extraction Failed',
          description: result.error || 'Unknown error',
          variant: 'destructive',
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const playStream = (streamUrl: string) => {
    setSelectedStream(streamUrl);
  };

  useEffect(() => {
    if (!selectedStream || !videoRef.current) return;

    // Cleanup previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const video = videoRef.current;

    if (selectedStream.includes('.m3u8')) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
        });
        hlsRef.current = hls;
        hls.loadSource(selectedStream);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(() => {});
        });
        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) {
            toast({
              title: 'Playback Error',
              description: `HLS error: ${data.type}`,
              variant: 'destructive',
            });
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = selectedStream;
        video.play().catch(() => {});
      }
    } else {
      video.src = selectedStream;
      video.play().catch(() => {});
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [selectedStream, toast]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: 'Stream URL copied to clipboard',
    });
  };

  return (
    <>
      <Helmet>
        <title>HLS Stream Extractor - Test Tool</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <MainNav />
        
        <main className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">HLS Stream Extractor</h1>
            <p className="text-muted-foreground">
              Extract HLS (.m3u8) and MP4 streams from any webpage and test them directly.
            </p>
          </div>

          {/* URL Input */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="w-5 h-5" />
                Enter URL
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Input
                  type="url"
                  placeholder="https://sportslive.run/..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleExtract()}
                  className="flex-1"
                />
                <Button 
                  onClick={handleExtract} 
                  disabled={isLoading}
                  className="min-w-[120px]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Extracting...
                    </>
                  ) : (
                    'Extract'
                  )}
                </Button>
              </div>
              
              {pageInfo && (
                <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>Parsed {(pageInfo.length / 1024).toFixed(1)}KB - {pageInfo.message}</span>
                </div>
              )}
              
              {error && (
                <div className="mt-3 flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Video Player */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="w-5 h-5" />
                  Stream Player
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
                        <p>Select a stream to play</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {selectedStream && (
                  <div className="mt-3 p-2 bg-muted rounded text-xs font-mono break-all">
                    {selectedStream}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Extracted Streams */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    Extracted Streams
                    {streams.length > 0 && (
                      <Badge variant="secondary">{streams.length}</Badge>
                    )}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {streams.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {isLoading ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <p>Extracting streams...</p>
                      </div>
                    ) : (
                      <p>No streams extracted yet. Enter a URL and click Extract.</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {streams.map((stream, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border transition-colors ${
                          selectedStream === stream.url
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant={stream.type === 'hls' ? 'default' : 'secondary'}>
                              {stream.type.toUpperCase()}
                            </Badge>
                            {stream.quality && (
                              <Badge variant="outline">{stream.quality}</Badge>
                            )}
                            {stream.matchInfo?.status && (
                              <Badge variant={stream.matchInfo.status.toLowerCase() === 'live' ? 'destructive' : 'secondary'}>
                                {stream.matchInfo.status}
                              </Badge>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(stream.url)}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => window.open(stream.url, '_blank')}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        
                        {/* Match Info */}
                        {stream.matchInfo && (
                          <div className="mb-2 p-2 bg-muted/50 rounded text-sm space-y-1">
                            {stream.matchInfo.title && (
                              <p className="font-medium text-foreground">{stream.matchInfo.title}</p>
                            )}
                            {stream.matchInfo.teams && stream.matchInfo.teams.length === 2 && (
                              <div className="flex items-center gap-2 text-foreground">
                                <Users className="w-3 h-3 text-muted-foreground" />
                                <span>{stream.matchInfo.teams[0]}</span>
                                <span className="text-muted-foreground">vs</span>
                                <span>{stream.matchInfo.teams[1]}</span>
                              </div>
                            )}
                            {stream.matchInfo.league && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Trophy className="w-3 h-3" />
                                <span>{stream.matchInfo.league}</span>
                              </div>
                            )}
                            {stream.matchInfo.time && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                <span>{stream.matchInfo.time}</span>
                              </div>
                            )}
                          </div>
                        )}
                        
                        <p className="text-xs font-mono text-muted-foreground break-all mb-2">
                          {stream.url}
                        </p>
                        
                        <Button
                          size="sm"
                          variant={selectedStream === stream.url ? 'default' : 'outline'}
                          onClick={() => playStream(stream.url)}
                          className="w-full"
                        >
                          <Play className="w-4 h-4 mr-2" />
                          {selectedStream === stream.url ? 'Playing' : 'Play Stream'}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
        
        <Footer />
      </div>
    </>
  );
};

export default HlsExtractor;
