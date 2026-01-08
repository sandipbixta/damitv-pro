
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';

const PromotionBoxes: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
      <div className="bg-[#242836] rounded-xl p-6 border border-[#343a4d]">
        <h2 className="text-xl font-bold mb-4 text-white">Live Now</h2>
        <p className="text-gray-300">Discover events happening right now across different sports.</p>
        <Link to="/live" aria-label="View all live sports events">
          <Button variant="link" className="mt-4 text-[#9b87f5]">See all live events →</Button>
        </Link>
      </div>
      
      <div className="bg-[#242836] rounded-xl p-6 border border-[#343a4d]">
        <h2 className="text-xl font-bold mb-4 text-white">Coming Up</h2>
        <p className="text-gray-300">Get ready for upcoming matches and tournaments.</p>
        <Link to="/schedule" aria-label="View upcoming matches schedule">
          <Button variant="link" className="mt-4 text-[#9b87f5]">See schedule →</Button>
        </Link>
      </div>
    </div>
  );
};

export default PromotionBoxes;
