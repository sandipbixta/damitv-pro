import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Helmet } from 'react-helmet-async';
import { triggerStreamChangeAd } from '@/utils/streamAdTrigger';
import { useToast } from '@/hooks/use-toast';
import { Match as MatchType, Stream } from '@/types/sports';
import { usePopularMatchesCache } from '@/hooks/usePopularMatches';

// Direct imports for faster initial load
import TelegramBanner from '@/components/TelegramBanner';
import SEOMetaTags from '@/components/SEOMetaTags';
import SocialShare from '@/components/SocialShare';
import MatchHeader from '@/components/match/MatchHeader';
import StreamTab from '@/components/match/StreamTab';
import MatchAnalysis from '@/components/match/MatchAnalysis';
import { ViewerStats } from '@/components/match/ViewerStats';
import StreamViewerDisplay from '@/components/StreamViewerDisplay';
import LoadingState from '@/components/match/LoadingState';
import NotFoundState from '@/components/match/NotFoundState';

interface StreamChannel {
  id: string;
  name: string;
  country: string;
  logo: string;
  embedUrl: string;
}

interface SelectedMatch {
  id: string;
  title: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamBadge: string | null;
  awayTeamBadge: string | null;
  homeScore: string | null;
  awayScore: string | null;
  sport: string;
  sportIcon: string;
  league: string;
  date: string;
  time: string;
  timestamp: string;
  venue: string | null;
  country: string | null;
  status: string | null;
  progress: string | null;
  poster: string | null;
  banner: string | null;
  isLive: boolean;
  isFinished: boolean;
  channels: StreamChannel[];
}

// Safe date conversion helper
const safeDate = (dateValue: number | string | undefined): Date => {
  if (!dateValue) return new Date();
  const date = new Date(dateValue);
  return isNaN(date.getTime()) ? new Date() : date;
};

// Convert cached Match to SelectedMatch format
const convertCachedToSelected = (match: MatchType): SelectedMatch => {
  const matchDate = safeDate(match.date);
  
  return {
    id: match.id,
    title: match.title,
    homeTeam: match.teams?.home?.name || 'TBD',
    awayTeam: match.teams?.away?.name || 'TBD',
    homeTeamBadge: match.teams?.home?.badge || null,
    awayTeamBadge: match.teams?.away?.badge || null,
    homeScore: match.score?.home?.toString() || null,
    awayScore: match.score?.away?.toString() || null,
    sport: match.category || '',
    sportIcon: '⚽',
    league: match.tournament || match.category || '',
    date: matchDate.toISOString().split('T')[0],
    time: matchDate.toTimeString().slice(0, 8),
    timestamp: matchDate.toISOString(),
    venue: null,
    country: null,
    status: match.isLive ? 'Live' : 'Upcoming',
    progress: match.progress || null,
    poster: match.poster || null,
    banner: null,
    isLive: match.isLive || false,
    isFinished: false,
    channels: match.sources?.map((s, idx) => ({
      id: s.id || `stream-${idx}`,
      name: s.name || `${(s.source || 'Stream').charAt(0).toUpperCase() + (s.source || 'stream').slice(1)} ${idx + 1}`,
      country: 'English',
      logo: s.image || '',
      embedUrl: `https://westream.top/embed/${s.source}/${s.id}/1`
    })) || []
  };
};

// Convert SelectedMatch to MatchType for shared components
const convertToMatchType = (match: SelectedMatch): MatchType => ({
  id: match.id,
  title: match.title,
  category: match.league,
  date: new Date(match.timestamp).getTime(),
  poster: match.poster || '',
  popular: match.isLive,
  teams: {
    home: {
      name: match.homeTeam,
      badge: match.homeTeamBadge || undefined,
    },
    away: {
      name: match.awayTeam,
      badge: match.awayTeamBadge || undefined,
    }
  },
  score: {
    home: match.homeScore || undefined,
    away: match.awayScore || undefined
  },
  progress: match.progress || undefined,
  sources: match.channels?.map((ch, idx) => ({
    source: ch.name,
    id: ch.id || `stream-${idx}`,
    name: ch.name,
    image: ch.logo
  })) || []
});

// Setup streams from match channels
const setupStreams = (match: SelectedMatch) => {
  const streamableChannels = match.channels?.filter((ch) => ch.embedUrl) || [];
  const streams: Stream[] = streamableChannels.map((ch, idx) => ({
    id: ch.id || `stream-${idx}`,
    streamNo: idx + 1,
    language: ch.country || 'English',
    hd: true,
    embedUrl: ch.embedUrl,
    source: ch.name,
    name: ch.name,
    image: ch.logo
  }));
  
  const groupedStreams: Record<string, Stream[]> = {};
  streams.forEach(stream => {
    const source = stream.source || 'default';
    if (!groupedStreams[source]) {
      groupedStreams[source] = [];
    }
    groupedStreams[source].push(stream);
  });
  
  return { streams, groupedStreams };
};

