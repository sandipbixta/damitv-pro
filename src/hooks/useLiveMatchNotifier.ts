// Live match notifier - disabled (frontend only)
import { Match } from '@/types/sports';

export const useLiveMatchNotifier = (matches: Match[]) => {
  return {
    notifiedCount: 0,
    manualNotify: () => {},
  };
};
