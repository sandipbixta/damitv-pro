import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Sport, Match } from '../types/sports';
import { fetchSports, fetchAllMatches } from '../api/sportsApi';
import { consolidateMatches, filterCleanMatches } from '../utils/matchUtils';
import { enrichMatchesWithViewers, isMatchLive } from '../services/viewerCountService';

interface SportsDataContextType {
  sports: Sport[];
  allMatches: Match[];
  liveMatches: Match[];
  popularMatches: Match[];
  loading: boolean;
  refresh: () => Promise<void>;
}

const SportsDataContext = createContext<SportsDataContextType | undefined>(undefined);

// Cache duration: 5 minutes for match data
const REFRESH_INTERVAL = 5 * 60 * 1000;

export const SportsDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sports, setSports] = useState<Sport[]>([]);
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastFetch, setLastFetch] = useState(0);

  // Fetch all data once
  const fetchData = useCallback(async (force = false) => {
    // Skip if data was fetched recently (unless forced)
    if (!force && Date.now() - lastFetch < REFRESH_INTERVAL && allMatches.length > 0) {
      console.log('📦 Using cached context data');
      return;
    }

    try {
      console.log('🔄 SportsDataContext: Fetching all data...');
      
      const [sportsData, matchesData] = await Promise.all([
        fetchSports(),
        fetchAllMatches()
      ]);

      // Sort sports with football first
      const sortedSports = sportsData.sort((a, b) => {
        if (a.name.toLowerCase() === 'football') return -1;
        if (b.name.toLowerCase() === 'football') return 1;
        return a.name.localeCompare(b.name);
      });

      setSports(sortedSports);

      // Process matches
      const matchesWithSources = matchesData.filter(m => m.sources && m.sources.length > 0);
      const cleanMatches = filterCleanMatches(matchesWithSources);
      const consolidatedMatches = consolidateMatches(cleanMatches);

      setAllMatches(consolidatedMatches);
      setLastFetch(Date.now());
      
      console.log(`✅ SportsDataContext: Loaded ${sortedSports.length} sports, ${consolidatedMatches.length} matches`);
    } catch (error) {
      console.error('❌ SportsDataContext fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, [lastFetch, allMatches.length]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, []);

  // Background refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData(true);
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [fetchData]);

  // Compute live matches from allMatches
  const liveMatches = useMemo(() => {
    const now = Date.now();
    const sixHoursInMs = 6 * 60 * 60 * 1000;
    const oneHourInMs = 60 * 60 * 1000;

    return allMatches.filter(match => {
      const matchTime = match.date;
      return match.sources && 
             match.sources.length > 0 && 
             matchTime - now < oneHourInMs && 
             now - matchTime < sixHoursInMs;
    }).sort((a, b) => b.date - a.date);
  }, [allMatches]);

  // Compute popular matches (with viewer counts)
  const popularMatches = useMemo(() => {
    return liveMatches
      .filter(m => (m.viewerCount || 0) > 0)
      .sort((a, b) => (b.viewerCount || 0) - (a.viewerCount || 0))
      .slice(0, 12);
  }, [liveMatches]);

  const refresh = useCallback(() => fetchData(true), [fetchData]);

  const value = useMemo(() => ({
    sports,
    allMatches,
    liveMatches,
    popularMatches,
    loading,
    refresh
  }), [sports, allMatches, liveMatches, popularMatches, loading, refresh]);

  return (
    <SportsDataContext.Provider value={value}>
      {children}
    </SportsDataContext.Provider>
  );
};

export const useSportsData = () => {
  const context = useContext(SportsDataContext);
  if (!context) {
    throw new Error('useSportsData must be used within SportsDataProvider');
  }
  return context;
};
