import { useState, useCallback, useEffect } from 'react';
import { Stream, Source } from '../types/sports';

// Source priority for embed.damitv.pro compatibility
// Higher number = higher priority (best working sources first)
const SOURCE_PRIORITY: Record<string, number> = {
  // Ordered priority: charlie, delta, echo, admin, alpha first
  'charlie': 15,
  'delta': 14,
  'echo': 13,
  'admin': 12,
  'alpha': 11,
  // Other military phonetic sources
  'bravo': 10,
  'foxtrot': 9,
  'golf': 8,
  // Secondary reliable sources
  'streamed': 7,
  'sportsurge': 6,
  'streameast': 5,
  'streambtw': 4,
  'givemereddit': 3,
  'topembed': 2,
  // Fallback sources
  'default': 1
};

interface UseAutoFallbackProps {
  allStreams: Record<string, Stream[]>;
  onSourceChange: (source: string, id: string) => void;
  currentStream: Stream | null;
}

export const useAutoFallback = ({ allStreams, onSourceChange, currentStream }: UseAutoFallbackProps) => {
  const [attemptedSources, setAttemptedSources] = useState<Set<string>>(new Set());
  const [isAutoRetrying, setIsAutoRetrying] = useState(false);

  // Get prioritized sources
  const getPrioritizedSources = useCallback(() => {
    const sources = Object.keys(allStreams)
      .filter(sourceKey => allStreams[sourceKey]?.length > 0)
      .map(sourceKey => {
        const [source, id] = sourceKey.split('/');
        const priority = SOURCE_PRIORITY[source] || SOURCE_PRIORITY['default'];
        return { sourceKey, source, id, priority };
      })
      .sort((a, b) => b.priority - a.priority); // Higher priority first

    console.log('📊 Prioritized sources:', sources.map(s => `${s.source} (priority: ${s.priority})`));
    return sources;
  }, [allStreams]);

  // Try next available source - only called manually, not automatically
  const tryNextSource = useCallback((force: boolean = false) => {
    if (isAutoRetrying && !force) {
      console.log('⏳ Already retrying, skipping...');
      return false;
    }

    const prioritizedSources = getPrioritizedSources();
    const unattemptedSource = prioritizedSources.find(
      s => !attemptedSources.has(s.sourceKey)
    );

    if (unattemptedSource) {
      console.log(`🔄 Manual source switch: Trying ${unattemptedSource.source}/${unattemptedSource.id}`);
      setIsAutoRetrying(true);
      setAttemptedSources(prev => new Set([...prev, unattemptedSource.sourceKey]));
      
      // Delay slightly to avoid rapid switching
      setTimeout(() => {
        onSourceChange(unattemptedSource.source, unattemptedSource.id);
        setIsAutoRetrying(false);
      }, 1000);
      
      return true;
    }

    console.log('❌ No more sources to try');
    return false;
  }, [attemptedSources, getPrioritizedSources, onSourceChange, isAutoRetrying]);

  // Reset when streams change
  useEffect(() => {
    setAttemptedSources(new Set());
    setIsAutoRetrying(false);
  }, [Object.keys(allStreams).join(',')]);

  // Mark current source as attempted
  useEffect(() => {
    if (currentStream) {
      const sourceKey = `${currentStream.source}/${currentStream.source}`;
      setAttemptedSources(prev => new Set([...prev, sourceKey]));
    }
  }, [currentStream?.source]);

  return {
    tryNextSource,
    isAutoRetrying,
    attemptedSourcesCount: attemptedSources.size,
    totalSourcesCount: Object.keys(allStreams).length
  };
};
