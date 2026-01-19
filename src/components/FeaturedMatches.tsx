
import React from 'react';
import { Play } from 'lucide-react';
import ManualMatchCard from '@/components/ManualMatchCard';
import { Separator } from '@/components/ui/separator';
import { ManualMatch } from '@/types/manualMatch';

interface FeaturedMatchesProps {
  visibleManualMatches: ManualMatch[];
  hasApiMatches?: boolean; // Add prop to check if API matches are available
}

const FeaturedMatches: React.FC<FeaturedMatchesProps> = ({ 
  visibleManualMatches, 
  hasApiMatches = false 
}) => {
  // Don't show manual matches if API matches are available
  if (hasApiMatches || visibleManualMatches.length === 0) {
    return null;
  }

  // Remove duplicates based on match ID
  const uniqueMatches = visibleManualMatches.filter((match, index, self) => 
    index === self.findIndex(m => m.id === match.id)
  );

  return (
    <div className="mb-6 sm:mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Play className="h-6 w-6 text-[#ff5a36]" />
          Featured Matches
        </h2>
        <span className="text-sm bg-[#242836] border border-[#343a4d] rounded-lg px-3 py-1 text-white">
          {uniqueMatches.length} available
        </span>
      </div>
      <div
        className="
          grid 
          grid-cols-2 
          sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 
          gap-2 xs:gap-3 sm:gap-4
        "
      >
        {uniqueMatches.map((match) => (
          <ManualMatchCard
            key={match.id}
            match={match}
          />
        ))}
      </div>
      <Separator className="my-8 bg-[#343a4d]" />
    </div>
  );
};

export default FeaturedMatches;