const SelectedMatchPlayer = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const cache = usePopularMatchesCache();
  
  // Try to get cached match immediately for instant display
  const cachedMatch = matchId ? cache.getMatch(matchId) : null;
  const initialMatch = cachedMatch ? convertCachedToSelected(cachedMatch) : null;
  
  const [match, setMatch] = useState<SelectedMatch | null>(initialMatch);
  const [loading, setLoading] = useState(!initialMatch);
  const [activeSource, setActiveSource] = useState<string | null>(null);
  const [currentStream, setCurrentStream] = useState<Stream | null>(null);
  const [loadingStream, setLoadingStream] = useState(false);
  const [allStreams, setAllStreams] = useState<Record<string, Stream[]>>({});

  // Initialize streams from cached match instantly
  useEffect(() => {
    if (initialMatch) {
      const { streams, groupedStreams } = setupStreams(initialMatch);
      setAllStreams(groupedStreams);
      if (streams.length > 0) {
        const firstStream = streams[0];
        setActiveSource(`${firstStream.source}/${firstStream.id}/1`);
        setCurrentStream(firstStream);
      }
    }
  }, []);

  const fetchMatch = async () => {
    if (!matchId) return;
    
    try {
      // Only show loading if we don't have cached data
      if (!match) {
        setLoading(true);
      }
      
      const { data, error } = await supabase.functions.invoke('fetch-popular-matches');
      
      if (error) {
        console.error('Error fetching matches:', error);
        return;
      }
      
      const matches = data?.matches || [];
      const foundMatch = matches.find((m: any) => m.id === matchId);
      
      if (foundMatch) {
        // Convert API response format to SelectedMatch format
        // API returns { sources: [{ source, id }] } but we need channels format
        const convertedMatch: SelectedMatch = {
          id: foundMatch.id,
          title: foundMatch.title,
          homeTeam: foundMatch.teams?.home?.name || 'TBD',
          awayTeam: foundMatch.teams?.away?.name || 'TBD',
          homeTeamBadge: foundMatch.teams?.home?.badge || null,
          awayTeamBadge: foundMatch.teams?.away?.badge || null,
          homeScore: foundMatch.score?.home?.toString() || null,
          awayScore: foundMatch.score?.away?.toString() || null,
          sport: foundMatch.category || '',
          sportIcon: '⚽',
          league: foundMatch.tournament || foundMatch.category || '',
          date: safeDate(foundMatch.date).toISOString().split('T')[0],
          time: safeDate(foundMatch.date).toTimeString().slice(0, 8),
          timestamp: safeDate(foundMatch.date).toISOString(),
          venue: null,
          country: null,
          status: foundMatch.isLive ? 'Live' : 'Upcoming',
          progress: foundMatch.progress || null,
          poster: foundMatch.poster || null,
          banner: null,
          isLive: foundMatch.isLive || false,
          isFinished: false,
          // Convert sources to channels format
          channels: (foundMatch.sources || []).map((s: { source: string; id: string }, idx: number) => ({
            id: s.id || `stream-${idx}`,
            name: `${s.source.charAt(0).toUpperCase() + s.source.slice(1)} Stream ${idx + 1}`,
            country: 'English',
            logo: '',
            embedUrl: `https://westream.top/embed/${s.source}/${s.id}/1`
          }))
        };
        
        setMatch(convertedMatch);
        const { streams, groupedStreams } = setupStreams(convertedMatch);
        setAllStreams(groupedStreams);
        
        // Only set streams if not already set
        if (!currentStream && streams.length > 0) {
          const firstStream = streams[0];
          setActiveSource(`${firstStream.source}/${firstStream.id}/1`);
          setCurrentStream(firstStream);
        }
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Always fetch fresh data in background, but don't block UI
    fetchMatch();
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [matchId]);

  const handleSourceChange = (source: string, id: string, streamNo?: number) => {
    triggerStreamChangeAd();
    setLoadingStream(true);
    setActiveSource(`${source}/${id}/${streamNo || 1}`);
    
    const streams = allStreams[source] || [];
    const stream = streams.find(s => s.id === id) || streams[0];
    if (stream) {
      setCurrentStream(stream);
    }
    
    setTimeout(() => setLoadingStream(false), 300);
  };

  const handleRefreshStreams = async () => {
    toast({
      title: "Refreshing streams...",
      description: "Scanning for available streams",
    });
    await fetchMatch();
    toast({
      title: "Refresh complete",
      description: `Found ${match?.channels?.filter(c => c.embedUrl).length || 0} streams`,
    });
  };

  if (loading) {
    return <LoadingState />;
  }

  if (!match) {
    return <NotFoundState />;
  }

  const matchDate = safeDate(match.timestamp);
  const matchTitle = `${match.homeTeam} vs ${match.awayTeam}`;
  const matchDescription = `Watch ${matchTitle} live stream online for free on DamiTV. ${match.league} match with HD quality streaming.`;

  const matchData = convertToMatchType(match);

  const getMatchPosterUrl = () => {
    if (match.poster && match.poster.trim() !== '') {
      return match.poster.startsWith('http') ? match.poster : `https://api.cdn-live.tv${match.poster}`;
    }
    return 'https://i.imgur.com/m4nV9S8.png';
  };

  const matchPosterUrl = getMatchPosterUrl();

  const streamDiscovery = {
    sourcesChecked: Object.keys(allStreams).length,
    sourcesWithStreams: Object.values(allStreams).filter(s => s.length > 0).length,
    sourceNames: Object.keys(allStreams)
  };

  return (
    <div className="min-h-screen bg-sports-dark text-sports-light">
      <SEOMetaTags
        title={`${matchTitle} - Live Stream | DamiTV`}
        description={`${matchDescription} - Watch ${matchTitle} on damitv.pro with HD quality streaming.`}
        keywords={`${match.homeTeam} live stream, ${match.awayTeam} online, ${matchTitle}, ${matchTitle} on damitv.pro, live football streaming`}
        canonicalUrl={`https://damitv.pro/selected-match/${matchId}`}
        ogImage={matchPosterUrl}
        matchInfo={{
          homeTeam: match.homeTeam,
          awayTeam: match.awayTeam,
          league: match.league,
          date: matchDate,
        }}
        breadcrumbs={[
          { name: 'Home', url: 'https://damitv.pro/' },
          { name: 'Live Matches', url: 'https://damitv.pro/live' },
          { name: `${matchTitle} on damitv.pro`, url: `https://damitv.pro/selected-match/${matchId}` }
        ]}
      />

      <Helmet>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SportsEvent",
            "name": matchTitle,
            "description": matchDescription,
            "startDate": matchDate.toISOString(),
            "eventStatus": "https://schema.org/EventScheduled",
            "eventAttendanceMode": "https://schema.org/OnlineEventAttendanceMode",
            "location": {
              "@type": "VirtualLocation",
              "url": `https://damitv.pro/selected-match/${matchId}`
            },
            "image": matchPosterUrl,
            "organizer": {
              "@type": "Organization",
              "name": "DamiTV",
              "url": "https://damitv.pro"
            },
            "competitor": [
              { "@type": "SportsTeam", "name": match.homeTeam },
              { "@type": "SportsTeam", "name": match.awayTeam }
            ]
          })}
        </script>
      </Helmet>
      
      <MatchHeader 
        match={matchData} 
        streamAvailable={!!currentStream}
        socialShare={
          <SocialShare 
            title={matchTitle}
            description={matchDescription}
            image={matchPosterUrl}
            url={`https://damitv.pro/selected-match/${matchId}`}
          />
        }
      />
      
      <div className="container mx-auto px-4 py-4 sm:py-8">
        <div className="mb-4">
          <TelegramBanner />
        </div>
        
        <div className="w-full flex justify-center mb-4">
          <div className="text-center max-w-4xl px-4">
            <div className="flex items-center justify-center gap-3 mb-2">
              {match.homeTeamBadge && (
                <img 
                  src={match.homeTeamBadge} 
                  alt={match.homeTeam} 
                  className="w-8 h-8 md:w-10 md:h-10 object-contain"
                  onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                />
              )}
              <h1 className="text-2xl md:text-3xl font-bold text-white">{match.title}</h1>
              {match.awayTeamBadge && (
                <img 
                  src={match.awayTeamBadge} 
                  alt={match.awayTeam} 
                  className="w-8 h-8 md:w-10 md:h-10 object-contain"
                  onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                />
              )}
            </div>
            <p className="text-sm md:text-base text-gray-400">{matchTitle} on damitv.pro</p>
          </div>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 min-w-0" id="stream-container" data-stream-container>
            <StreamTab
              match={matchData}
              stream={currentStream}
              loadingStream={loadingStream}
              activeSource={activeSource}
              handleSourceChange={handleSourceChange}
              popularMatches={[]}
              sportId={match.sport || 'football'}
              allStreams={allStreams}
              streamDiscovery={streamDiscovery}
              onRefreshStreams={handleRefreshStreams}
            />

            <div className="mt-4">
              <StreamViewerDisplay matchId={matchId || ''} isLive={match.isLive} />
            </div>

            <div className="mt-4">
              <ViewerStats match={matchData} />
            </div>
          </div>
        </div>

        <div className="mt-8">
          <MatchAnalysis match={matchData} />
        </div>
      </div>
      
      <footer className="bg-sports-darker text-gray-400 py-6 mt-10">
        <div className="container mx-auto px-4 text-center">
          <p>© 2025 DamiTV - All rights reserved</p>
        </div>
      </footer>
    </div>
  );
};

export default SelectedMatchPlayer;