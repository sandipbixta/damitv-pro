import { Stream } from '../types/sports';

// Source priority for embed.damitv.pro compatibility
// ONLY working sources: charlie, delta, echo
export const SOURCE_PRIORITY: Record<string, number> = {
  'charlie': 15,  // Best reliability
  'delta': 12,
  'echo': 12,
  'default': 0
};

// Get priority for a source
export const getSourcePriority = (source: string): number => {
  return SOURCE_PRIORITY[source?.toLowerCase()] || SOURCE_PRIORITY['default'];
};

// Check if source is working
export const isWorkingSource = (source: string): boolean => {
  const lowerSource = source?.toLowerCase();
  return ['charlie', 'delta', 'echo'].includes(lowerSource);
};

// Filter to only working sources
export const filterWorkingSources = (streams: Record<string, Stream[]>): Record<string, Stream[]> => {
  const filtered: Record<string, Stream[]> = {};
  
  Object.entries(streams).forEach(([key, value]) => {
    const [source] = key.split('/');
    if (isWorkingSource(source)) {
      filtered[key] = value;
    }
  });
  
  return filtered;
};

// Sort sources by priority
export const sortSourcesByPriority = (sourceKeys: string[]): string[] => {
  return sourceKeys.sort((a, b) => {
    const [sourceA] = a.split('/');
    const [sourceB] = b.split('/');
    return getSourcePriority(sourceB) - getSourcePriority(sourceA);
  });
};
