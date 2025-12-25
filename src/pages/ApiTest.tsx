import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, RefreshCw, Play, X, Maximize, Volume2, VolumeX } from 'lucide-react';
import Hls from 'hls.js';

// ===== API 1: ssssdata.com =====
interface Sport {
  id: number;
  name: string;
}

interface Tournament {
  id: number;
  sport_id: number;
  name: string;
}

interface LiveStream {
  stream_id: number;
  sport_id: number;
  tournament_id: number;
  name: string;
  start: string;
  match_id: number;
  url: string;
}

interface SsssApiResponse {
  sports: Sport[];
  tournaments: Tournament[];
  items: {
    live: LiveStream[];
  };
}

// ===== API 2: Sports Playlist (M3U8 direct streams) =====
interface M3U8Stream {
  name: string;
  url: string;
  logo?: string;
  group?: string;
}

const SSSS_API_URL = 'https://api.ssssdata.com/v1.1/stream/list?language=en&access-token=SMB9MtuEJTs6FdH_owwf0QXWtqoyJ0';

// GitHub raw M3U playlist sources
const M3U_SOURCES = [
  {
    name: 'AbbaSport',
    url: 'https://raw.githubusercontent.com/konanda-sg/abbasport-m3u/refs/heads/main/output/abbasport.m3u',
    referer: 'https://cookiewebplay.xyz/'
  }
];

