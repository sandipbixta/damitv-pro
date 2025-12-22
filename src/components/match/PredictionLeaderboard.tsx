import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Trophy, Medal, TrendingUp, Target } from 'lucide-react';

interface LeaderboardEntry {
  display_name: string;
  total_predictions: number;
  correct_predictions: number;
  total_points: number;
  accuracy_percentage: number;
}

export const PredictionLeaderboard = () => {
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    const { data, error } = await supabase
      .from('prediction_leaderboard')
      .select('*')
      .limit(10);

    if (!error && data) {
      setLeaders(data);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/2" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted rounded" />
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (leaders.length === 0) {
    return (
      <Card className="p-6 bg-muted/30">
        <div className="text-center">
          <Trophy className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-muted-foreground">
            No predictions yet. Be the first to make a prediction!
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Trophy className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Top Predictors</h3>
      </div>

      <div className="space-y-3">
        {leaders.map((leader, index) => (
          <div
            key={`${leader.display_name}-${index}`}
            className={`p-4 rounded-lg border transition-colors ${
              index === 0
                ? 'bg-gradient-to-r from-yellow-500/20 to-yellow-500/10 border-yellow-500/30'
                : index === 1
                ? 'bg-gradient-to-r from-gray-400/20 to-gray-400/10 border-gray-400/30'
                : index === 2
                ? 'bg-gradient-to-r from-orange-600/20 to-orange-600/10 border-orange-600/30'
                : 'bg-muted/30 hover:bg-muted/50'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                {index === 0 ? (
                  <Trophy className="w-6 h-6 text-yellow-500" />
                ) : index === 1 ? (
                  <Medal className="w-6 h-6 text-gray-400" />
                ) : index === 2 ? (
                  <Medal className="w-6 h-6 text-orange-600" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-semibold">
                    {index + 1}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{leader.display_name}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    {leader.total_predictions} predictions
                  </span>
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {leader.accuracy_percentage}% accuracy
                  </span>
                </div>
              </div>

              <div className="text-right">
                <p className="text-2xl font-bold text-primary">{leader.total_points}</p>
                <p className="text-xs text-muted-foreground">points</p>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all"
                  style={{ width: `${leader.accuracy_percentage}%` }}
                />
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                {leader.correct_predictions}/{leader.total_predictions}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
