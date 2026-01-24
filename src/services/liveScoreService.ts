// Live score service - disabled (frontend only)

export interface LiveScore {
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  progress: string | null;
  isLive: boolean;
}

export async function fetchLiveScore(homeTeam: string, awayTeam: string): Promise<LiveScore | null> {
  return null;
}

export async function fetchLiveScoresForMatches(
  matches: Array<{ homeTeam: string; awayTeam: string }>
): Promise<Map<string, LiveScore>> {
  return new Map();
}

export function getCachedScore(homeTeam: string, awayTeam: string): LiveScore | null {
  return null;
}

export function clearScoreCache(): void {}
