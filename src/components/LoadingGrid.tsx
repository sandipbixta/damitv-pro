
import React from 'react';

const LoadingGrid: React.FC = () => {
  return (
    <div>
      <h2 className="text-xl font-bold mb-3 text-white">Live & Upcoming Matches</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
          <div key={i} className="aspect-[3/4] bg-[#242836] rounded-xl animate-pulse"></div>
        ))}
      </div>
    </div>
  );
};

export default LoadingGrid;
