import { useEffect, useRef } from 'react';

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
 * Hook to track viewer count for a match
 * Supabase disabled - using simulated counts instead
 */
export const useViewerTracking = (matchId: string | undefined) => {
  const sessionIdRef = useRef(getOrCreateSessionId());
  
  useEffect(() => {
    if (!matchId) return;

    // Log viewer tracking (no Supabase calls)
    console.log(`📊 Viewer tracking active for match: ${matchId}, session: ${sessionIdRef.current}`);

    // No cleanup needed as we're not making any API calls
    return () => {
      console.log(`📊 Viewer tracking ended for match: ${matchId}`);
    };
  }, [matchId]);
};
