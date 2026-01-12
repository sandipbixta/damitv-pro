// Sports API Service - Using Adstrim API as primary, BOHOSport as fallback
// This file provides a unified interface for fetching sports data

import { Sport, Match, Stream } from '../types/sports';
import { 
  fetchAdstrimEvents, 
  fetchAdstrimEvent, 
  fetchAdstrimSports,
  getAdstrimStreams 
} from '../services/adstrimApi';
import {
  fetchSports as fetchBohoSports,
  fetchAllMatches as fetchBohoAllMatches,
  fetchMatches as fetchBohoMatches,
  fetchMatch as fetchBohoMatch,
  fetchSimpleStream as fetchBohoStream,
  clearStreamCache as clearBohoCache
} from '../services/bohoSportApi';

// Re-export cache clearing from boho for compatibility
export const clearStreamCache = clearBohoCache;

// Fetch sports - use Adstrim with Boho fallback
export const fetchSports = async (): Promise<Sport[]> => {
  try {
    const adstrimSports = await fetchAdstrimSports();
    if (adstrimSports && adstrimSports.length > 0) {
      console.log(`✅ Using Adstrim sports: ${adstrimSports.length}`);
      return adstrimSports;
    }
  } catch (error) {
    console.warn('⚠️ Adstrim sports failed, falling back to Boho:', error);
  }
  
  return fetchBohoSports();
};

// Fetch all matches - prioritize Adstrim
export const fetchAllMatches = async (): Promise<Match[]> => {
  try {
    const adstrimMatches = await fetchAdstrimEvents();
    if (adstrimMatches && adstrimMatches.length > 0) {
      console.log(`✅ Using Adstrim matches: ${adstrimMatches.length}`);
      return adstrimMatches;
    }
  } catch (error) {
    console.warn('⚠️ Adstrim matches failed, falling back to Boho:', error);
  }
  
  return fetchBohoAllMatches();
};

// Fetch matches by sport - prioritize Adstrim
export const fetchMatches = async (sportId: string): Promise<Match[]> => {
  try {
    const adstrimMatches = await fetchAdstrimEvents();
    if (adstrimMatches && adstrimMatches.length > 0) {
      const filtered = adstrimMatches.filter(m => 
        m.sportId === sportId || m.category === sportId
      );
      console.log(`✅ Using Adstrim ${sportId} matches: ${filtered.length}`);
      return filtered;
    }
  } catch (error) {
    console.warn(`⚠️ Adstrim ${sportId} failed, falling back to Boho:`, error);
  }
  
  return fetchBohoMatches(sportId);
};

// Fetch live matches
export const fetchLiveMatches = async (): Promise<Match[]> => {
  const allMatches = await fetchAllMatches();
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
};

// Fetch a specific match by ID
export const fetchMatch = async (sportId: string, matchId: string): Promise<Match> => {
  try {
    const adstrimMatch = await fetchAdstrimEvent(matchId);
    if (adstrimMatch) {
      console.log(`✅ Found Adstrim match: ${adstrimMatch.title}`);
      return adstrimMatch;
    }
  } catch (error) {
    console.warn(`⚠️ Adstrim match ${matchId} failed, falling back to Boho:`, error);
  }
  
  return fetchBohoMatch(sportId, matchId);
};

// Fetch streams for a match - use Adstrim streams
export const fetchSimpleStream = async (source: string, id: string, category?: string): Promise<Stream[]> => {
  try {
    // Check if this is an Adstrim event ID
    const adstrimStreams = await getAdstrimStreams(id);
    if (adstrimStreams && adstrimStreams.length > 0) {
      console.log(`✅ Using Adstrim streams: ${adstrimStreams.length}`);
      return adstrimStreams;
    }
  } catch (error) {
    console.warn(`⚠️ Adstrim streams failed, falling back to Boho:`, error);
  }
  
  return fetchBohoStream(source, id, category);
};

// Fetch all streams for a match
export const fetchAllMatchStreams = async (match: Match): Promise<Stream[]> => {
  const allStreams: Stream[] = [];
  
  // Try Adstrim first
  try {
    const adstrimStreams = await getAdstrimStreams(match.id);
    if (adstrimStreams && adstrimStreams.length > 0) {
      console.log(`✅ Using ${adstrimStreams.length} Adstrim streams for ${match.id}`);
      return adstrimStreams;
    }
  } catch (error) {
    console.warn(`⚠️ Adstrim streams failed for ${match.id}:`, error);
  }
  
  // Fallback to Boho streams
  if (match.sources && match.sources.length > 0) {
    for (const source of match.sources) {
      try {
        const streams = await fetchBohoStream(source.source, source.id);
        allStreams.push(...streams);
      } catch (error) {
        console.warn(`⚠️ Failed to fetch Boho stream for ${source.source}/${source.id}`);
      }
    }
  }
  
  return allStreams;
};

// Alias for compatibility
export const fetchAllStreams = fetchAllMatchStreams;

// Image URL helpers (from Boho for compatibility)
export const getBohoImageUrl = (path: string): string => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `https://streamed.su${path.startsWith('/') ? '' : '/'}${path}`;
};

export const getTeamBadgeUrl = (badge: string): string => {
  if (!badge) return '';
  if (badge.startsWith('http')) return badge;
  return getBohoImageUrl(badge);
};

// Legacy function for backward compatibility
export const fetchStream = async (source: string, id: string, streamNo?: number) => {
  const streams = await fetchSimpleStream(source, id);
  
  if (streamNo !== undefined) {
    const specificStream = streams.find(s => s.streamNo === streamNo);
    return specificStream || streams[0] || null;
  }
  
  return streams;
};

// Legacy compatibility - validate stream URL
export const isValidStreamUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsedUrl = new URL(url.startsWith('//') ? 'https:' + url : url);
    return ['http:', 'https:'].includes(parsedUrl.protocol);
  } catch {
    return false;
  }
};

// Export Boho API base for compatibility
export const BOHO_API_BASE = 'https://streamed.su';
