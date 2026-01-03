import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import PageLayout from '@/components/PageLayout';
import MatchIntelligence from '@/components/match/MatchIntelligence';
import { Loader2, Play } from 'lucide-react';
import { Match as MatchType } from '@/types/sports';
import { adConfig } from '@/utils/adConfig';

interface DBMatch {
  id: string;
  match_id: string;
  home_team: string;
  away_team: string;
  home_team_badge: string | null;
  away_team_badge: string | null;
  match_time: string;
  league: string | null;
  venue: string | null;
  status: string;
  home_score: number | null;
  away_score: number | null;
  seo_preview: string | null;
  faqs: Array<{ question: string; answer: string }> | null;
  sport: string;
}

const MatchDetail: React.FC = () => {
  const { matchName } = useParams<{ matchName: string }>();
  const navigate = useNavigate();
  const [match, setMatch] = useState<DBMatch | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMatch = async () => {
      if (!matchName) {
        setError('Match not found');
        setIsLoading(false);
        return;
      }

      try {
        // Convert URL slug back to search terms
        const searchTerms = matchName
          .replace(/-live-stream$/, '')
          .replace(/-vs-/i, ' ')
          .replace(/-/g, ' ')
          .toLowerCase();

        // Search for match by team names
        const { data, error: fetchError } = await supabase
          .from('matches')
          .select('*')
          .or(`home_team.ilike.%${searchTerms.split(' ')[0]}%,away_team.ilike.%${searchTerms.split(' ')[0]}%`)
          .order('match_time', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (fetchError) {
          console.error('Fetch error:', fetchError);
          setError('Failed to load match');
        } else if (!data) {
          setError('Match not found');
        } else {
          // Parse faqs if it's a string
          const parsedMatch = {
            ...data,
            faqs: typeof data.faqs === 'string' ? JSON.parse(data.faqs) : data.faqs
          };
          setMatch(parsedMatch);
        }
      } catch (err) {
        console.error('Error:', err);
        setError('Failed to load match');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMatch();

    // Set up realtime subscription for live updates
    const channel = supabase
      .channel('match-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'matches',
        },
        (payload) => {
          if (match && payload.new.match_id === match.match_id) {
            const updated = payload.new as DBMatch;
            setMatch({
              ...updated,
              faqs: typeof updated.faqs === 'string' ? JSON.parse(updated.faqs as string) : updated.faqs
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchName]);

  // Convert DB match to MatchType for MatchIntelligence component
  const convertToMatchType = (dbMatch: DBMatch): MatchType => ({
    id: dbMatch.match_id,
    title: `${dbMatch.home_team} vs ${dbMatch.away_team}`,
    category: dbMatch.sport,
    date: new Date(dbMatch.match_time).getTime(),
    popular: true,
    teams: {
      home: { name: dbMatch.home_team, badge: dbMatch.home_team_badge || undefined },
      away: { name: dbMatch.away_team, badge: dbMatch.away_team_badge || undefined },
    },
    sources: [],
  });

  if (isLoading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-12 w-12 animate-spin text-gold-400" />
        </div>
      </PageLayout>
    );
  }

  if (error || !match) {
    return (
      <PageLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Match Not Found</h1>
          <p className="text-muted-foreground mb-6">{error || 'The match you are looking for does not exist.'}</p>
          <button
            onClick={() => navigate('/live')}
            className="bg-gold-500 hover:bg-gold-600 text-navy-900 font-semibold px-6 py-3 rounded-lg"
          >
            Browse Live Matches
          </button>
        </div>
      </PageLayout>
    );
  }

  const matchTitle = `${match.home_team} vs ${match.away_team}`;
  const isLive = match.status === 'live';

  return (
    <PageLayout>
      <Helmet>
        <title>{matchTitle} Live Stream | Watch Free HD | DamiTV</title>
        <meta 
          name="description" 
          content={match.seo_preview?.slice(0, 160) || `Watch ${matchTitle} live stream free in HD quality. ${match.league} match streaming on DamiTV.`} 
        />
        <meta name="keywords" content={`${match.home_team} live stream, ${match.away_team} live, ${match.league} streaming, watch ${matchTitle} free`} />
        <link rel="canonical" href={`https://damitv.pro/match/${matchName}`} />
        
        {/* Open Graph */}
        <meta property="og:title" content={`${matchTitle} Live Stream | DamiTV`} />
        <meta property="og:description" content={match.seo_preview?.slice(0, 200) || `Stream ${matchTitle} live in HD`} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://damitv.pro/match/${matchName}`} />
        
        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SportsEvent",
            "name": matchTitle,
            "startDate": match.match_time,
            "location": {
              "@type": "Place",
              "name": match.venue || "TBA"
            },
            "competitor": [
              { "@type": "SportsTeam", "name": match.home_team },
              { "@type": "SportsTeam", "name": match.away_team }
            ]
          })}
        </script>
        
        {/* FAQ Schema */}
        {match.faqs && match.faqs.length > 0 && (
          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": match.faqs.map(faq => ({
                "@type": "Question",
                "name": faq.question,
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": faq.answer
                }
              }))
            })}
          </script>
        )}
      </Helmet>

      {/* Expert Preview Section */}
      {match.seo_preview && (
        <section className="max-w-6xl mx-auto px-4 py-6">
          <div className="bg-card/50 border border-border/50 rounded-lg p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">Expert Match Preview</h2>
            <p className="text-muted-foreground leading-relaxed">{match.seo_preview}</p>
          </div>
        </section>
      )}

      {/* Match Intelligence Component */}
      <MatchIntelligence
        match={convertToMatchType(match)}
        isLive={isLive}
        lastUpdated={new Date()}
        homeScore={match.home_score}
        awayScore={match.away_score}
        venue={match.venue || undefined}
        onAccessStream={() => navigate(`/live`)}
      />

      {/* Dynamic FAQ Section */}
      {match.faqs && match.faqs.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-8">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {match.faqs.map((faq, index) => (
              <div 
                key={index} 
                className="bg-card/50 border border-border/50 rounded-lg p-6"
              >
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {faq.question}
                </h3>
                <p className="text-muted-foreground">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Sticky Mobile CTA Button - Primary Revenue Source */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-background via-background to-transparent md:hidden">
        <a
          href={adConfig.directLink.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-navy-900 font-bold py-4 px-6 rounded-xl shadow-lg shadow-gold-500/30 transition-all duration-300 active:scale-[0.98]"
        >
          <Play className="w-5 h-5" fill="currentColor" />
          <span>Access Premium Stream</span>
        </a>
      </div>

      {/* Add bottom padding on mobile to account for sticky button */}
      <div className="h-24 md:hidden" />
    </PageLayout>
  );
};

export default MatchDetail;
