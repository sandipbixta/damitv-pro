import React, { useEffect, useState, useMemo } from 'react';
import { Sport, Match } from '../types/sports';
import { enrichMatchesWithViewers, isMatchLive } from '../services/viewerCountService';
import { filterMatchesWithImages } from '../utils/matchImageFilter';
import MatchCard from './MatchCard';
import { useSportsData } from '../contexts/SportsDataContext';

interface AllSportsLiveMatchesProps {
  searchTerm?: string;
}

const AllSportsLiveMatches: React.FC<AllSportsLiveMatchesProps> = ({ searchTerm = '' }) => {
  // Use shared sports data context - no duplicate API calls!
  const { sports, liveMatches, allMatches, loading } = useSportsData();
  const [mostViewedMatches, setMostViewedMatches] = useState<Match[]>([]);

  // Enrich matches with viewer counts once when allMatches changes
  useEffect(() => {
    const enrichWithViewers = async () => {
      if (allMatches.length === 0) return;
      
      try {
        const enrichedAllMatches = await enrichMatchesWithViewers(allMatches);
        
        // For "Popular by Viewers", only show live matches with viewers
        const liveMatchesWithViewers = enrichedAllMatches.filter(m => 
          isMatchLive(m) && 
          (m.viewerCount || 0) > 0
        );
        
        // Sort by viewer count
        const sortedByViewers = liveMatchesWithViewers.sort((a, b) => 
          (b.viewerCount || 0) - (a.viewerCount || 0)
        );
        
        console.log('🔥 Popular live matches:', sortedByViewers.length);
        setMostViewedMatches(sortedByViewers.slice(0, 12));
      } catch (error) {
        console.error('Error enriching viewer counts:', error);
      }
    };

    enrichWithViewers();
  }, [allMatches]);

  // Refresh viewer counts every 2 minutes (reduced from 30s)
  useEffect(() => {
    const refreshViewerCounts = async () => {
      if (allMatches.length === 0) return;
      
      try {
        console.log('🔄 Refreshing viewer counts...');
        const enrichedAllMatches = await enrichMatchesWithViewers(allMatches);
        
        const liveMatchesWithViewers = enrichedAllMatches.filter(m => 
          isMatchLive(m) && 
          (m.viewerCount || 0) > 0
        );
        
        const sortedByViewers = liveMatchesWithViewers.sort((a, b) => 
          (b.viewerCount || 0) - (a.viewerCount || 0)
        );
        
        setMostViewedMatches(sortedByViewers.slice(0, 12));
      } catch (error) {
        console.error('Error refreshing viewer counts:', error);
      }
    };

    const interval = setInterval(refreshViewerCounts, 120000); // 2 minutes instead of 30s
    
    return () => clearInterval(interval);
  }, [allMatches]);

  // Filter matches by search term (ended matches already filtered out in data loading)
  const filteredMatches = React.useMemo(() => {
    // Only show matches with images on home page
    let matches = filterMatchesWithImages(liveMatches);
    
    // Apply search filter if provided
    if (searchTerm.trim()) {
      const lowercaseSearch = searchTerm.toLowerCase();
      matches = matches.filter(match => {
        return match.title.toLowerCase().includes(lowercaseSearch) || 
          match.teams?.home?.name?.toLowerCase().includes(lowercaseSearch) ||
          match.teams?.away?.name?.toLowerCase().includes(lowercaseSearch);
      });
    }
    
    return matches;
  }, [liveMatches, searchTerm]);

  // Group matches by sport and sort by date (newest first)
  const matchesBySport = React.useMemo(() => {
    const grouped: { [sportId: string]: Match[] } = {};
    
    filteredMatches.forEach(match => {
      const sportId = match.sportId || match.category || 'unknown';
      if (!grouped[sportId]) {
        grouped[sportId] = [];
      }
      grouped[sportId].push(match);
    });
    
    // Sort matches within each sport by date (newest/most recent first)
    Object.keys(grouped).forEach(sportId => {
      grouped[sportId].sort((a, b) => {
        // Sort by date descending (newest matches first)
        return b.date - a.date;
      });
    });
    
    return grouped;
  }, [filteredMatches]);

  const getSportName = (sportId: string) => {
    const sport = sports.find(s => s.id === sportId);
    return sport?.name || sportId.charAt(0).toUpperCase() + sportId.slice(1);
  };

  // Show skeleton while data is empty, but don't block - let it render
  if (liveMatches.length === 0) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
          <div key={i} className="h-[280px] bg-[#242836] rounded-xl animate-pulse"></div>
        ))}
      </div>
    );
  }

  if (filteredMatches.length === 0) {
    return (
      <div className="bg-[#242836] border-[#343a4d] rounded-xl p-8 text-center">
        <div className="text-4xl mb-4">📺</div>
        <h3 className="text-xl font-bold text-white mb-2">No Live Matches</h3>
        <p className="text-gray-400">There are currently no live matches available.</p>
      </div>
    );
  }

  // Define preferred sport order with tennis at the end (excluded: golf, hockey, billiards)
  const getSportPriority = (sportId: string): number => {
    const sportOrder: { [key: string]: number } = {
      'football': 1,
      'basketball': 2, 
      'american-football': 3,
      'baseball': 4,
      'motor-sports': 5,
      'fight': 6,
      'rugby': 7,
      'cricket': 8,
      'afl': 9,
      'other': 10,
      'tennis': 12  // Tennis moved to last position
    };
    
    const normalizedSportId = sportId.toLowerCase();
    
    // Check for exact match first
    if (sportOrder[normalizedSportId] !== undefined) {
      return sportOrder[normalizedSportId];
    }
    
    // Check for partial matches
    for (const [sport, priority] of Object.entries(sportOrder)) {
      if (normalizedSportId.includes(sport) || sport.includes(normalizedSportId)) {
        return priority;
      }
    }
    
    // Unknown sports get high priority (but before tennis)
    return 14.5;
  };

  // Sort sports by priority with tennis at the end
  const sortedSports = Object.entries(matchesBySport).sort(([sportIdA], [sportIdB]) => {
    const priorityA = getSportPriority(sportIdA);
    const priorityB = getSportPriority(sportIdB);
    return priorityA - priorityB;
  });

  return (
    <div className="space-y-8">
      {/* Sports Sections */}
      {sortedSports.map(([sportId, matches]) => (
        <div key={sportId} className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">
              {getSportName(sportId)}
            </h3>
            <span className="text-sm text-gray-400">
              {matches.length} live match{matches.length !== 1 ? 'es' : ''}
            </span>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 auto-rows-fr">
            {matches.map((match) => (
              <div key={`${match.sportId || sportId}-${match.id}`} className="h-full">
                <MatchCard
                  match={match}
                  sportId={match.sportId || sportId}
                  isCompact={true}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AllSportsLiveMatches;