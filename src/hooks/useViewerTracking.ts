import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Generate a unique session ID for this browser (persisted across page reloads)
const getOrCreateSessionId = () => {
  const storageKey = 'viewer_session_id';
  let sessionId = sessionStorage.getItem(storageKey);
  
  if (!sessionId) {
    sessionId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem(storageKey, sessionId);
  }
  
  return sessionId;
};

/**
 * Hook to track viewer count for a match using heartbeat system
 * Sends periodic heartbeats while viewing, automatically expires after 30 seconds of inactivity
 */
export const useViewerTracking = (matchId: string | undefined) => {
  const sessionIdRef = useRef(getOrCreateSessionId());
  
  useEffect(() => {
    if (!matchId) return;

    let isActive = true;
    let heartbeatInterval: NodeJS.Timeout;

    // Send heartbeat to indicate viewer is active
    const sendHeartbeat = async () => {
      if (!isActive) return;
      
      try {
        console.log(`📡 Sending heartbeat for match: ${matchId}, session: ${sessionIdRef.current}`);
        const { error } = await supabase.rpc('heartbeat_viewer', {
          match_id_param: matchId,
          session_id_param: sessionIdRef.current
        });
        
        if (error) {
          console.error('❌ Error sending viewer heartbeat:', error);
        } else {
          console.log('✅ Heartbeat sent successfully');
        }
      } catch (error) {
        console.error('❌ Error sending viewer heartbeat:', error);
      }
    };

    // Send initial heartbeat immediately
    sendHeartbeat();

    // Send heartbeat every 10 seconds
    heartbeatInterval = setInterval(sendHeartbeat, 10000);

    // Handle page visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Stop sending heartbeats when tab is hidden
        clearInterval(heartbeatInterval);
      } else {
        // Resume heartbeats when tab becomes visible
        sendHeartbeat();
        heartbeatInterval = setInterval(sendHeartbeat, 10000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup: stop heartbeats when component unmounts
    return () => {
      isActive = false;
      clearInterval(heartbeatInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [matchId]);
};
