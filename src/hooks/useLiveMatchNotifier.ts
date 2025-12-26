import { useEffect, useRef, useCallback } from 'react';
import { Match } from '@/types/sports';
import { supabase } from '@/integrations/supabase/client';

// Track which matches have already been notified to avoid duplicates
const notifiedMatches = new Set<string>();

interface NotifyMatchPayload {
  matchId: string;
  matchTitle: string;
  homeTeam: string;
  awayTeam: string;
  competition: string;
  sport: string;
  streamUrl: string;
  kickoffTime: string;
  poster?: string;
}

export const useLiveMatchNotifier = (matches: Match[]) => {
  const previousLiveMatchIds = useRef<Set<string>>(new Set());

  const notifyMatchLive = useCallback(async (match: Match) => {
    // Skip if already notified
    if (notifiedMatches.has(match.id)) {
      console.log(`⏭️ Match ${match.id} already notified, skipping`);
      return;
    }

    const homeTeam = match.teams?.home?.name || '';
    const awayTeam = match.teams?.away?.name || '';
    const matchTitle = homeTeam && awayTeam 
      ? `${homeTeam} vs ${awayTeam}` 
      : match.title;

    // Get poster URL
    let posterUrl = '';
    if (match.poster && match.poster.trim() !== '') {
      posterUrl = match.poster.startsWith('http') 
        ? match.poster 
        : `https://streamapi.cc/sport${match.poster.startsWith('/') ? '' : '/'}${match.poster}`;
    }

    const payload: NotifyMatchPayload = {
      matchId: match.id,
      matchTitle,
      homeTeam,
      awayTeam,
      competition: match.category || '',
      sport: match.sportId || match.category || 'Football',
      streamUrl: `https://damitv.netlify.app/match/${match.sportId || 'football'}/${match.id}`,
      kickoffTime: match.date ? new Date(match.date).toISOString() : new Date().toISOString(),
      poster: posterUrl,
    };

    console.log(`🔴 Match going LIVE! Notifying: ${matchTitle}`);

    try {
      const { data, error } = await supabase.functions.invoke('social-webhook', {
        body: payload,
      });

      if (error) {
        console.error('❌ Failed to notify social webhook:', error);
        return;
      }

      console.log('✅ Social webhook notified successfully:', data);
      notifiedMatches.add(match.id);
      
      // Store in localStorage to persist across page refreshes
      const storedNotified = JSON.parse(localStorage.getItem('notifiedMatches') || '[]');
      if (!storedNotified.includes(match.id)) {
        storedNotified.push(match.id);
        // Keep only last 100 to avoid localStorage bloat
        if (storedNotified.length > 100) {
          storedNotified.shift();
        }
        localStorage.setItem('notifiedMatches', JSON.stringify(storedNotified));
      }
    } catch (err) {
      console.error('❌ Error calling social webhook:', err);
    }
  }, []);

  useEffect(() => {
    // Load previously notified matches from localStorage on mount
    const storedNotified = JSON.parse(localStorage.getItem('notifiedMatches') || '[]');
    storedNotified.forEach((id: string) => notifiedMatches.add(id));
  }, []);

  useEffect(() => {
    if (!matches || matches.length === 0) return;

    const now = new Date().getTime();
    const oneHourInMs = 60 * 60 * 1000;
    const sixHoursInMs = 6 * 60 * 60 * 1000;

    // Detect live matches (within 1 hour before or 6 hours after kickoff with sources)
    const currentLiveMatches = matches.filter(match => {
      const matchTime = typeof match.date === 'number' ? match.date : new Date(match.date).getTime();
      return (
        match.sources && 
        match.sources.length > 0 && 
        matchTime - now < oneHourInMs && 
        now - matchTime < sixHoursInMs
      );
    });

    const currentLiveMatchIds = new Set(currentLiveMatches.map(m => m.id));

    // Find newly live matches (matches that weren't live before)
    const newlyLiveMatches = currentLiveMatches.filter(
      match => !previousLiveMatchIds.current.has(match.id) && !notifiedMatches.has(match.id)
    );

    // Notify each newly live match
    newlyLiveMatches.forEach(match => {
      notifyMatchLive(match);
    });

    // Update the previous live matches set
    previousLiveMatchIds.current = currentLiveMatchIds;
  }, [matches, notifyMatchLive]);

  return {
    notifiedCount: notifiedMatches.size,
    manualNotify: notifyMatchLive,
  };
};
