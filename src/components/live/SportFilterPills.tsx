
import React from 'react';
import { Button } from '../ui/button';
import { Match, Sport } from '../../types/sports';
import { CircleDot, Dribbble } from 'lucide-react';

interface SportFilterPillsProps {
  allMatches: Match[];
  sports: Sport[];
  activeSportFilter: string;
  onSportFilterChange: (sportId: string) => void;
}

const SportFilterPills: React.FC<SportFilterPillsProps> = ({
  allMatches,
  sports,
  activeSportFilter,
  onSportFilterChange
}) => {
  // Get all sport IDs from the sports list
  const getAllSportIds = (): string[] => {
    return sports.map(sport => sport.id);
  };

  // Get sport name by ID
  const getSportName = (sportId: string): string => {
    const sport = sports.find(s => s.id === sportId);
    if (sport) return sport.name;
    
    // Default mappings for common sport IDs
    const sportMappings: Record<string, string> = {
      '1': 'Football',
      '2': 'Basketball',
      '3': 'Ice Hockey',
      '4': 'Tennis',
      'football': 'Football',
      'basketball': 'Basketball',
      'hockey': 'Ice Hockey'
    };
    
    return sportMappings[sportId] || 'Other Sports';
  };

  // Get sport icon by ID
  const getSportIcon = (sportId: string) => {
    switch(sportId) {
      case '1':
      case 'football':
        return <CircleDot size={16} />;
      case '2':
      case 'basketball':
        return <Dribbble size={16} />;
      default:
        return null;
    }
  };

  if (allMatches.length === 0) return null;

  return (
    <div className="mb-6 overflow-x-auto pb-2">
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className={`${
            activeSportFilter === 'all' 
              ? 'bg-[#343a4d] border-[#ff5a36]' 
              : 'bg-[#242836] border-[#343a4d]'
          } whitespace-nowrap`}
          onClick={() => onSportFilterChange('all')}
        >
          All Sports
        </Button>
        {getAllSportIds().map(sportId => (
          <Button
            key={`filter-${sportId}`}
            variant="outline"
            size="sm"
            className={`${
              activeSportFilter === sportId 
                ? 'bg-[#343a4d] border-[#ff5a36]' 
                : 'bg-[#242836] border-[#343a4d]'
            } whitespace-nowrap flex items-center gap-1`}
            onClick={() => onSportFilterChange(sportId)}
          >
            {getSportIcon(sportId)}
            {getSportName(sportId)}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default SportFilterPills;
