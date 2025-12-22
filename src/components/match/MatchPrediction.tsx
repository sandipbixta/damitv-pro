import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Trophy, TrendingUp, Users, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Prediction {
  id: string;
  predicted_winner: string;
  predicted_score_home: number | null;
  predicted_score_away: number | null;
  confidence_level: string;
}

interface MatchPredictionProps {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  matchStartTime: Date;
}

export const MatchPrediction = ({ 
  matchId, 
  homeTeam, 
  awayTeam, 
  matchStartTime 
}: MatchPredictionProps) => {
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [selectedWinner, setSelectedWinner] = useState<string>('');
  const [scoreHome, setScoreHome] = useState('');
  const [scoreAway, setScoreAway] = useState('');
  const [confidence, setConfidence] = useState<'low' | 'medium' | 'high'>('medium');
  const [displayName, setDisplayName] = useState('Anonymous');
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, homeWins: 0, awayWins: 0, draws: 0 });
  const sessionId = crypto.randomUUID();

  const isMatchStarted = new Date() >= matchStartTime;

  useEffect(() => {
    loadPrediction();
    loadStats();
  }, [matchId]);

  const loadPrediction = async () => {
    const { data } = await supabase
      .from('match_predictions')
      .select('*')
      .eq('match_id', matchId)
      .eq('session_id', sessionId)
      .maybeSingle();

    if (data) {
      setPrediction(data);
      setSelectedWinner(data.predicted_winner);
      setScoreHome(data.predicted_score_home?.toString() || '');
      setScoreAway(data.predicted_score_away?.toString() || '');
      setConfidence(data.confidence_level as any);
    }
  };

  const loadStats = async () => {
    const { data } = await supabase
      .from('match_predictions')
      .select('predicted_winner')
      .eq('match_id', matchId);

    if (data) {
      const total = data.length;
      const homeWins = data.filter(p => p.predicted_winner === homeTeam).length;
      const awayWins = data.filter(p => p.predicted_winner === awayTeam).length;
      const draws = data.filter(p => p.predicted_winner === 'draw').length;
      
      setStats({ total, homeWins, awayWins, draws });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedWinner) {
      toast.error('Please select a winner');
      return;
    }

    setIsLoading(true);

    const predictionData = {
      match_id: matchId,
      session_id: sessionId,
      display_name: displayName,
      predicted_winner: selectedWinner,
      predicted_score_home: scoreHome ? parseInt(scoreHome) : null,
      predicted_score_away: scoreAway ? parseInt(scoreAway) : null,
      confidence_level: confidence,
      match_start_time: matchStartTime.toISOString()
    };

    const { error } = prediction
      ? await supabase
          .from('match_predictions')
          .update(predictionData)
          .eq('id', prediction.id)
      : await supabase
          .from('match_predictions')
          .insert(predictionData);

    if (error) {
      toast.error('Failed to save prediction');
    } else {
      toast.success(prediction ? 'Prediction updated!' : 'Prediction saved!');
      loadPrediction();
      loadStats();
    }

    setIsLoading(false);
  };

  if (isMatchStarted && !prediction) {
    return (
      <Card className="p-6 bg-muted/30">
        <div className="text-center">
          <Trophy className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-muted-foreground">
            Match has started. Predictions are closed.
          </p>
        </div>
      </Card>
    );
  }

  if (prediction && isMatchStarted) {
    return (
      <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Your Prediction</h3>
        </div>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">Winner</p>
            <p className="font-semibold text-lg">{prediction.predicted_winner}</p>
          </div>
          {prediction.predicted_score_home !== null && (
            <div>
              <p className="text-sm text-muted-foreground">Predicted Score</p>
              <p className="font-semibold">
                {prediction.predicted_score_home} - {prediction.predicted_score_away}
              </p>
            </div>
          )}
          <div>
            <p className="text-sm text-muted-foreground">Confidence</p>
            <p className="font-semibold capitalize">{prediction.confidence_level}</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Make Your Prediction</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label className="text-sm font-medium mb-3 block">Who will win?</Label>
            <RadioGroup value={selectedWinner} onValueChange={setSelectedWinner}>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent transition-colors">
                  <RadioGroupItem value={homeTeam} id="home" />
                  <Label htmlFor="home" className="flex-1 cursor-pointer font-medium">
                    {homeTeam}
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent transition-colors">
                  <RadioGroupItem value={awayTeam} id="away" />
                  <Label htmlFor="away" className="flex-1 cursor-pointer font-medium">
                    {awayTeam}
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent transition-colors">
                  <RadioGroupItem value="draw" id="draw" />
                  <Label htmlFor="draw" className="flex-1 cursor-pointer font-medium">
                    Draw
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label className="text-sm font-medium mb-3 block">Predicted Score (Optional)</Label>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                min="0"
                max="20"
                placeholder="0"
                value={scoreHome}
                onChange={(e) => setScoreHome(e.target.value)}
                className="text-center"
              />
              <span className="text-muted-foreground font-semibold">-</span>
              <Input
                type="number"
                min="0"
                max="20"
                placeholder="0"
                value={scoreAway}
                onChange={(e) => setScoreAway(e.target.value)}
                className="text-center"
              />
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium mb-3 block">Confidence Level</Label>
            <RadioGroup value={confidence} onValueChange={(v: any) => setConfidence(v)}>
              <div className="grid grid-cols-3 gap-2">
                {(['low', 'medium', 'high'] as const).map((level) => (
                  <div key={level} className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent transition-colors">
                    <RadioGroupItem value={level} id={level} />
                    <Label htmlFor={level} className="flex-1 cursor-pointer capitalize">
                      {level}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading || !selectedWinner}>
            {prediction ? 'Update Prediction' : 'Submit Prediction'}
          </Button>
        </form>
      </Card>

      {stats.total > 0 && (
        <Card className="p-6 bg-muted/30">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Community Predictions</h3>
            <span className="text-xs text-muted-foreground ml-auto">
              <Users className="w-3 h-3 inline mr-1" />
              {stats.total} predictions
            </span>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">{homeTeam}</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all"
                    style={{ width: `${(stats.homeWins / stats.total) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium w-12 text-right">
                  {Math.round((stats.homeWins / stats.total) * 100)}%
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Draw</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary/60 transition-all"
                    style={{ width: `${(stats.draws / stats.total) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium w-12 text-right">
                  {Math.round((stats.draws / stats.total) * 100)}%
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">{awayTeam}</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all"
                    style={{ width: `${(stats.awayWins / stats.total) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium w-12 text-right">
                  {Math.round((stats.awayWins / stats.total) * 100)}%
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
