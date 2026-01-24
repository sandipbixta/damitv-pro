// Viewer count utilities - disabled (frontend only)
import { Match } from '../types/sports';

export const fetchMatchViewerCounts = async (matchIds: string[]): Promise<Map<string, number>> => {
  return new Map();
};

export const enrichMatchesWithViewerCounts = async (matches: Match[]): Promise<Match[]> => {
  return matches;
};
