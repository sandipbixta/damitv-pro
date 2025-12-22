import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, MessageCircle, Trophy, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trackChatMessage } from '@/utils/videoAnalytics';

interface Message {
  id: string;
  display_name: string;
  message: string;
  created_at: string;
}

interface LiveChatProps {
  matchId: string;
  matchTitle: string;
  homeTeam?: string;
  awayTeam?: string;
  matchStartTime?: Date;
}

interface VoteStats {
  homeVotes: number;
  awayVotes: number;
  drawVotes: number;
  totalVotes: number;
}

interface LeaderboardEntry {
  display_name: string;
  total_points: number;
  accuracy_percentage: number;
  total_predictions: number;
}

export const LiveChat = ({ matchId, matchTitle, homeTeam = 'Home', awayTeam = 'Away', matchStartTime }: LiveChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isNameSet, setIsNameSet] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [voteStats, setVoteStats] = useState<VoteStats>({ homeVotes: 0, awayVotes: 0, drawVotes: 0, totalVotes: 0 });
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userVote, setUserVote] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sessionId = useRef(crypto.randomUUID());

  // Load predictions and voting stats
  useEffect(() => {
    loadVoteStats();
    loadLeaderboard();
    checkUserVote();
    
    const predictionChannel = supabase
      .channel(`predictions-${matchId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'match_predictions',
          filter: `match_id=eq.${matchId}`
        },
        () => {
          loadVoteStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(predictionChannel);
    };
  }, [matchId]);

  // Load messages and subscribe to new ones
  useEffect(() => {
    loadMessages();
    
    const channel = supabase
      .channel(`chat-${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `match_id=eq.${matchId}`
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadVoteStats = async () => {
    const { data, error } = await supabase
      .from('match_predictions')
      .select('predicted_winner')
      .eq('match_id', matchId);

    if (!error && data) {
      const homeVotes = data.filter(p => p.predicted_winner === homeTeam).length;
      const awayVotes = data.filter(p => p.predicted_winner === awayTeam).length;
      const drawVotes = data.filter(p => p.predicted_winner === 'Draw').length;
      setVoteStats({
        homeVotes,
        awayVotes,
        drawVotes,
        totalVotes: data.length
      });
    }
  };

  const loadLeaderboard = async () => {
    const { data, error } = await supabase
      .from('prediction_leaderboard')
      .select('*')
      .order('total_points', { ascending: false })
      .limit(5);

    if (!error && data) {
      setLeaderboard(data);
    }
  };

  const checkUserVote = async () => {
    const { data } = await supabase
      .from('match_predictions')
      .select('predicted_winner')
      .eq('match_id', matchId)
      .eq('session_id', sessionId.current)
      .maybeSingle();

    if (data) {
      setUserVote(data.predicted_winner);
    }
  };

  const handleVote = async (team: string) => {
    if (!isNameSet) {
      toast.error('Please set your display name first');
      return;
    }

    if (userVote) {
      toast.error('You have already voted for this match');
      return;
    }

    // Use provided match start time or default to 1 hour from now
    const startTime = matchStartTime || new Date(Date.now() + 60 * 60 * 1000);

    const { error } = await supabase
      .from('match_predictions')
      .insert({
        match_id: matchId,
        session_id: sessionId.current,
        display_name: displayName,
        predicted_winner: team,
        match_start_time: startTime.toISOString()
      });

    if (error) {
      console.error('Vote error:', error);
      toast.error('Failed to submit vote');
    } else {
      setUserVote(team);
      toast.success(`Voted for ${team}!`);
      loadVoteStats();
    }
  };

  const loadMessages = async () => {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) {
      toast.error('Failed to load messages');
      return;
    }

    setMessages(data || []);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;
    
    setIsLoading(true);

    const { error } = await supabase
      .from('chat_messages')
      .insert({
        match_id: matchId,
        session_id: sessionId.current,
        display_name: displayName,
        message: newMessage.trim()
      });

    if (error) {
      toast.error('Failed to send message');
    } else {
      setNewMessage('');
      // Track chat message in GA4
      trackChatMessage(matchId);
    }

    setIsLoading(false);
  };

  const handleSetName = (e: React.FormEvent) => {
    e.preventDefault();
    if (displayName.trim()) {
      setIsNameSet(true);
      localStorage.setItem('chat_display_name', displayName);
    }
  };

  // Load saved display name
  useEffect(() => {
    const savedName = localStorage.getItem('chat_display_name');
    if (savedName) {
      setDisplayName(savedName);
      setIsNameSet(true);
    }
  }, []);

  if (!isNameSet) {
    return (
      <div className="p-6 bg-card rounded-lg border">
        <div className="flex items-center gap-2 mb-4">
          <MessageCircle className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Join Live Chat</h3>
        </div>
        <form onSubmit={handleSetName} className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">
              Enter your display name to start chatting
            </label>
            <Input
              placeholder="Your name..."
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={20}
              required
            />
          </div>
          <Button type="submit" className="w-full">
            Join Chat
          </Button>
        </form>
      </div>
    );
  }

  const homePercentage = voteStats.totalVotes > 0 ? (voteStats.homeVotes / voteStats.totalVotes) * 100 : 0;
  const awayPercentage = voteStats.totalVotes > 0 ? (voteStats.awayVotes / voteStats.totalVotes) * 100 : 0;
  const drawPercentage = voteStats.totalVotes > 0 ? (voteStats.drawVotes / voteStats.totalVotes) * 100 : 0;

  return (
    <div className="flex flex-col h-[500px] lg:h-[calc(100vh-200px)] bg-card rounded-lg border overflow-hidden">
      <Tabs defaultValue="chat" className="flex flex-col h-full">
        <div className="p-4 border-b bg-muted/30">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chat" className="text-xs">
              <MessageCircle className="w-4 h-4 mr-1" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="predictions" className="text-xs">
              <Trophy className="w-4 h-4 mr-1" />
              Predictions
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="predictions" className="flex-1 p-4 space-y-4 overflow-auto mt-0">
          {/* Voting Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-primary" />
              <h4 className="font-semibold text-sm">Vote for Winner</h4>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => handleVote(homeTeam)}
                disabled={!!userVote}
                variant={userVote === homeTeam ? "default" : "outline"}
                className="h-auto py-3 flex flex-col gap-1"
              >
                <span className="font-semibold text-sm">{homeTeam}</span>
                <span className="text-xs opacity-80">{homePercentage.toFixed(1)}%</span>
              </Button>
              <Button
                onClick={() => handleVote(awayTeam)}
                disabled={!!userVote}
                variant={userVote === awayTeam ? "default" : "outline"}
                className="h-auto py-3 flex flex-col gap-1"
              >
                <span className="font-semibold text-sm">{awayTeam}</span>
                <span className="text-xs opacity-80">{awayPercentage.toFixed(1)}%</span>
              </Button>
            </div>

            <Button
              onClick={() => handleVote('Draw')}
              disabled={!!userVote}
              variant={userVote === 'Draw' ? "default" : "outline"}
              className="w-full h-auto py-3 flex flex-col gap-1"
            >
              <span className="font-semibold text-sm">Draw</span>
              <span className="text-xs opacity-80">{drawPercentage.toFixed(1)}%</span>
            </Button>

            {userVote && (
              <p className="text-xs text-center text-muted-foreground">
                You voted for <span className="font-medium text-foreground">{userVote}</span>
              </p>
            )}

            <div className="text-center text-xs text-muted-foreground mt-2">
              Total votes: {voteStats.totalVotes}
            </div>
          </div>

          {/* Vote Distribution */}
          <div className="space-y-2 pt-2 border-t">
            <h5 className="text-xs font-semibold mb-2">Vote Distribution</h5>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>{homeTeam}</span>
                  <span className="font-medium">{voteStats.homeVotes}</span>
                </div>
                <Progress value={homePercentage} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>{awayTeam}</span>
                  <span className="font-medium">{voteStats.awayVotes}</span>
                </div>
                <Progress value={awayPercentage} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Draw</span>
                  <span className="font-medium">{voteStats.drawVotes}</span>
                </div>
                <Progress value={drawPercentage} className="h-2" />
              </div>
            </div>
          </div>

          {/* Mini Leaderboard */}
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <h5 className="text-xs font-semibold">Top Predictors</h5>
            </div>
            {leaderboard.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                No predictions yet
              </p>
            ) : (
              <div className="space-y-2">
                {leaderboard.map((entry, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted/30 rounded text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-primary">#{index + 1}</span>
                      <span className="font-medium">{entry.display_name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{entry.total_points} pts</div>
                      <div className="text-muted-foreground text-[10px]">
                        {entry.accuracy_percentage?.toFixed(0)}% accuracy
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="chat" className="flex-1 flex flex-col mt-0 overflow-hidden">
          <div className="p-4 border-b bg-muted/30">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Chatting as <span className="font-medium">{displayName}</span>
              </p>
              <span className="text-xs text-muted-foreground">{messages.length} messages</span>
            </div>
          </div>

          <ScrollArea ref={scrollRef} className="flex-1 p-4">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No messages yet. Be the first to chat!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div key={msg.id} className="group">
                    <div className="flex items-start gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-semibold text-primary">
                          {msg.display_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="font-medium text-sm">{msg.display_name}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(msg.created_at).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        </div>
                        <p className="text-sm mt-0.5 break-words">{msg.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          <form onSubmit={handleSendMessage} className="p-4 border-t bg-muted/30">
            <div className="flex gap-2">
              <Input
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                maxLength={500}
                disabled={isLoading}
              />
              <Button type="submit" size="icon" disabled={isLoading || !newMessage.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Be respectful and follow community guidelines
            </p>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
};
