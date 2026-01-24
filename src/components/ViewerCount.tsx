// Viewer count component - disabled (frontend only)
import React from 'react';

interface ViewerCountProps {
  matchId: string;
  enableRealtime?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const ViewerCount: React.FC<ViewerCountProps> = ({ matchId, enableRealtime = false, size = 'sm' }) => {
  // Viewer count disabled - return null
  return null;
};
