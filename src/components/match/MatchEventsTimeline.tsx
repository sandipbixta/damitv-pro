import React from 'react';
import { TimelineEvent } from '@/hooks/useSportsDBMatch';

interface MatchEventsTimelineProps {
  timeline: TimelineEvent[];
  homeTeam: string;
  awayTeam: string;
}

const MatchEventsTimeline: React.FC<MatchEventsTimelineProps> = ({
  timeline,
  homeTeam,
  awayTeam,
}) => {
  const getEventIcon = (type: string) => {
    const typeLower = type.toLowerCase();
    if (typeLower.includes('goal') || typeLower === 'goal') {
      return '⚽';
    }
    if (typeLower.includes('yellow') || typeLower === 'yellowcard') {
      return '🟨';
    }
    if (typeLower.includes('red') || typeLower === 'redcard') {
      return '🟥';
    }
    if (typeLower.includes('subst') || typeLower === 'substitution') {
      return '🔄';
    }
    if (typeLower.includes('pen') || typeLower === 'penalty') {
      return '🎯';
    }
    if (typeLower.includes('own goal')) {
      return '⚽❌';
    }
    return '📌';
  };

  const getEventColor = (type: string) => {
    const typeLower = type.toLowerCase();
    if (typeLower.includes('goal') || typeLower === 'goal' || typeLower.includes('pen')) {
      return 'bg-green-500/20 border-green-500/50 text-green-400';
    }
    if (typeLower.includes('yellow')) {
      return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400';
    }
    if (typeLower.includes('red')) {
      return 'bg-red-500/20 border-red-500/50 text-red-400';
    }
    if (typeLower.includes('subst')) {
      return 'bg-blue-500/20 border-blue-500/50 text-blue-400';
    }
    return 'bg-muted border-border text-muted-foreground';
  };

  const formatEventType = (type: string) => {
    const typeLower = type.toLowerCase();
    if (typeLower.includes('goal') && !typeLower.includes('own')) return 'Goal';
    if (typeLower.includes('own goal')) return 'Own Goal';
    if (typeLower.includes('yellow')) return 'Yellow Card';
    if (typeLower.includes('red')) return 'Red Card';
    if (typeLower.includes('subst')) return 'Substitution';
    if (typeLower.includes('pen')) return 'Penalty';
    return type;
  };

  if (!timeline || timeline.length === 0) {
    return (
      <div className="bg-card rounded-lg border border-border p-6">
        <h3 className="text-xl font-bold mb-4 text-foreground flex items-center gap-2">
          📋 Match Events
        </h3>
        <p className="text-muted-foreground text-center py-8">
          No match events available yet. Events will appear here during the match.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <h3 className="text-xl font-bold mb-6 text-foreground flex items-center gap-2">
        📋 Match Events
      </h3>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-border -translate-x-1/2" />

        <div className="space-y-4">
          {timeline.map((event, index) => (
            <div
              key={event.id || index}
              className={`relative flex items-center gap-4 ${
                event.isHome ? 'flex-row' : 'flex-row-reverse'
              }`}
            >
              {/* Event Card */}
              <div
                className={`flex-1 ${event.isHome ? 'text-right pr-4' : 'text-left pl-4'}`}
              >
                <div
                  className={`inline-block rounded-lg border px-4 py-3 ${getEventColor(event.type)}`}
                >
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    {event.isHome && (
                      <span className="text-lg">{getEventIcon(event.type)}</span>
                    )}
                    <span className="font-bold">{event.player}</span>
                    {!event.isHome && (
                      <span className="text-lg">{getEventIcon(event.type)}</span>
                    )}
                  </div>
                  <div className="text-xs opacity-80 mt-1">
                    {formatEventType(event.type)}
                    {event.assist && ` • Assist: ${event.assist}`}
                  </div>
                </div>
              </div>

              {/* Time Bubble */}
              <div className="absolute left-1/2 -translate-x-1/2 z-10">
                <div className="bg-primary text-primary-foreground rounded-full w-10 h-10 flex items-center justify-center font-bold text-sm">
                  {event.time}'
                </div>
              </div>

              {/* Empty space for the other side */}
              <div className="flex-1" />
            </div>
          ))}
        </div>
      </div>

      {/* Team Labels */}
      <div className="flex justify-between mt-6 pt-4 border-t border-border">
        <span className="text-sm font-medium text-muted-foreground">{homeTeam}</span>
        <span className="text-sm font-medium text-muted-foreground">{awayTeam}</span>
      </div>
    </div>
  );
};

export default MatchEventsTimeline;
