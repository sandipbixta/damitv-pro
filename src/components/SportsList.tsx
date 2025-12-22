
import React from 'react';
import { Sport } from '../types/sports';
import { Button } from './ui/button';

interface SportsListProps {
  sports: Sport[];
  onSelectSport: (sportId: string) => void;
  selectedSport: string | null;
  isLoading: boolean;
}

const SportsList: React.FC<SportsListProps> = ({ sports, onSelectSport, selectedSport, isLoading }) => {
  if (isLoading) {
    return (
      <div>
        {/* Mobile: horizontal scroll */}
        <div className="flex overflow-x-auto pb-3 space-x-3 scrollbar-none lg:hidden">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="w-32 h-8 bg-[#242836] animate-pulse rounded-lg flex-shrink-0"></div>
          ))}
        </div>
        {/* Desktop: grid */}
        <div className="hidden lg:grid lg:grid-cols-10 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
            <div key={i} className="h-8 bg-[#242836] animate-pulse rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Mobile: horizontal scroll */}
      <div className="flex overflow-x-auto pb-3 space-x-3 scrollbar-none lg:hidden">
        {/* All Sports button */}
        <Button
          onClick={() => onSelectSport('all')}
          className={`px-4 py-1.5 rounded-full transition-all whitespace-nowrap text-sm flex-shrink-0 backdrop-blur-md shadow-lg ${
            selectedSport === 'all'
              ? 'bg-primary/30 text-white border border-primary/50 hover:bg-primary/40 shadow-primary/30'
              : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
          }`}
          variant={selectedSport === 'all' ? "default" : "outline"}
        >
          All Sports
        </Button>
        
        {sports.map((sport) => (
          <Button
            key={sport.id}
            onClick={() => onSelectSport(sport.id)}
            className={`px-4 py-1.5 rounded-full transition-all whitespace-nowrap text-sm flex-shrink-0 backdrop-blur-md shadow-lg ${
              selectedSport === sport.id
                ? 'bg-primary/30 text-white border border-primary/50 hover:bg-primary/40 shadow-primary/30'
                : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
            }`}
            variant={selectedSport === sport.id ? "default" : "outline"}
          >
            {sport.name}
          </Button>
        ))}
      </div>

      {/* Desktop: grid */}
      <div className="hidden lg:grid lg:grid-cols-10 gap-2">
        {/* All Sports button */}
        <Button
          onClick={() => onSelectSport('all')}
          className={`px-4 py-1.5 rounded-full transition-all text-sm truncate backdrop-blur-md shadow-lg ${
            selectedSport === 'all'
              ? 'bg-primary/30 text-white border border-primary/50 hover:bg-primary/40 shadow-primary/30'
              : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
          }`}
          variant={selectedSport === 'all' ? "default" : "outline"}
        >
          All Sports
        </Button>
        
        {sports.map((sport) => (
          <Button
            key={sport.id}
            onClick={() => onSelectSport(sport.id)}
            className={`px-4 py-1.5 rounded-full transition-all text-sm truncate backdrop-blur-md shadow-lg ${
              selectedSport === sport.id
                ? 'bg-primary/30 text-white border border-primary/50 hover:bg-primary/40 shadow-primary/30'
                : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
            }`}
            variant={selectedSport === sport.id ? "default" : "outline"}
          >
            {sport.name}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default SportsList;
