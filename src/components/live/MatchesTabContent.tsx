
import React from 'react';
import { Match, Sport } from '../../types/sports';
import { TabsContent } from '../ui/tabs';
import MatchCard from '../MatchCard';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Search, Tv, Calendar, RefreshCcw, CircleDot, Dribbble } from 'lucide-react';

interface MatchesTabContentProps {
  tabValue: string;
  filteredMatches: Match[];
  sports: Sport[];
  activeSportFilter: string;
  searchQuery: string;
  onMatchSelect: (match: Match) => void;
  onSearchClear: () => void;
  onRetryLoading: () => void;
}

const MatchesTabContent: React.FC<MatchesTabContentProps> = ({
  tabValue,
  filteredMatches,
  sports,
  activeSportFilter,
  searchQuery,
  onMatchSelect,
  onSearchClear,
  onRetryLoading
}) => {
  // Helper function to group matches by sport
  const groupMatchesBySport = (matches: Match[]) => {
    const groupedMatches: Record<string, Match[]> = {};
    
    matches.forEach(match => {
      const sportId = match.sportId || "unknown";
      if (!groupedMatches[sportId]) {
        groupedMatches[sportId] = [];
      }
      groupedMatches[sportId].push(match);
    });
    
    return groupedMatches;
  };

  // Get sport name by ID
  const getSportName = (sportId: string): string => {
    const sport = sports.find(s => s.id === sportId);
    if (sport) return sport.name;
    
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

  // Render matches by sport
  const renderMatchesBySport = (matches: Match[]) => {
    if (matches.length === 0) return null;
    
    const groupedMatches = groupMatchesBySport(matches);
    const sportIds = Object.keys(groupedMatches);
    
    return sportIds.map(sportId => (
      <div key={`sport-${sportId}`} className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          {getSportIcon(sportId)}
          <h3 className="text-xl font-bold text-white">{getSportName(sportId)}</h3>
          <Badge variant="outline" className="ml-2 bg-[#242836] text-white text-xs">
            {groupedMatches[sportId].length} {groupedMatches[sportId].length === 1 ? 'match' : 'matches'}
          </Badge>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
          {groupedMatches[sportId].map((match) => (
            <div 
              key={`${sportId}-${match.id}`} 
              className="cursor-pointer"
              onClick={() => onMatchSelect(match)}
            >
              <MatchCard 
                match={match}
                sportId={match.sportId || "1"}
                onClick={() => onMatchSelect(match)}
                preventNavigation={true}
                isCompact={true}
              />
            </div>
          ))}
        </div>
      </div>
    ));
  };

  const renderEmptyState = (icon: React.ReactNode, message: string, showClearSearch = false) => (
    <div className="w-full bg-[#242836] rounded-xl p-8 text-center">
      {searchQuery && showClearSearch ? (
        <div>
          <Search size={40} className="mx-auto mb-3 text-gray-400" />
          <p className="text-gray-300 mb-3">No matches found for "{searchQuery}"</p>
          <Button onClick={onSearchClear} size="sm" className="bg-[#9b87f5] hover:bg-[#8a75e8]">
            Clear Search
          </Button>
        </div>
      ) : (
        <div>
          {icon}
          <p className="text-gray-300 mb-3">{message}</p>
          <Button onClick={onRetryLoading} size="sm" className="bg-[#9b87f5] hover:bg-[#8a75e8]">
            <RefreshCcw size={14} className="mr-1" />
            Refresh
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <TabsContent value={tabValue} className="mt-0">
      {filteredMatches.length > 0 ? (
        activeSportFilter === "all" ? 
          renderMatchesBySport(filteredMatches) :
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
            {filteredMatches.map((match) => (
              <div 
                key={`${tabValue}-${match.id}`} 
                className="cursor-pointer"
                onClick={() => onMatchSelect(match)}
              >
                <MatchCard 
                  match={match}
                  sportId={match.sportId || "1"}
                  onClick={() => onMatchSelect(match)}
                  preventNavigation={true}
                  isCompact={true}
                />
              </div>
            ))}
          </div>
      ) : (
        tabValue === "live" ? 
          renderEmptyState(
            <Tv size={40} className="mx-auto mb-3 text-gray-400" />,
            searchQuery ? `No live matches found for "${searchQuery}"` : "No live matches currently available.",
            true
          ) :
          renderEmptyState(
            <Calendar size={40} className="mx-auto mb-3 text-gray-400" />,
            searchQuery ? `No upcoming matches found for "${searchQuery}"` : "No upcoming matches scheduled.",
            true
          )
      )}
    </TabsContent>
  );
};

export default MatchesTabContent;
