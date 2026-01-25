import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Users, TrendingUp, TrendingDown } from 'lucide-react';
import { Match } from '@/types/sports';
import { fetchMatchViewerCount, formatViewerCount, isMatchLive } from '@/services/viewerCountService';
import { cn } from '@/lib/utils';

// Smooth counter animation
const useCounterAnimation = (targetValue: number, duration: number = 500) => {
  const [displayValue, setDisplayValue] = useState(targetValue);
  const animationRef = useRef<number>();

  useEffect(() => {
    if (displayValue === targetValue) return;

    const startValue = displayValue;
    const startTime = Date.now();
    const difference = targetValue - startValue;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out animation
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.round(startValue + difference * easeOut);

      setDisplayValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [targetValue, duration, displayValue]);

  return displayValue;
};

interface LiveViewerCountProps {
  match: Match;
  showTrend?: boolean;
  size?: 'sm' | 'md' | 'lg';
  rounded?: boolean;
  className?: string;
}

export const LiveViewerCount: React.FC<LiveViewerCountProps> = ({
  match,
  showTrend = false,
  size = 'sm',
  rounded = false,
  className
}) => {
  const [viewerCount, setViewerCount] = useState<number | null>(() => {
    const initial = match.viewerCount;
    return typeof initial === 'number' && initial > 0 ? initial : null;
  });
  const [trend, setTrend] = useState<'up' | 'down' | 'neutral'>('neutral');
  const [isVisible, setIsVisible] = useState(false);
  const [inView, setInView] = useState(false);

  const updateIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const idleHandleRef = useRef<number | null>(null);
  const sentinelRef = useRef<HTMLSpanElement | null>(null);
  const previousCountRef = useRef<number | null>(null);

  // Animated counter value
  const animatedCount = useCounterAnimation(viewerCount || 0, 500);

  const sizeClasses = {
    sm: 'text-xs gap-1',
    md: 'text-sm gap-2',
    lg: 'text-base gap-2'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  // Reset when match changes
  useEffect(() => {
    const initial = match.viewerCount;
    const nextInitial = typeof initial === 'number' && initial > 0 ? initial : null;

    setViewerCount(nextInitial);
    previousCountRef.current = nextInitial;
    setTrend('neutral');
    setIsVisible(!!nextInitial);
    setInView(false);
  }, [match.id]);

  // Observe viewport: only fetch counts for cards that are actually on-screen.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || inView) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some(e => e.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { root: null, rootMargin: '200px', threshold: 0.01 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [inView]);

  const fetchCount = useCallback(async () => {
    try {
      const count = await fetchMatchViewerCount(match);

      if (count === null || count <= 0) {
        // No valid data: don't spam retries; keep whatever we already have.
        return;
      }

      const prev = previousCountRef.current;

      if (showTrend && typeof prev === 'number') {
        if (count > prev) setTrend('up');
        else if (count < prev) setTrend('down');
        else setTrend('neutral');
      }

      previousCountRef.current = count;
      setViewerCount(count);
      setIsVisible(true);
    } catch {
      // silent
    }
  }, [match, showTrend]);

  useEffect(() => {
    if (!inView) return;

    // Only fetch for live matches
    if (!isMatchLive(match)) {
      setIsVisible(false);
      return;
    }

    const start = () => {
      fetchCount();
      updateIntervalRef.current = setInterval(fetchCount, 30000);
    };

    // Defer initial fetch so match cards render first (improves perceived performance)
    const ric = (window as any).requestIdleCallback as
      | ((cb: () => void, opts?: { timeout: number }) => number)
      | undefined;

    if (ric) {
      idleHandleRef.current = ric(start, { timeout: 1500 });
    } else {
      idleHandleRef.current = window.setTimeout(start, 800) as unknown as number;
    }

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }
      if (idleHandleRef.current) {
        if (ric) {
          (window as any).cancelIdleCallback?.(idleHandleRef.current);
        } else {
          clearTimeout(idleHandleRef.current);
        }
        idleHandleRef.current = null;
      }
    };
  }, [inView, match, fetchCount]);

  const getTrendIcon = () => {
    if (!showTrend || trend === 'neutral') return null;

    const TrendIcon = trend === 'up' ? TrendingUp : TrendingDown;
    const trendColor = trend === 'up' ? 'text-green-500' : 'text-red-500';

    return <TrendIcon className={cn(iconSizes[size], trendColor)} />;
  };

  // Always render a tiny sentinel so we can lazy-fetch when it scrolls into view.
  if (viewerCount === null || viewerCount === 0 || !isVisible) {
    return <span ref={sentinelRef} className="inline-block w-px h-px" aria-hidden="true" />;
  }

  return (
    <span
      ref={sentinelRef}
      className={cn(
        'inline-flex items-center font-semibold text-foreground transition-all duration-500',
        sizeClasses[size],
        isVisible ? 'animate-fade-in opacity-100' : 'opacity-0',
        className
      )}
      aria-label={`Current viewer count: ${animatedCount.toLocaleString()}`}
      title="Live viewer count"
    >
      <Users className={cn(iconSizes[size], 'text-sports-primary animate-pulse')} />
      <span className="transition-all duration-500">{formatViewerCount(animatedCount, rounded)}</span>
      {getTrendIcon()}
    </span>
  );
};
