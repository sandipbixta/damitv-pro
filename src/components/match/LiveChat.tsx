import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

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

export const LiveChat = ({ matchId, matchTitle }: LiveChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isNameSet, setIsNameSet] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sessionId = useRef(crypto.randomUUID());

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

  return (
    <div className="flex flex-col h-[500px] lg:h-[calc(100vh-200px)] bg-card rounded-lg border overflow-hidden">
      <div className="p-4 border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Live Chat</h3>
          </div>
          <span className="text-xs text-muted-foreground">{messages.length} messages</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Chatting as <span className="font-medium">{displayName}</span>
        </p>
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
    </div>
  );
};
