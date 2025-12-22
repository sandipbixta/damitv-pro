import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useWatchHistory = (matchId?: string, matchTitle?: string, sportId?: string) => {
  const watchDuration = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout>();

  const getSessionId = () => {
    let sessionId = localStorage.getItem('session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('session_id', sessionId);
    }
    return sessionId;
  };

  useEffect(() => {
    if (!matchId || !matchTitle || !sportId) return;

    const sessionId = getSessionId();

    // Initialize or update watch history
    const initWatchHistory = async () => {
      try {
        await supabase
          .from('watch_history')
          .upsert({
            session_id: sessionId,
            match_id: matchId,
            match_title: matchTitle,
            sport_id: sportId,
            watch_duration: 0,
            last_watched_at: new Date().toISOString()
          }, {
            onConflict: 'session_id,match_id'
          });
      } catch (error) {
        console.error('Error initializing watch history:', error);
      }
    };

    initWatchHistory();

    // Update watch duration every 30 seconds
    intervalRef.current = setInterval(async () => {
      watchDuration.current += 30;
      
      try {
        await supabase
          .from('watch_history')
          .update({
            watch_duration: watchDuration.current,
            last_watched_at: new Date().toISOString()
          })
          .eq('session_id', sessionId)
          .eq('match_id', matchId);
      } catch (error) {
        console.error('Error updating watch history:', error);
      }
    }, 30000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [matchId, matchTitle, sportId]);

  return { watchDuration: watchDuration.current };
};
