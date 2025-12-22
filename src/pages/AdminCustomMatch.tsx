import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus, Eye, EyeOff, Play, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import PageLayout from '@/components/PageLayout';

export interface CustomMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  imageUrl: string;
  streamUrl: string;
  date: string;
  visible: boolean;
  category?: string;
}

const STORAGE_KEY = 'damitv_custom_matches';
const ADMIN_KEY = 'damitv_admin_auth';

const AdminCustomMatch = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [matches, setMatches] = useState<CustomMatch[]>([]);
  
  // Form state
  const [homeTeam, setHomeTeam] = useState('');
  const [awayTeam, setAwayTeam] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [streamUrl, setStreamUrl] = useState('');
  const [matchDate, setMatchDate] = useState('');
  const [category, setCategory] = useState('Football');

  // Check if already authenticated
  useEffect(() => {
    const auth = sessionStorage.getItem(ADMIN_KEY);
    if (auth === 'authenticated') {
      setIsAuthenticated(true);
    }
    
    // Load existing matches
    const savedMatches = localStorage.getItem(STORAGE_KEY);
    if (savedMatches) {
      setMatches(JSON.parse(savedMatches));
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple password protection - change this to your desired password
    if (password === 'damitv2024admin') {
      sessionStorage.setItem(ADMIN_KEY, 'authenticated');
      setIsAuthenticated(true);
      toast({ title: 'Logged in successfully' });
    } else {
      toast({ title: 'Invalid password', variant: 'destructive' });
    }
  };

  const saveMatches = (updatedMatches: CustomMatch[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedMatches));
    setMatches(updatedMatches);
  };

  const handleAddMatch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!homeTeam || !awayTeam || !streamUrl) {
      toast({ title: 'Please fill in required fields', variant: 'destructive' });
      return;
    }

    // Convert datetime-local value to ISO string
    let dateValue = new Date().toISOString();
    if (matchDate) {
      const parsedDate = new Date(matchDate);
      if (!isNaN(parsedDate.getTime())) {
        dateValue = parsedDate.toISOString();
      }
    }

    const newMatch: CustomMatch = {
      id: `custom-${Date.now()}`,
      homeTeam,
      awayTeam,
      imageUrl,
      streamUrl,
      date: dateValue,
      visible: true,
      category,
    };

    const updatedMatches = [...matches, newMatch];
    saveMatches(updatedMatches);
    
    // Reset form
    setHomeTeam('');
    setAwayTeam('');
    setImageUrl('');
    setStreamUrl('');
    setMatchDate('');
    setCategory('Football');
    
    toast({ title: 'Match added successfully!' });
  };

  const toggleVisibility = (id: string) => {
    const updatedMatches = matches.map(m => 
      m.id === id ? { ...m, visible: !m.visible } : m
    );
    saveMatches(updatedMatches);
  };

  const deleteMatch = (id: string) => {
    const updatedMatches = matches.filter(m => m.id !== id);
    saveMatches(updatedMatches);
    toast({ title: 'Match deleted' });
  };

  const previewMatch = (match: CustomMatch) => {
    navigate(`/custom-match/${match.id}`);
  };

  if (!isAuthenticated) {
    return (
      <PageLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Card className="w-full max-w-md bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Admin Access</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter admin password"
                    className="bg-background border-border"
                  />
                </div>
                <Button type="submit" className="w-full">
                  Login
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-2xl font-bold text-foreground mb-8">Add Custom Match</h1>
        
        {/* Add Match Form */}
        <Card className="mb-8 bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Plus size={20} /> New Match
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddMatch} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="homeTeam">Home Team *</Label>
                  <Input
                    id="homeTeam"
                    value={homeTeam}
                    onChange={(e) => setHomeTeam(e.target.value)}
                    placeholder="e.g., Manchester United"
                    className="bg-background border-border"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="awayTeam">Away Team *</Label>
                  <Input
                    id="awayTeam"
                    value={awayTeam}
                    onChange={(e) => setAwayTeam(e.target.value)}
                    placeholder="e.g., Liverpool"
                    className="bg-background border-border"
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="imageUrl">Match Image URL</Label>
                <Input
                  id="imageUrl"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/match-image.jpg"
                  className="bg-background border-border"
                />
              </div>
              
              <div>
                <Label htmlFor="streamUrl">Stream URL (M3U8/Embed) *</Label>
                <Input
                  id="streamUrl"
                  value={streamUrl}
                  onChange={(e) => setStreamUrl(e.target.value)}
                  placeholder="https://example.com/stream.m3u8 or embed URL"
                  className="bg-background border-border"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="matchDate">Match Date & Time</Label>
                  <Input
                    id="matchDate"
                    type="datetime-local"
                    value={matchDate}
                    onChange={(e) => setMatchDate(e.target.value)}
                    className="bg-background border-border [color-scheme:dark]"
                    placeholder="Select date and time"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Click to pick date/time</p>
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Football, Basketball, etc."
                    className="bg-background border-border"
                  />
                </div>
              </div>
              
              <Button type="submit" className="w-full">
                <Save className="mr-2" size={16} /> Add Match
              </Button>
            </form>
          </CardContent>
        </Card>
        
        {/* Existing Matches */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Existing Custom Matches ({matches.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {matches.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No custom matches added yet.</p>
            ) : (
              <div className="space-y-4">
                {matches.map((match) => (
                  <div
                    key={match.id}
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      match.visible ? 'border-primary/50 bg-primary/5' : 'border-border bg-muted/20'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {match.imageUrl && (
                        <img
                          src={match.imageUrl}
                          alt={`${match.homeTeam} vs ${match.awayTeam}`}
                          className="w-16 h-10 object-cover rounded"
                        />
                      )}
                      <div>
                        <p className="font-semibold text-foreground">
                          {match.homeTeam} vs {match.awayTeam}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {match.category} • {new Date(match.date).toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground truncate max-w-xs">
                          {match.streamUrl}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => previewMatch(match)}
                        title="Preview"
                      >
                        <Play size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleVisibility(match.id)}
                        title={match.visible ? 'Hide' : 'Show'}
                      >
                        {match.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMatch(match.id)}
                        className="text-destructive hover:text-destructive"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default AdminCustomMatch;
