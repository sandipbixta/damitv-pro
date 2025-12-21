import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingGridProps {
  title?: string;
  count?: number;
}

const LoadingGrid: React.FC<LoadingGridProps> = ({ 
  title = "Live & Upcoming Matches",
}) => {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-3 h-3 bg-primary rounded-full animate-pulse" />
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
      </div>
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading matches...</span>
        </div>
      </div>
    </div>
  );
};

export default LoadingGrid;