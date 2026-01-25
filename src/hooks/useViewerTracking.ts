import { useEffect, useRef, useState } from 'react';
import { sendHeartbeat, unregisterViewer, getRealViewerCount } from '@/services/realViewerService';

const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const COUNT_REFRESH_INTERVAL = 15000; // 15 seconds

/**
 * Hook to track viewer presence and get real-time viewer count
 * Use this on Match page when user is actively watching
 */
export const useViewerTracking = (matchId: string | undefined) => {
  const [viewerCount, setViewerCount] = useState<number>(0);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!matchId) return;

    // Send initial heartbeat (registers viewer)
    sendHeartbeat(matchId);

    // Get initial count
    getRealViewerCount(matchId).then(setViewerCount);

    // Start heartbeat interval
    heartbeatRef.current = setInterval(() => {
      sendHeartbeat(matchId);
    }, HEARTBEAT_INTERVAL);

    // Start count refresh interval
    countRefreshRef.current = setInterval(() => {
      getRealViewerCount(matchId).then(setViewerCount);
    }, COUNT_REFRESH_INTERVAL);

    // Cleanup on unmount or match change
    return () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }
      if (countRefreshRef.current) {
        clearInterval(countRefreshRef.current);
      }
      unregisterViewer(matchId);
    };
  }, [matchId]);

  // Handle page visibility changes
  useEffect(() => {
    if (!matchId) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, stop heartbeat
        if (heartbeatRef.current) {
          clearInterval(heartbeatRef.current);
          heartbeatRef.current = null;
        }
      } else {
        // Page is visible again, send heartbeat and restart interval
        sendHeartbeat(matchId);
        getRealViewerCount(matchId).then(setViewerCount);
        if (!heartbeatRef.current) {
          heartbeatRef.current = setInterval(() => {
            sendHeartbeat(matchId);
          }, HEARTBEAT_INTERVAL);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [matchId]);

  return { viewerCount };
};
