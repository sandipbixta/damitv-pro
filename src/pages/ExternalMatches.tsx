import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import Hls from 'hls.js';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Play, RefreshCw, Tv, Trophy, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import MainNav from '@/components/MainNav';
import Footer from '@/components/Footer';

interface ExternalMatch {
  id: string;
  title: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  time: string;
  status: string;
  streamUrl: string;
  thumbnail?: string;
}

const ExternalMatches: React.FC = () => {
  const [matches, setMatches] = useState<ExternalMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<ExternalMatch | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const { toast } = useToast();

  const fetchMatches = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke('fetch-external-matches');
      
      if (fnError) throw fnError;
      
      if (data.success && data.matches) {
        setMatches(data.matches);
        if (data.matches.length === 0) {
          toast({
            title: 'No Matches Found',
            description: 'No live matches available at the moment',
          });
        }
      } else {
        setError(data.error || 'Failed to fetch matches');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch matches');
      toast({
        title: 'Error',
        description: 'Failed to load matches. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  useEffect(() => {
    if (!selectedMatch || !videoRef.current) return;

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
      hls.loadSource(selectedMatch.streamUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          toast({
            title: 'Stream Error',
            description: 'Failed to load stream. It may have CORS restrictions.',
            variant: 'destructive',
          });
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = selectedMatch.streamUrl;
      video.play().catch(() => {});
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [selectedMatch, toast]);

  return (
    <>
      <Helmet>
        <title>Live Matches - External Streams</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <MainNav />
        
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Live Matches</h1>
              <p className="text-muted-foreground">
                Auto-extracted streams from external sources
              </p>
            </div>
            <Button 
              onClick={fetchMatches} 
              disabled={isLoading}
              variant="outline"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Refresh
            </Button>
          </div>

          {/* Video Player */}
          {selectedMatch && (
            <Card className="mb-8">
              <CardContent className="p-4">
                <div className="flex items-center gap-4 mb-4">
                  <Badge variant="destructive" className="animate-pulse">LIVE</Badge>
                  <h2 className="text-xl font-bold">{selectedMatch.title}</h2>
                  <Badge variant="outline">{selectedMatch.league}</Badge>
                </div>
                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    className="w-full h-full"
                    controls
                    playsInline
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading live matches...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <Card className="border-destructive">
              <CardContent className="p-6 text-center">
                <p className="text-destructive mb-4">{error}</p>
                <Button onClick={fetchMatches}>Try Again</Button>
              </CardContent>
            </Card>
          )}

          {/* Match Cards Grid */}
          {!isLoading && !error && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {matches.map((match) => (
                <Card 
                  key={match.id}
                  className={`cursor-pointer transition-all hover:border-primary/50 hover:shadow-lg ${
                    selectedMatch?.id === match.id ? 'border-primary ring-2 ring-primary/20' : ''
                  }`}
                  onClick={() => setSelectedMatch(match)}
                >
                  <CardContent className="p-0">
                    {/* Match Header */}
                    <div className="p-4 bg-gradient-to-r from-primary/10 to-primary/5">
                      <div className="flex items-center justify-between mb-2">
                        <Badge 
                          variant={match.status === 'LIVE' ? 'destructive' : 'secondary'}
                          className={match.status === 'LIVE' ? 'animate-pulse' : ''}
                        >
                          {match.status}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {match.time}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Trophy className="w-4 h-4" />
                        {match.league}
                      </div>
                    </div>

                    {/* Teams */}
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-center flex-1">
                          <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-muted flex items-center justify-center">
                            <Tv className="w-6 h-6 text-muted-foreground" />
                          </div>
                          <p className="font-semibold text-sm">{match.homeTeam}</p>
                        </div>
                        
                        <div className="px-4">
                          <span className="text-2xl font-bold text-muted-foreground">VS</span>
                        </div>
                        
                        <div className="text-center flex-1">
                          <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-muted flex items-center justify-center">
                            <Tv className="w-6 h-6 text-muted-foreground" />
                          </div>
                          <p className="font-semibold text-sm">{match.awayTeam}</p>
                        </div>
                      </div>

                      <Button 
                        className="w-full"
                        variant={selectedMatch?.id === match.id ? 'default' : 'outline'}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        {selectedMatch?.id === match.id ? 'Now Playing' : 'Watch Live'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && matches.length === 0 && (
            <div className="text-center py-20">
              <Tv className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No Live Matches</h3>
              <p className="text-muted-foreground mb-4">
                There are no live matches available at the moment.
              </p>
              <Button onClick={fetchMatches}>Refresh</Button>
            </div>
          )}
        </main>
        
        <Footer />
      </div>
    </>
  );
};

export default ExternalMatches;
