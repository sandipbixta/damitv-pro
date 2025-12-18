import React, { useEffect, useState, useRef } from 'react';
import { Users, TrendingUp, TrendingDown } from 'lucide-react';
import { Match } from '@/types/sports';
import { cn } from '@/lib/utils';

// Smooth counter animation
const useCounterAnimation = (targetValue: number, duration: number = 500) => {
  const [displayValue, setDisplayValue] = useState(targetValue);
  const animationRef = useRef<number>();
  const previousValue = useRef(targetValue);

  useEffect(() => {
    if (targetValue === previousValue.current) return;

    const startValue = previousValue.current;
    const startTime = Date.now();
    const difference = targetValue - startValue;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.round(startValue + difference * easeOut);
      
      setDisplayValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        previousValue.current = targetValue;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [targetValue, duration]);

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
  const [viewerCount, setViewerCount] = useState<number>(0);
  const [trend, setTrend] = useState<'up' | 'down' | 'neutral'>('neutral');
  const previousCountRef = useRef<number>(0);
  
  const animatedCount = useCounterAnimation(viewerCount, 800);

  const sizeClasses = {
    sm: 'text-xs gap-1',
    md: 'text-sm gap-1.5',
    lg: 'text-base gap-2'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  useEffect(() => {
    // Use viewer count from match data instead of RPC call
    if (match.viewerCount && match.viewerCount > 0) {
      setViewerCount(match.viewerCount);
    }
  }, [match.viewerCount]);

  const formatCount = (count: number) => {
    if (rounded) {
      if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
      if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toLocaleString();
  };

  if (viewerCount === 0) return null;

  return (
    <div 
      className={cn(
        'flex items-center font-semibold transition-all duration-500',
        sizeClasses[size],
        className
      )}
    >
      <Users className={cn(iconSizes[size], 'text-primary')} />
      <span className="transition-all duration-300 tabular-nums">
        {formatCount(animatedCount)}
      </span>
      {showTrend && trend !== 'neutral' && (
        trend === 'up' ? (
          <TrendingUp className={cn(iconSizes[size], 'text-green-500')} />
        ) : (
          <TrendingDown className={cn(iconSizes[size], 'text-red-400')} />
        )
      )}
    </div>
  );
};
