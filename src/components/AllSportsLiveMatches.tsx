import React, { useEffect, useState } from 'react';
import { Match } from '../types/sports';
import { enrichMatchesWithViewers, isMatchLive } from '../services/viewerCountService';
import { filterMatchesWithImages } from '../utils/matchImageFilter';
import SportCarouselRow from './SportCarouselRow';
import { useSportsData } from '../contexts/SportsDataContext';

interface AllSportsLiveMatchesProps {
  searchTerm?: string;
}

const AllSportsLiveMatches: React.FC<AllSportsLiveMatchesProps> = ({ searchTerm = '' }) => {
  const { sports, liveMatches, allMatches } = useSportsData();
  const [mostViewedMatches, setMostViewedMatches] = useState<Match[]>([]);

  // Enrich matches with viewer counts once when allMatches changes
  useEffect(() => {
    const enrichWithViewers = async () => {
      if (allMatches.length === 0) return;
      
      try {
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
        console.error('Error enriching viewer counts:', error);
      }
    };

    enrichWithViewers();
  }, [allMatches]);

  // Refresh viewer counts every 2 minutes
  useEffect(() => {
    const refreshViewerCounts = async () => {
      if (allMatches.length === 0) return;
      
      try {
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

    const interval = setInterval(refreshViewerCounts, 120000);
    return () => clearInterval(interval);
  }, [allMatches]);

  // Filter matches by search term
  const filteredMatches = React.useMemo(() => {
    let matches = filterMatchesWithImages(liveMatches);
    
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

  // Group matches by sport
  const matchesBySport = React.useMemo(() => {
    const grouped: { [sportId: string]: Match[] } = {};
    
    filteredMatches.forEach(match => {
      const sportId = match.sportId || match.category || 'unknown';
      if (!grouped[sportId]) {
        grouped[sportId] = [];
      }
      grouped[sportId].push(match);
    });
    
    Object.keys(grouped).forEach(sportId => {
      grouped[sportId].sort((a, b) => b.date - a.date);
    });
    
    return grouped;
  }, [filteredMatches]);

  const getSportName = (sportId: string) => {
    const sport = sports.find(s => s.id === sportId);
    return sport?.name || sportId.charAt(0).toUpperCase() + sportId.slice(1).replace(/-/g, ' ');
  };

  // Show skeleton while loading
  if (liveMatches.length === 0) {
    return (
      <div className="space-y-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-3">
            <div className="h-6 w-32 bg-muted rounded animate-pulse" />
            <div className="flex gap-3 overflow-hidden">
              {[1, 2, 3, 4, 5, 6].map((j) => (
                <div key={j} className="flex-shrink-0 w-[180px] h-[240px] bg-muted rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (filteredMatches.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-center">
        <div className="text-4xl mb-4">📺</div>
        <h3 className="text-xl font-bold text-foreground mb-2">No Live Matches</h3>
        <p className="text-muted-foreground">There are currently no live matches available.</p>
      </div>
    );
  }

  // Sport priority for ordering
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
      'tennis': 12
    };
    
    const normalizedSportId = sportId.toLowerCase();
    
    if (sportOrder[normalizedSportId] !== undefined) {
      return sportOrder[normalizedSportId];
    }
    
    for (const [sport, priority] of Object.entries(sportOrder)) {
      if (normalizedSportId.includes(sport) || sport.includes(normalizedSportId)) {
        return priority;
      }
    }
    
    return 14.5;
  };

  const sortedSports = Object.entries(matchesBySport).sort(([sportIdA], [sportIdB]) => {
    return getSportPriority(sportIdA) - getSportPriority(sportIdB);
  });

  return (
    <div className="space-y-8">
      {sortedSports.map(([sportId, matches]) => (
        <SportCarouselRow
          key={sportId}
          sportId={sportId}
          sportName={getSportName(sportId)}
          matches={matches}
          matchCount={matches.length}
        />
      ))}
    </div>
  );
};

export default AllSportsLiveMatches;