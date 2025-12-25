import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, Play, ExternalLink } from 'lucide-react';

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

interface ApiResponse {
  sports: Sport[];
  tournaments: Tournament[];
  items: {
    live: LiveStream[];
  };
}

const API_URL = 'https://api.ssssdata.com/v1.1/stream/list?language=en&access-token=SMB9MtuEJTs6FdH_owwf0QXWtqoyJ0';

const ApiTest = () => {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      console.log('API Response:', result);
      setData(result);
    } catch (err) {
      console.error('API Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getSportName = (sportId: number) => {
    return data?.sports.find(s => s.id === sportId)?.name || 'Unknown';
  };

  const getTournamentName = (tournamentId: number) => {
    return data?.tournaments.find(t => t.id === tournamentId)?.name || 'Unknown';
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-destructive">Error: {error}</p>
        <Button onClick={fetchData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">API Test - ssssdata.com</h1>
          <Button onClick={fetchData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Sports */}
        <Card>
          <CardHeader>
            <CardTitle>Sports ({data?.sports.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {data?.sports.map(sport => (
                <Badge key={sport.id} variant="secondary">
                  {sport.name} (ID: {sport.id})
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Live Streams */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5 text-red-500" />
              Live Streams ({data?.items.live.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {data?.items.live.map(stream => (
                <Card key={stream.stream_id} className="border border-border">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-sm text-foreground line-clamp-2">
                        {stream.name}
                      </h3>
                      <Badge variant="destructive" className="shrink-0">LIVE</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>Sport: {getSportName(stream.sport_id)}</p>
                      <p>Tournament: {getTournamentName(stream.tournament_id)}</p>
                      <p>Start: {formatTime(stream.start)}</p>
                      <p className="text-[10px]">Stream ID: {stream.stream_id}</p>
                    </div>
                    <a 
                      href={stream.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      Open Stream <ExternalLink className="h-3 w-3" />
                    </a>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {data?.items.live.length === 0 && (
              <p className="text-muted-foreground text-center py-8">No live streams available</p>
            )}
          </CardContent>
        </Card>

        {/* Raw JSON */}
        <Card>
          <CardHeader>
            <CardTitle>Raw Response</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-96 text-xs">
              {JSON.stringify(data, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ApiTest;
