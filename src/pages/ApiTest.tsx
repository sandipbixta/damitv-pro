import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Loader2, RefreshCw, Play, X, Maximize, Volume2, VolumeX, Server, AlertTriangle, Calendar, Filter } from 'lucide-react';
import Hls from 'hls.js';
import { supabase } from '@/integrations/supabase/client';

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

// ===== API 3: Clean Sports (ad-free with EPG) =====
interface CleanStream {
  id: string;
  name: string;
  url: string;
  logo?: string;
  category: string;
  currentProgram?: string;
  startTime?: string;
  endTime?: string;
  isLive: boolean;
  headers?: Record<string, string>;
}

// ===== API 4: Football Live Streaming API (RapidAPI) =====
interface FootballServer {
  name: string;
  url: string;
  header?: { 
    'user-agent'?: string; 
    referer?: string;
  };
  type: 'direct' | 'drm' | 'referer';
}

interface FootballMatch {
  match_time: string;
  match_status: string;
  home_team_name: string;
  home_team_logo: string;
  homeTeamScore: string;
  away_team_name: string;
  away_team_logo: string;
  awayTeamScore: string;
  league_name: string;
  league_logo: string;
  servers: FootballServer[];
}

interface FootballApiResponse {
  matches: FootballMatch[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ===== API 5: SportsRC API =====
interface SportsRCCategory {
  id: string;
  name: string;
}

interface SportsRCMatch {
  id: string;
  title: string;
  category: string;
  date: string;
  time: string;
  home_team?: string;
  away_team?: string;
  home_logo?: string;
  away_logo?: string;
  league?: string;
  status?: string;
}

interface SportsRCDetail {
  id: string;
  title: string;
  embed: string;
  category: string;
}

const SSSS_API_URL = 'https://api.ssssdata.com/v1.1/stream/list?language=en&access-token=SMB9MtuEJTs6FdH_owwf0QXWtqoyJ0';
const RAPIDAPI_KEY = 'd60ec7742bmshf7e102f26210e84p1164d2jsne0633fe2851c';
const RAPIDAPI_HOST = 'football-live-streaming-api.p.rapidapi.com';

const ApiTest = () => {
  const [activeTab, setActiveTab] = useState('sportsrc');
  
  // ssssdata state
  const [ssssData, setSsssData] = useState<SsssApiResponse | null>(null);
  const [ssssLoading, setSsssLoading] = useState(false);
  const [ssssError, setSsssError] = useState<string | null>(null);
  
  // M3U8 state
  const [m3u8Streams, setM3u8Streams] = useState<M3U8Stream[]>([]);
  const [m3u8Loading, setM3u8Loading] = useState(false);
  const [m3u8Error, setM3u8Error] = useState<string | null>(null);
  
  // Clean sports state (ad-free)
  const [cleanStreams, setCleanStreams] = useState<CleanStream[]>([]);
  const [cleanLoading, setCleanLoading] = useState(false);
  const [cleanError, setCleanError] = useState<string | null>(null);
  
  // Football API state (RapidAPI)
  const [footballMatches, setFootballMatches] = useState<FootballMatch[]>([]);
  const [footballLoading, setFootballLoading] = useState(false);
  const [footballError, setFootballError] = useState<string | null>(null);
  const [footballStatus, setFootballStatus] = useState<'all' | 'live' | 'vs'>('all');
  const [footballLeague, setFootballLeague] = useState<string>('all');
  const [footballDate, setFootballDate] = useState<string>('');
  
  // SportsRC API state
  const [sportsrcCategories, setSportsrcCategories] = useState<SportsRCCategory[]>([]);
  const [sportsrcMatches, setSportsrcMatches] = useState<SportsRCMatch[]>([]);
  const [sportsrcCategory, setSportsrcCategory] = useState<string>('football');
  const [sportsrcLoading, setSportsrcLoading] = useState(false);
  const [sportsrcError, setSportsrcError] = useState<string | null>(null);
  const [sportsrcEmbed, setSportsrcEmbed] = useState<string | null>(null);
  
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

  // Popular leagues for filtering
  const popularLeagues = [
    'Premier League',
    'La Liga', 
    'Serie A',
    'Bundesliga',
    'Ligue 1',
    'Champions League',
    'Europa League',
    'MLS'
  ];

  // Fetch Football Live Streaming API (RapidAPI)
  const fetchFootballLive = async (status?: 'live' | 'vs' | 'all', league?: string, date?: string) => {
    setFootballLoading(true);
    setFootballError(null);
    
    try {
      console.log('⚽ Fetching Football Live Streaming API...');
      
      let url = `https://${RAPIDAPI_HOST}/matches?page=1`;
      if (status && status !== 'all') {
        url += `&status=${status}`;
      }
      if (league && league !== 'all') {
        url += `&league=${encodeURIComponent(league)}`;
      }
      if (date) {
        // Format date as DDMMYYYY
        url += `&date=${date}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'x-rapidapi-host': RAPIDAPI_HOST,
          'x-rapidapi-key': RAPIDAPI_KEY
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data: FootballApiResponse = await response.json();
      console.log('⚽ Football API Response:', data);
      
      if (data.matches) {
        setFootballMatches(data.matches);
        console.log(`✅ Loaded ${data.matches.length} football matches`);
        
        if (data.matches.length === 0) {
          setFootballError('No matches found. Try changing the status filter.');
        }
      } else {
        setFootballError('Invalid API response format');
      }
    } catch (err) {
      console.error('Football API Error:', err);
      setFootballError(err instanceof Error ? err.message : 'Failed to fetch football matches');
    } finally {
      setFootballLoading(false);
    }
  };

  // Fetch M3U8 playlist via edge function
  const fetchM3U8 = async () => {
    setM3u8Loading(true);
    setM3u8Error(null);
    
    try {
      console.log('🔄 Fetching streams via edge function...');
      const { data, error } = await supabase.functions.invoke('fetch-sports-streams');
      
      if (error) {
        throw error;
      }
      
      if (data?.success && data.streams) {
        console.log(`✅ Loaded ${data.streams.length} streams from edge function`);
        setM3u8Streams(data.streams);
        
        if (data.streams.length === 0) {
          setM3u8Error('No streams found from sources.');
        }
      } else {
        setM3u8Error(data?.error || 'Failed to fetch streams');
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

  // Fetch clean sports (ad-free with EPG)
  const fetchCleanSports = async () => {
    setCleanLoading(true);
    setCleanError(null);
    
    try {
      console.log('🔄 Fetching clean ad-free streams...');
      const { data, error } = await supabase.functions.invoke('fetch-clean-sports');
      
      if (error) throw error;
      
      if (data?.success && data.streams) {
        console.log(`✅ Loaded ${data.streams.length} clean streams`);
        setCleanStreams(data.streams);
        
        if (data.streams.length === 0) {
          setCleanError('No streams found.');
        }
      } else {
        setCleanError(data?.error || 'Failed to fetch streams');
      }
    } catch (err) {
      console.error('Clean sports fetch error:', err);
      setCleanError(err instanceof Error ? err.message : 'Failed to fetch streams');
    } finally {
      setCleanLoading(false);
    }
  };

  // ===== SportsRC API Functions =====
  const SPORTSRC_BASE = 'https://api.sportsrc.org';

  // Fetch SportsRC categories
  const fetchSportsrcCategories = async () => {
    try {
      console.log('🏀 Fetching SportsRC categories...');
      const response = await fetch(`${SPORTSRC_BASE}/?data=sports`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      console.log('📋 SportsRC categories:', data);
      if (Array.isArray(data)) {
        setSportsrcCategories(data);
      }
    } catch (err) {
      console.error('SportsRC categories error:', err);
    }
  };

  // Fetch SportsRC matches by category
  const fetchSportsrcMatches = async (category: string) => {
    setSportsrcLoading(true);
    setSportsrcError(null);
    setSportsrcEmbed(null);
    
    try {
      console.log(`🏀 Fetching SportsRC ${category} matches...`);
      const response = await fetch(`${SPORTSRC_BASE}/?data=matches&category=${category}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      console.log('⚽ SportsRC matches:', data);
      
      if (Array.isArray(data)) {
        setSportsrcMatches(data);
        if (data.length === 0) {
          setSportsrcError(`No ${category} matches found`);
        }
      } else if (data.matches && Array.isArray(data.matches)) {
        setSportsrcMatches(data.matches);
      } else {
        setSportsrcError('Invalid response format');
      }
    } catch (err) {
      console.error('SportsRC matches error:', err);
      setSportsrcError(err instanceof Error ? err.message : 'Failed to fetch matches');
    } finally {
      setSportsrcLoading(false);
    }
  };

  // Fetch SportsRC match detail (embed)
  const fetchSportsrcDetail = async (category: string, matchId: string) => {
    try {
      console.log(`🎬 Fetching SportsRC detail for ${matchId}...`);
      const response = await fetch(`${SPORTSRC_BASE}/?data=detail&category=${category}&id=${matchId}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      console.log('🎬 SportsRC detail:', data);
      
      if (data.embed) {
        setSportsrcEmbed(data.embed);
      } else if (data.url) {
        setSportsrcEmbed(data.url);
      } else {
        setSportsrcError('No stream embed found for this match');
      }
    } catch (err) {
      console.error('SportsRC detail error:', err);
      setSportsrcError(err instanceof Error ? err.message : 'Failed to fetch stream');
    }
  };

  // Auto-load Football API on mount
  useEffect(() => {
    fetchFootballLive(footballStatus, footballLeague, footballDate);
    fetchSportsrcCategories();
    fetchSportsrcMatches('football');
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

  const formatMatchTime = (timestamp: string) => {
    const date = new Date(parseInt(timestamp) * 1000);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleFootballServerClick = (match: FootballMatch, server: FootballServer) => {
    const matchName = `${match.home_team_name} vs ${match.away_team_name}`;
    
    if (server.type === 'drm') {
      setPlayerError('DRM streams require a special player (ExoPlayer/Shaka). Cannot play in browser.');
      setSelectedStream({ name: matchName, url: server.url });
      return;
    }
    
    // Use proxy for streams to handle CORS and custom headers
    const userAgent = server.header?.['user-agent'] || 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';
    const referer = server.header?.referer || '';
    
    // Build proxied URL through our edge function
    const proxyUrl = new URL('https://wxvsteaayxgygihpshoz.supabase.co/functions/v1/proxy-stream');
    proxyUrl.searchParams.set('url', server.url);
    proxyUrl.searchParams.set('ua', userAgent);
    if (referer) {
      proxyUrl.searchParams.set('referer', referer);
    }
    
    console.log('🎬 Using proxy URL:', proxyUrl.toString());
    
    setSelectedStream({ 
      name: `${matchName} - ${server.name}`, 
      url: proxyUrl.toString()
    });
  };

  const getServerBadgeColor = (type: string) => {
    switch (type) {
      case 'direct': return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'referer': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'drm': return 'bg-red-500/20 text-red-400 border-red-500/50';
      default: return 'bg-muted text-muted-foreground';
    }
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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="sportsrc">🌐 SportsRC</TabsTrigger>
            <TabsTrigger value="football">⚽ Football API</TabsTrigger>
            <TabsTrigger value="clean">Ad-Free</TabsTrigger>
            <TabsTrigger value="m3u8">M3U8</TabsTrigger>
            <TabsTrigger value="ssss">ssssdata</TabsTrigger>
          </TabsList>
          
          {/* SportsRC API Tab */}
          <TabsContent value="sportsrc" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="flex items-center gap-2">
                    <Play className="h-5 w-5 text-green-500" />
                    SportsRC API ({sportsrcMatches.length})
                  </CardTitle>
                  <Button 
                    onClick={() => fetchSportsrcMatches(sportsrcCategory)} 
                    variant="outline" 
                    size="sm" 
                    disabled={sportsrcLoading}
                  >
                    <RefreshCw className={`h-4 w-4 ${sportsrcLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Multi-sport streaming API with embed codes - api.sportsrc.org
                </p>
                
                {/* Category Pills */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {['football', 'basketball', 'tennis', 'mma', 'boxing', 'hockey', 'baseball', 'motorsport'].map(cat => (
                    <Button
                      key={cat}
                      variant={sportsrcCategory === cat ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setSportsrcCategory(cat);
                        fetchSportsrcMatches(cat);
                      }}
                    >
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </Button>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                {/* Embed Player */}
                {sportsrcEmbed && (
                  <div className="mb-4 relative">
                    <div className="flex justify-end mb-2">
                      <Button variant="ghost" size="sm" onClick={() => setSportsrcEmbed(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div 
                      className="aspect-video bg-black rounded-lg overflow-hidden"
                      dangerouslySetInnerHTML={{ __html: sportsrcEmbed }}
                    />
                  </div>
                )}
                
                {sportsrcLoading && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                )}
                
                {sportsrcError && (
                  <div className="text-center py-4">
                    <p className="text-destructive">{sportsrcError}</p>
                  </div>
                )}
                
                {!sportsrcLoading && !sportsrcError && sportsrcMatches.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No matches found. Try a different category.
                  </p>
                )}
                
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {sportsrcMatches.map((match, index) => (
                    <Card key={match.id || index} className="border border-border hover:border-primary/50 transition-colors">
                      <CardContent className="p-4 space-y-3">
                        {/* Match Header */}
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className="text-xs">
                            {match.category || sportsrcCategory}
                          </Badge>
                          {match.status && (
                            <Badge variant={match.status === 'live' ? 'destructive' : 'outline'}>
                              {match.status === 'live' ? '🔴 LIVE' : match.status}
                            </Badge>
                          )}
                        </div>
                        
                        {/* Title or Teams */}
                        {match.home_team && match.away_team ? (
                          <div className="flex items-center justify-between gap-2 text-sm">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {match.home_logo && (
                                <img src={match.home_logo} alt="" className="w-6 h-6 object-contain" />
                              )}
                              <span className="truncate font-medium">{match.home_team}</span>
                            </div>
                            <span className="text-muted-foreground">vs</span>
                            <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                              <span className="truncate font-medium text-right">{match.away_team}</span>
                              {match.away_logo && (
                                <img src={match.away_logo} alt="" className="w-6 h-6 object-contain" />
                              )}
                            </div>
                          </div>
                        ) : (
                          <h3 className="font-medium text-sm line-clamp-2">{match.title}</h3>
                        )}
                        
                        {/* Time & League */}
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          {match.date && <span>{match.date}</span>}
                          {match.time && <span>{match.time}</span>}
                          {match.league && <span>• {match.league}</span>}
                        </div>
                        
                        {/* Watch Button */}
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={() => fetchSportsrcDetail(match.category || sportsrcCategory, match.id)}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Watch Stream
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Football Live Streaming API Tab (RapidAPI) */}
          <TabsContent value="football" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="flex items-center gap-2">
                    <Play className="h-5 w-5 text-green-500" />
                    Football Live API ({footballMatches.length})
                  </CardTitle>
                  <Button onClick={() => fetchFootballLive(footballStatus, footballLeague, footballDate)} variant="outline" size="sm" disabled={footballLoading}>
                    <RefreshCw className={`h-4 w-4 ${footballLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  RapidAPI Football Live Streaming - Direct HLS streams with multiple servers per match
                </p>
                
                {/* Filters */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {/* Status Filter */}
                  <div className="flex gap-1">
                    <Button 
                      variant={footballStatus === 'all' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => { setFootballStatus('all'); fetchFootballLive('all', footballLeague, footballDate); }}
                    >
                      All
                    </Button>
                    <Button 
                      variant={footballStatus === 'live' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => { setFootballStatus('live'); fetchFootballLive('live', footballLeague, footballDate); }}
                    >
                      🔴 Live
                    </Button>
                    <Button 
                      variant={footballStatus === 'vs' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => { setFootballStatus('vs'); fetchFootballLive('vs', footballLeague, footballDate); }}
                    >
                      Upcoming
                    </Button>
                  </div>
                  
                  {/* League Filter */}
                  <Select 
                    value={footballLeague} 
                    onValueChange={(value) => { 
                      setFootballLeague(value); 
                      fetchFootballLive(footballStatus, value, footballDate); 
                    }}
                  >
                    <SelectTrigger className="w-[180px] h-8">
                      <Filter className="h-3 w-3 mr-1" />
                      <SelectValue placeholder="All Leagues" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Leagues</SelectItem>
                      {popularLeagues.map(league => (
                        <SelectItem key={league} value={league}>{league}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {/* Date Filter */}
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <Input
                      type="date"
                      className="h-8 w-[140px]"
                      value={footballDate ? `${footballDate.slice(4, 8)}-${footballDate.slice(2, 4)}-${footballDate.slice(0, 2)}` : ''}
                      onChange={(e) => {
                        const date = e.target.value;
                        if (date) {
                          // Convert YYYY-MM-DD to DDMMYYYY
                          const parts = date.split('-');
                          const formatted = `${parts[2]}${parts[1]}${parts[0]}`;
                          setFootballDate(formatted);
                          fetchFootballLive(footballStatus, footballLeague, formatted);
                        } else {
                          setFootballDate('');
                          fetchFootballLive(footballStatus, footballLeague, '');
                        }
                      }}
                    />
                    {footballDate && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 px-2"
                        onClick={() => { setFootballDate(''); fetchFootballLive(footballStatus, footballLeague, ''); }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {footballLoading && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                )}
                
                {footballError && (
                  <div className="text-center py-8">
                    <p className="text-destructive mb-4">{footballError}</p>
                  </div>
                )}
                
                {!footballLoading && !footballError && footballMatches.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No matches found. Try a different status filter.
                  </p>
                )}
                
                <div className="grid gap-4 md:grid-cols-2">
                  {footballMatches.map((match, index) => (
                    <Card key={index} className="border border-border overflow-hidden">
                      <CardContent className="p-4 space-y-3">
                        {/* League Header */}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {match.league_logo && (
                            <img 
                              src={match.league_logo} 
                              alt="" 
                              className="w-4 h-4 object-contain" 
                              onError={(e) => (e.target as HTMLImageElement).style.display = 'none'} 
                            />
                          )}
                          <span>{match.league_name}</span>
                          <Badge 
                            variant={match.match_status === 'live' ? 'destructive' : 'secondary'}
                            className="ml-auto"
                          >
                            {match.match_status === 'live' ? '🔴 LIVE' : formatMatchTime(match.match_time)}
                          </Badge>
                        </div>
                        
                        {/* Teams */}
                        <div className="flex items-center justify-between gap-2">
                          {/* Home Team */}
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {match.home_team_logo && (
                              <img 
                                src={match.home_team_logo} 
                                alt="" 
                                className="w-8 h-8 object-contain shrink-0" 
                                onError={(e) => (e.target as HTMLImageElement).style.display = 'none'} 
                              />
                            )}
                            <span className="font-medium text-sm truncate">{match.home_team_name}</span>
                          </div>
                          
                          {/* Score */}
                          <div className="flex items-center gap-1 shrink-0 px-3 py-1 bg-muted rounded-md">
                            <span className="font-bold text-lg">{match.homeTeamScore || '-'}</span>
                            <span className="text-muted-foreground">:</span>
                            <span className="font-bold text-lg">{match.awayTeamScore || '-'}</span>
                          </div>
                          
                          {/* Away Team */}
                          <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                            <span className="font-medium text-sm truncate text-right">{match.away_team_name}</span>
                            {match.away_team_logo && (
                              <img 
                                src={match.away_team_logo} 
                                alt="" 
                                className="w-8 h-8 object-contain shrink-0" 
                                onError={(e) => (e.target as HTMLImageElement).style.display = 'none'} 
                              />
                            )}
                          </div>
                        </div>
                        
                        {/* Stream Servers */}
                        {match.servers && match.servers.length > 0 && (
                          <div className="space-y-2 pt-2 border-t border-border">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Server className="h-3 w-3" />
                              <span>{match.servers.length} servers available</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {match.servers.map((server, serverIndex) => (
                                <Button
                                  key={serverIndex}
                                  variant="outline"
                                  size="sm"
                                  className={`text-xs ${getServerBadgeColor(server.type)}`}
                                  onClick={() => handleFootballServerClick(match, server)}
                                >
                                  <Play className="h-3 w-3 mr-1" />
                                  {server.name}
                                  {server.type === 'drm' && (
                                    <AlertTriangle className="h-3 w-3 ml-1" />
                                  )}
                                </Button>
                              ))}
                            </div>
                            <div className="flex gap-2 text-[10px] text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span> Direct
                              </span>
                              <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-yellow-500"></span> Referer
                              </span>
                              <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-red-500"></span> DRM (unsupported)
                              </span>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Clean Ad-Free Sports Tab */}
          <TabsContent value="clean" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Play className="h-5 w-5 text-green-500" />
                    Ad-Free Sports Streams ({cleanStreams.length})
                  </CardTitle>
                  <Button onClick={fetchCleanSports} variant="outline" size="sm" disabled={cleanLoading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${cleanLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Direct HLS streams with EPG schedule data - No iframe ads
                </p>
              </CardHeader>
              <CardContent>
                {cleanLoading && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                )}
                
                {cleanError && (
                  <div className="text-center py-8">
                    <p className="text-destructive mb-4">{cleanError}</p>
                  </div>
                )}
                
                {!cleanLoading && !cleanError && cleanStreams.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No streams loaded. Click Refresh to try again.
                  </p>
                )}
                
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {cleanStreams.map((stream, index) => (
                    <Card 
                      key={index} 
                      className="border border-border hover:border-green-500 transition-colors cursor-pointer" 
                      onClick={() => setSelectedStream({ name: stream.name, url: stream.url })}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          {stream.logo && (
                            <img 
                              src={stream.logo} 
                              alt="" 
                              className="w-8 h-8 object-contain" 
                              onError={(e) => (e.target as HTMLImageElement).style.display = 'none'} 
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm truncate">{stream.name}</h3>
                            {stream.currentProgram && (
                              <p className="text-xs text-green-500 truncate">▶ {stream.currentProgram}</p>
                            )}
                            <Badge variant="secondary" className="text-xs">{stream.category}</Badge>
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
                    <Card key={index} className="border border-border hover:border-green-500 transition-colors cursor-pointer" onClick={() => setSelectedStream({ name: stream.name, url: stream.url })}>
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
