
import React from 'react';
import { useIsMobile } from '../hooks/use-mobile';

const LoadingGrid: React.FC = () => {
  const isMobile = useIsMobile();

  return (
    <div>
      <h2 className="text-xl font-bold mb-3 text-white">Live & Upcoming Matches</h2>
      <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'} gap-3 md:gap-4`}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
          <div key={i} className="h-36 bg-[#242836] rounded-xl animate-pulse"></div>
        ))}
      </div>
    </div>
  );
};

export default LoadingGrid;