const ApiTest = () => {
  const [activeTab, setActiveTab] = useState('m3u8');
  
  // ssssdata state
  const [ssssData, setSsssData] = useState<SsssApiResponse | null>(null);
  const [ssssLoading, setSsssLoading] = useState(false);
  const [ssssError, setSsssError] = useState<string | null>(null);
  
  // M3U8 state
  const [m3u8Streams, setM3u8Streams] = useState<M3U8Stream[]>([]);
  const [m3u8Loading, setM3u8Loading] = useState(false);
  const [m3u8Error, setM3u8Error] = useState<string | null>(null);
  
  // Player state
  const [selectedStream, setSelectedStream] = useState<{ name: string; url: string; referer?: string } | null>(null);
  const [playerError, setPlayerError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse M3U playlist
  const parseM3U = (content: string): M3U8Stream[] => {
    const lines = content.split('\n');
    const streams: M3U8Stream[] = [];
    let currentStream: Partial<M3U8Stream> = {};
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.startsWith('#EXTINF:')) {
        // Parse stream info
        const nameMatch = line.match(/,(.+)$/);
        const logoMatch = line.match(/tvg-logo="([^"]+)"/);
        const groupMatch = line.match(/group-title="([^"]+)"/);
        
        currentStream = {
          name: nameMatch ? nameMatch[1].trim() : 'Unknown',
          logo: logoMatch ? logoMatch[1] : undefined,
          group: groupMatch ? groupMatch[1] : undefined
        };
      } else if (line.startsWith('http') && currentStream.name) {
        currentStream.url = line;
        streams.push(currentStream as M3U8Stream);
        currentStream = {};
      }
    }
    
    return streams;
  };

  // Fetch M3U8 playlist
  const fetchM3U8 = async () => {
    setM3u8Loading(true);
    setM3u8Error(null);
    
    try {
      const allStreams: M3U8Stream[] = [];
      
      for (const source of M3U_SOURCES) {
        try {
          const response = await fetch(source.url);
          if (response.ok) {
            const content = await response.text();
            const streams = parseM3U(content);
            console.log(`✅ Loaded ${streams.length} streams from ${source.name}`);
            allStreams.push(...streams);
          }
        } catch (e) {
          console.error(`Failed to fetch ${source.name}:`, e);
        }
      }
      
      setM3u8Streams(allStreams);
      
      if (allStreams.length === 0) {
        setM3u8Error('No streams found. CORS may be blocking the request.');
      }
    } catch (err) {
      console.error('M3U8 fetch error:', err);
      setM3u8Error(err instanceof Error ? err.message : 'Failed to fetch streams');
    } finally {
      setM3u8Loading(false);
    }
  };

  // Fetch ssssdata API
  const fetchSsss = async () => {
    setSsssLoading(true);
    setSsssError(null);
    try {
      const response = await fetch(SSSS_API_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      console.log('SSSS API Response:', result);
      setSsssData(result);
    } catch (err) {
      console.error('SSSS API Error:', err);
      setSsssError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setSsssLoading(false);
    }
  };

  useEffect(() => {
    fetchM3U8();
  }, []);

  // Initialize HLS player when stream is selected
  useEffect(() => {
    if (!selectedStream || !videoRef.current) return;
    
    setPlayerError(null);
    setIsPlaying(false);
    const streamUrl = selectedStream.url;
    
    console.log('🎬 Playing stream:', streamUrl);
    
    // Cleanup previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    
    // Check if it's an HLS stream
    if (streamUrl.includes('.m3u8') || streamUrl.includes('m3u8')) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
          xhrSetup: (xhr) => {
            // Add referer header if needed
            if (selectedStream.referer) {
              xhr.setRequestHeader('Referer', selectedStream.referer);
            }
          }
        });
        
        hlsRef.current = hls;
        hls.loadSource(streamUrl);
        hls.attachMedia(videoRef.current);
        
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          console.log('✅ HLS manifest loaded successfully!');
          setIsPlaying(true);
          videoRef.current?.play().catch(e => {
            console.log('Autoplay blocked:', e);
            setPlayerError('Click play to start the stream');
          });
        });
        
        hls.on(Hls.Events.ERROR, (_, data) => {
          console.error('HLS Error:', data);
          if (data.fatal) {
            if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
              setPlayerError(`Network error: ${data.details}. The stream may require specific headers or may be geo-blocked.`);
            } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
              hls.recoverMediaError();
            } else {
              setPlayerError(`Fatal error: ${data.details}`);
            }
          }
        });
      } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari native HLS
        videoRef.current.src = streamUrl;
        videoRef.current.play().catch(e => console.log('Autoplay blocked:', e));
        setIsPlaying(true);
      } else {
        setPlayerError('HLS not supported in this browser');
      }
    } else {
      // Try direct video playback
      videoRef.current.src = streamUrl;
      videoRef.current.play().catch(e => {
        console.log('Direct play failed:', e);
        setPlayerError('Cannot play this stream format directly');
      });
    }
    
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [selectedStream]);

  const closePlayer = () => {
    setSelectedStream(null);
    setPlayerError(null);
    setIsPlaying(false);
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen();
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(!isMuted);
    }
  };

  const handlePlay = () => {
    videoRef.current?.play().catch(console.log);
  };

  const getSportName = (sportId: number) => {
    return ssssData?.sports.find(s => s.id === sportId)?.name || 'Unknown';
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Stream API Test</h1>
        </div>

        {/* Video Player */}
        {selectedStream && (
          <Card className="border-2 border-primary">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{selectedStream.name}</CardTitle>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={toggleMute}>
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={toggleFullscreen}>
                    <Maximize className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={closePlayer}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div ref={containerRef} className="relative aspect-video bg-black rounded-lg overflow-hidden">
                {playerError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-10 bg-black/80">
                    <p className="text-red-400 mb-4 text-center px-4">{playerError}</p>
                    <Button onClick={handlePlay} variant="secondary">
                      <Play className="h-4 w-4 mr-2" />
                      Try to Play
                    </Button>
                  </div>
                )}
                
                {!isPlaying && !playerError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                    <Loader2 className="h-8 w-8 animate-spin text-white" />
                  </div>
                )}
                
                <video
                  ref={videoRef}
                  className="w-full h-full"
                  controls
                  playsInline
                  autoPlay
                />
              </div>
              
              <p className="text-xs text-muted-foreground mt-2 break-all">
                URL: {selectedStream.url}
              </p>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="m3u8">Direct M3U8 Streams</TabsTrigger>
            <TabsTrigger value="ssss">ssssdata.com API</TabsTrigger>
          </TabsList>
          
          {/* M3U8 Direct Streams Tab */}
          <TabsContent value="m3u8" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Play className="h-5 w-5 text-green-500" />
                    Direct HLS Streams ({m3u8Streams.length})
                  </CardTitle>
                  <Button onClick={fetchM3U8} variant="outline" size="sm" disabled={m3u8Loading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${m3u8Loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  These are direct .m3u8 streams that should play without captcha
                </p>
              </CardHeader>
              <CardContent>
                {m3u8Loading && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                )}
                
                {m3u8Error && (
                  <div className="text-center py-8">
                    <p className="text-destructive mb-4">{m3u8Error}</p>
                    <p className="text-sm text-muted-foreground">
                      Note: Some M3U sources may be blocked by CORS. Try using an edge function to proxy the request.
                    </p>
                  </div>
                )}
                
                {!m3u8Loading && !m3u8Error && m3u8Streams.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No streams loaded. Click Refresh to try again.
                  </p>
                )}
                
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {m3u8Streams.map((stream, index) => (
                    <Card key={index} className="border border-border hover:border-green-500 transition-colors cursor-pointer" onClick={() => setSelectedStream({ name: stream.name, url: stream.url, referer: M3U_SOURCES[0].referer })}>
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          {stream.logo && (
                            <img src={stream.logo} alt="" className="w-8 h-8 object-contain" onError={(e) => (e.target as HTMLImageElement).style.display = 'none'} />
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm truncate">{stream.name}</h3>
                            {stream.group && (
                              <Badge variant="secondary" className="text-xs">{stream.group}</Badge>
                            )}
                          </div>
                          <Play className="h-4 w-4 text-green-500 shrink-0" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* ssssdata.com Tab */}
          <TabsContent value="ssss" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Play className="h-5 w-5 text-red-500" />
                    ssssdata.com Live ({ssssData?.items.live.length || 0})
                  </CardTitle>
                  <Button onClick={fetchSsss} variant="outline" size="sm" disabled={ssssLoading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${ssssLoading ? 'animate-spin' : ''}`} />
                    {ssssData ? 'Refresh' : 'Load'}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  These streams redirect to external sites with their own captcha protection
                </p>
              </CardHeader>
              <CardContent>
                {ssssLoading && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                )}
                
                {ssssError && (
                  <p className="text-destructive text-center py-8">{ssssError}</p>
                )}
                
                {!ssssData && !ssssLoading && !ssssError && (
                  <p className="text-center text-muted-foreground py-8">
                    Click "Load" to fetch streams from ssssdata.com
                  </p>
                )}
                
                {ssssData && (
                  <>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {ssssData.sports.map(sport => (
                        <Badge key={sport.id} variant="secondary">{sport.name}</Badge>
                      ))}
                    </div>
                    
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                      {ssssData.items.live.map(stream => (
                        <Card key={stream.stream_id} className="border border-border">
                          <CardContent className="p-3 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-medium text-sm line-clamp-2">{stream.name}</h3>
                              <Badge variant="destructive" className="shrink-0">LIVE</Badge>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              <p>{getSportName(stream.sport_id)} • {formatTime(stream.start)}</p>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="w-full"
                              onClick={() => window.open(stream.url, '_blank')}
                            >
                              Open in New Tab
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ApiTest;
