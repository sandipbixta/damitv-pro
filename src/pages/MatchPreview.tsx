import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Calendar, Clock, Trophy, Tv, Play, ArrowLeft, Users, Star, TrendingUp, History, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PageLayout from '@/components/PageLayout';
import { useSportsData } from '@/contexts/SportsDataContext';
import { generateMatchPreview, generateMatchSchema, generateMatchSlug } from '@/utils/matchPreviewGenerator';
import { Match } from '@/types/sports';
import { getMatchPreviewData, MatchPreviewData } from '@/services/sportsDbService';

// Get appropriate time label based on sport
const getTimeLabel = (sport: string, isSingleEvent: boolean): string => {
  if (isSingleEvent) return 'Start Time';

  const sportLower = sport?.toLowerCase() || '';
  if (sportLower === 'football' || sportLower === 'soccer') return 'Kick-off';
  if (sportLower === 'cricket') return 'Start Time';
  if (sportLower === 'tennis') return 'Match Time';
  if (sportLower === 'basketball') return 'Tip-off';
  if (sportLower === 'hockey') return 'Face-off';
  if (sportLower === 'baseball') return 'First Pitch';
  if (sportLower === 'boxing' || sportLower === 'mma') return 'Fight Time';
  return 'Start Time';
};

const MatchPreview = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  // Use allMatches instead of liveMatches to include upcoming matches
  const { allMatches, loading } = useSportsData();
  const [match, setMatch] = useState<Match | null>(null);
  const [preview, setPreview] = useState<ReturnType<typeof generateMatchPreview> | null>(null);
  const [searchAttempted, setSearchAttempted] = useState(false);
  const [enrichedData, setEnrichedData] = useState<MatchPreviewData | null>(null);
  const [loadingEnriched, setLoadingEnriched] = useState(false);

  useEffect(() => {
    if (!loading && slug && allMatches.length > 0) {
      console.log('🔍 Searching for match with slug:', slug);
      console.log('📋 Available matches:', allMatches.length);

      // Find match by slug - try multiple matching strategies
      let foundMatch = allMatches.find(m => {
        const matchSlug = generateMatchSlug(m);
        return matchSlug === slug;
      });

      // If not found, try case-insensitive match
      if (!foundMatch) {
        foundMatch = allMatches.find(m => {
          const matchSlug = generateMatchSlug(m).toLowerCase();
          return matchSlug === slug.toLowerCase();
        });
      }

      // If still not found, try partial match
      if (!foundMatch) {
        foundMatch = allMatches.find(m => {
          const matchSlug = generateMatchSlug(m);
          return matchSlug.includes(slug) || slug.includes(matchSlug);
        });
      }

      if (foundMatch) {
        console.log('✅ Found match:', foundMatch.title);
        setMatch(foundMatch);
        setPreview(generateMatchPreview(foundMatch));
      } else {
        console.log('❌ No match found for slug:', slug);
      }

      setSearchAttempted(true);
    }
  }, [allMatches, loading, slug]);

  // Fetch enriched data from TheSportsDB + Perplexity AI fallback when preview is ready
  useEffect(() => {
    if (preview && match && !enrichedData && !loadingEnriched) {
      setLoadingEnriched(true);
      getMatchPreviewData(
        preview.homeTeam,
        preview.awayTeam,
        preview.sport,
        preview.competition
      )
        .then(data => {
          setEnrichedData(data);
          console.log('📊 Enriched data loaded:', data);
        })
        .catch(err => console.error('Failed to load enriched data:', err))
        .finally(() => setLoadingEnriched(false));
    }
  }, [preview, match, enrichedData, loadingEnriched]);

  // Show loading while data is being fetched
  if (loading || (!searchAttempted && allMatches.length === 0)) {
    return (
      <PageLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
          <p className="text-gray-400">Loading match preview...</p>
        </div>
      </PageLayout>
    );
  }

  if (!match || !preview) {
    return (
      <PageLayout>
        <Helmet>
          <meta name="robots" content="noindex, nofollow" />
          <title>Match Not Found | DamiTV</title>
        </Helmet>
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Match Not Found</h1>
          <p className="text-gray-400 mb-6">This match preview is no longer available or the match has ended.</p>
          <Link to="/live">
            <Button>View Live Matches</Button>
          </Link>
        </div>
      </PageLayout>
    );
  }

  // Check if match is old (ended more than 3 days ago) - noindex old matches
  const matchDate = new Date(match.date);
  const now = new Date();
  const daysSinceMatch = (now.getTime() - matchDate.getTime()) / (1000 * 60 * 60 * 24);
  const isOldMatch = daysSinceMatch > 3;

  const matchSchema = generateMatchSchema(match, preview);

  return (
    <PageLayout>
      <Helmet>
        <title>{preview.pageTitle}</title>
        <meta name="description" content={preview.metaDescription} />
        <meta name="keywords" content={preview.keywords} />
        <link rel="canonical" href={`https://damitv.pro/preview/${preview.slug}`} />

        {/* Noindex old matches to prevent thin content indexing */}
        {isOldMatch && <meta name="robots" content="noindex, follow" />}

        {/* Open Graph */}
        <meta property="og:title" content={preview.pageTitle} />
        <meta property="og:description" content={preview.metaDescription} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://damitv.pro/preview/${preview.slug}`} />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={preview.pageTitle} />
        <meta name="twitter:description" content={preview.metaDescription} />

        {/* Schema Markup - only for upcoming/live matches */}
        {!isOldMatch && (
          <script type="application/ld+json">
            {JSON.stringify(matchSchema)}
          </script>
        )}
      </Helmet>

      <article className="max-w-4xl mx-auto px-4 py-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="mb-4 text-gray-400 hover:text-white"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* Match Header */}
        <header className="mb-8">
          <Badge className="mb-3 bg-primary/20 text-primary border-primary/30">
            {preview.competition}
          </Badge>

          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {preview.isSingleEvent
              ? `${preview.eventName} Live Stream`
              : `${preview.homeTeam} vs ${preview.awayTeam} Live Stream`}
          </h1>

          <p className="text-lg text-gray-300 mb-6">
            {preview.isSingleEvent
              ? `Watch ${preview.eventName} free live stream on DamiTV. ${preview.competition} ${preview.matchTerm} in HD quality - no registration required.`
              : `Watch ${preview.homeTeam} vs ${preview.awayTeam} free live stream on DamiTV. ${preview.competition} ${preview.matchTerm} in HD quality - no registration required.`}
          </p>

          {/* Match Info Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <Card className="bg-[#1a1d2d] border-gray-800">
              <CardContent className="p-4 flex items-center gap-3">
                <Calendar className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs text-gray-500">Date</p>
                  <p className="text-sm text-white font-medium">{preview.formattedDate.split(',')[0]}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1a1d2d] border-gray-800">
              <CardContent className="p-4 flex items-center gap-3">
                <Clock className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs text-gray-500">{getTimeLabel(preview.sport, preview.isSingleEvent)}</p>
                  <p className="text-sm text-white font-medium">{preview.formattedTime}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1a1d2d] border-gray-800">
              <CardContent className="p-4 flex items-center gap-3">
                <Trophy className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs text-gray-500">{preview.isSingleEvent ? 'Category' : 'Competition'}</p>
                  <p className="text-sm text-white font-medium">{preview.competition}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1a1d2d] border-gray-800">
              <CardContent className="p-4 flex items-center gap-3">
                <Tv className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs text-gray-500">Stream</p>
                  <p className="text-sm text-white font-medium">Free HD</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Watch Now CTA */}
          <Link to={`/match/${preview.sport}/${match.id}`}>
            <Button size="lg" className="w-full md:w-auto bg-primary hover:bg-primary/90 text-white font-semibold">
              <Play className="w-5 h-5 mr-2" />
              {preview.isSingleEvent
                ? `Watch ${preview.eventName} Live`
                : `Watch ${preview.homeTeam} vs ${preview.awayTeam} Live`}
            </Button>
          </Link>
        </header>

        {/* Main Content */}
        <div className="prose prose-invert max-w-none">
          {/* Match Preview Section */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Star className="w-6 h-6 text-primary" />
              Match Preview
            </h2>

            <div className="space-y-4 text-gray-300 leading-relaxed">
              {preview.previewParagraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </section>

          {/* AI Match Context - Unique content for SEO */}
          {enrichedData?.matchContext && (
            <section className="mb-8">
              <Card className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-purple-500/30">
                <CardContent className="p-4">
                  <p className="text-gray-200 leading-relaxed">{enrichedData.matchContext}</p>
                </CardContent>
              </Card>
            </section>
          )}

          {/* Team Form - Real Data (only for team vs team matches) */}
          {!preview.isSingleEvent && enrichedData && (enrichedData.homeTeam.form || enrichedData.awayTeam.form) && (
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-primary" />
                Current Form
              </h2>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Home Team Form */}
                <Card className="bg-[#1a1d2d] border-gray-800">
                  <CardContent className="p-4">
                    <h3 className="font-bold text-white mb-2">{preview.homeTeam}</h3>
                    <div className="flex gap-1 mb-2">
                      {enrichedData.homeTeam.form.split('').map((result, i) => (
                        <span
                          key={i}
                          className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold ${
                            result === 'W' ? 'bg-green-500/20 text-green-400' :
                            result === 'L' ? 'bg-red-500/20 text-red-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}
                        >
                          {result}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500">Last 5 matches</p>
                    {enrichedData.homeTeam.aiInfo?.keyStats && (
                      <p className="text-xs text-gray-400 mt-2">{enrichedData.homeTeam.aiInfo.keyStats}</p>
                    )}
                  </CardContent>
                </Card>

                {/* Away Team Form */}
                <Card className="bg-[#1a1d2d] border-gray-800">
                  <CardContent className="p-4">
                    <h3 className="font-bold text-white mb-2">{preview.awayTeam}</h3>
                    <div className="flex gap-1 mb-2">
                      {enrichedData.awayTeam.form.split('').map((result, i) => (
                        <span
                          key={i}
                          className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold ${
                            result === 'W' ? 'bg-green-500/20 text-green-400' :
                            result === 'L' ? 'bg-red-500/20 text-red-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}
                        >
                          {result}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500">Last 5 matches</p>
                    {enrichedData.awayTeam.aiInfo?.keyStats && (
                      <p className="text-xs text-gray-400 mt-2">{enrichedData.awayTeam.aiInfo.keyStats}</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </section>
          )}

          {/* Injuries - AI Data (only for team vs team matches) */}
          {!preview.isSingleEvent && enrichedData && (enrichedData.homeTeam.injuries?.length || enrichedData.awayTeam.injuries?.length) && (
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <AlertCircle className="w-6 h-6 text-yellow-500" />
                Team News & Injuries
              </h2>

              <div className="grid md:grid-cols-2 gap-4">
                {enrichedData.homeTeam.injuries && enrichedData.homeTeam.injuries.length > 0 && (
                  <Card className="bg-[#1a1d2d] border-gray-800">
                    <CardContent className="p-4">
                      <h3 className="font-bold text-white mb-2">{preview.homeTeam}</h3>
                      <ul className="space-y-1">
                        {enrichedData.homeTeam.injuries.map((player, i) => (
                          <li key={i} className="text-sm text-yellow-400/80 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></span>
                            {player}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {enrichedData.awayTeam.injuries && enrichedData.awayTeam.injuries.length > 0 && (
                  <Card className="bg-[#1a1d2d] border-gray-800">
                    <CardContent className="p-4">
                      <h3 className="font-bold text-white mb-2">{preview.awayTeam}</h3>
                      <ul className="space-y-1">
                        {enrichedData.awayTeam.injuries.map((player, i) => (
                          <li key={i} className="text-sm text-yellow-400/80 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></span>
                            {player}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>
            </section>
          )}

          {/* Recent Results - Real Data from TheSportsDB or AI (only for team vs team matches) */}
          {!preview.isSingleEvent && enrichedData && (
            enrichedData.homeTeam.lastMatches.length > 0 ||
            enrichedData.awayTeam.lastMatches.length > 0 ||
            enrichedData.homeTeam.aiResults?.length ||
            enrichedData.awayTeam.aiResults?.length
          ) && (
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <History className="w-6 h-6 text-primary" />
                Recent Results
              </h2>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Home Team Recent - TheSportsDB data */}
                {enrichedData.homeTeam.lastMatches.length > 0 ? (
                  <Card className="bg-[#1a1d2d] border-gray-800">
                    <CardContent className="p-4">
                      <h3 className="font-bold text-white mb-3">{preview.homeTeam}</h3>
                      <div className="space-y-2">
                        {enrichedData.homeTeam.lastMatches.slice(0, 3).map((m, i) => (
                          <div key={i} className="flex justify-between items-center text-sm">
                            <span className="text-gray-400 truncate flex-1">
                              {m.homeTeam} vs {m.awayTeam}
                            </span>
                            <span className="text-white font-bold ml-2">
                              {m.homeScore} - {m.awayScore}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : enrichedData.homeTeam.aiResults && enrichedData.homeTeam.aiResults.length > 0 ? (
                  /* Home Team Recent - AI data fallback */
                  <Card className="bg-[#1a1d2d] border-gray-800">
                    <CardContent className="p-4">
                      <h3 className="font-bold text-white mb-3">{preview.homeTeam}</h3>
                      <div className="space-y-2">
                        {enrichedData.homeTeam.aiResults.slice(0, 3).map((m, i) => (
                          <div key={i} className="flex justify-between items-center text-sm">
                            <span className="text-gray-400 truncate flex-1">
                              vs {m.opponent}
                            </span>
                            <span className={`font-bold ml-2 ${
                              m.result === 'W' ? 'text-green-400' :
                              m.result === 'L' ? 'text-red-400' : 'text-gray-400'
                            }`}>
                              {m.score} ({m.result})
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : null}

                {/* Away Team Recent - TheSportsDB data */}
                {enrichedData.awayTeam.lastMatches.length > 0 ? (
                  <Card className="bg-[#1a1d2d] border-gray-800">
                    <CardContent className="p-4">
                      <h3 className="font-bold text-white mb-3">{preview.awayTeam}</h3>
                      <div className="space-y-2">
                        {enrichedData.awayTeam.lastMatches.slice(0, 3).map((m, i) => (
                          <div key={i} className="flex justify-between items-center text-sm">
                            <span className="text-gray-400 truncate flex-1">
                              {m.homeTeam} vs {m.awayTeam}
                            </span>
                            <span className="text-white font-bold ml-2">
                              {m.homeScore} - {m.awayScore}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : enrichedData.awayTeam.aiResults && enrichedData.awayTeam.aiResults.length > 0 ? (
                  /* Away Team Recent - AI data fallback */
                  <Card className="bg-[#1a1d2d] border-gray-800">
                    <CardContent className="p-4">
                      <h3 className="font-bold text-white mb-3">{preview.awayTeam}</h3>
                      <div className="space-y-2">
                        {enrichedData.awayTeam.aiResults.slice(0, 3).map((m, i) => (
                          <div key={i} className="flex justify-between items-center text-sm">
                            <span className="text-gray-400 truncate flex-1">
                              vs {m.opponent}
                            </span>
                            <span className={`font-bold ml-2 ${
                              m.result === 'W' ? 'text-green-400' :
                              m.result === 'L' ? 'text-red-400' : 'text-gray-400'
                            }`}>
                              {m.score} ({m.result})
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : null}
              </div>
            </section>
          )}

          {/* About the Teams - Real Data from TheSportsDB or AI (only for team vs team matches) */}
          {!preview.isSingleEvent && enrichedData && (
            enrichedData.homeTeam.info?.description ||
            enrichedData.awayTeam.info?.description ||
            enrichedData.homeTeam.aiInfo?.description ||
            enrichedData.awayTeam.aiInfo?.description
          ) && (
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Users className="w-6 h-6 text-primary" />
                About the Teams
              </h2>

              <div className="space-y-6">
                {/* Home Team - TheSportsDB or AI */}
                {(enrichedData.homeTeam.info?.description || enrichedData.homeTeam.aiInfo?.description) && (
                  <div>
                    <h3 className="font-bold text-white mb-2">{preview.homeTeam}</h3>
                    <p className="text-gray-300 leading-relaxed text-sm">
                      {enrichedData.homeTeam.info?.description
                        ? (enrichedData.homeTeam.info.description.slice(0, 500) +
                           (enrichedData.homeTeam.info.description.length > 500 ? '...' : ''))
                        : enrichedData.homeTeam.aiInfo?.description}
                    </p>
                    {/* Stadium from TheSportsDB */}
                    {enrichedData.homeTeam.info?.stadium && (
                      <p className="text-gray-500 text-xs mt-2">
                        Home: {enrichedData.homeTeam.info.stadium}
                        {enrichedData.homeTeam.info.stadiumCapacity && ` (${enrichedData.homeTeam.info.stadiumCapacity} capacity)`}
                      </p>
                    )}
                    {/* Stadium from AI */}
                    {!enrichedData.homeTeam.info?.stadium && enrichedData.homeTeam.aiInfo?.stadium && (
                      <p className="text-gray-500 text-xs mt-2">
                        Home: {enrichedData.homeTeam.aiInfo.stadium}
                      </p>
                    )}
                    {/* Key players from AI */}
                    {enrichedData.homeTeam.aiInfo?.keyPlayers && enrichedData.homeTeam.aiInfo.keyPlayers.length > 0 && (
                      <p className="text-gray-500 text-xs mt-1">
                        Key players: {enrichedData.homeTeam.aiInfo.keyPlayers.join(', ')}
                      </p>
                    )}
                    {/* Coach from AI */}
                    {enrichedData.homeTeam.aiInfo?.coach && (
                      <p className="text-gray-500 text-xs mt-1">
                        Coach: {enrichedData.homeTeam.aiInfo.coach}
                      </p>
                    )}
                  </div>
                )}

                {/* Away Team - TheSportsDB or AI */}
                {(enrichedData.awayTeam.info?.description || enrichedData.awayTeam.aiInfo?.description) && (
                  <div>
                    <h3 className="font-bold text-white mb-2">{preview.awayTeam}</h3>
                    <p className="text-gray-300 leading-relaxed text-sm">
                      {enrichedData.awayTeam.info?.description
                        ? (enrichedData.awayTeam.info.description.slice(0, 500) +
                           (enrichedData.awayTeam.info.description.length > 500 ? '...' : ''))
                        : enrichedData.awayTeam.aiInfo?.description}
                    </p>
                    {/* Stadium from TheSportsDB */}
                    {enrichedData.awayTeam.info?.stadium && (
                      <p className="text-gray-500 text-xs mt-2">
                        Home: {enrichedData.awayTeam.info.stadium}
                        {enrichedData.awayTeam.info.stadiumCapacity && ` (${enrichedData.awayTeam.info.stadiumCapacity} capacity)`}
                      </p>
                    )}
                    {/* Stadium from AI */}
                    {!enrichedData.awayTeam.info?.stadium && enrichedData.awayTeam.aiInfo?.stadium && (
                      <p className="text-gray-500 text-xs mt-2">
                        Home: {enrichedData.awayTeam.aiInfo.stadium}
                      </p>
                    )}
                    {/* Key players from AI */}
                    {enrichedData.awayTeam.aiInfo?.keyPlayers && enrichedData.awayTeam.aiInfo.keyPlayers.length > 0 && (
                      <p className="text-gray-500 text-xs mt-1">
                        Key players: {enrichedData.awayTeam.aiInfo.keyPlayers.join(', ')}
                      </p>
                    )}
                    {/* Coach from AI */}
                    {enrichedData.awayTeam.aiInfo?.coach && (
                      <p className="text-gray-500 text-xs mt-1">
                        Coach: {enrichedData.awayTeam.aiInfo.coach}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Head to Head (only for team vs team matches) */}
          {!preview.isSingleEvent && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" />
              Head-to-Head
            </h2>

            <div className="text-gray-300 leading-relaxed">
              {/* TheSportsDB H2H data */}
              {enrichedData?.h2hMatches && enrichedData.h2hMatches.length > 0 ? (
                <>
                  <p className="mb-4">
                    Recent meetings between {preview.homeTeam} and {preview.awayTeam}:
                  </p>
                  <div className="space-y-2 mb-4">
                    {enrichedData.h2hMatches.slice(0, 3).map((m, i) => (
                      <div key={i} className="flex justify-between items-center bg-[#1a1d2d] p-3 rounded">
                        <span className="text-gray-400">{m.date}</span>
                        <span className="text-white">
                          {m.homeTeam} <strong>{m.homeScore} - {m.awayScore}</strong> {m.awayTeam}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : enrichedData?.aiH2H ? (
                /* AI H2H data fallback */
                <>
                  <p className="mb-4">{enrichedData.aiH2H.summary}</p>
                  {enrichedData.aiH2H.lastMeetings && enrichedData.aiH2H.lastMeetings.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {enrichedData.aiH2H.lastMeetings.slice(0, 3).map((m, i) => (
                        <div key={i} className="flex justify-between items-center bg-[#1a1d2d] p-3 rounded">
                          <span className="text-gray-400">{m.date}</span>
                          <span className="text-white">
                            <strong>{m.score}</strong> - Winner: {m.winner}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <p>
                    Historical meetings between {preview.homeTeam} and {preview.awayTeam} have
                    always produced entertaining {preview.sport}. Both teams have had their share of
                    victories, making this an evenly matched {preview.matchTerm}.
                  </p>
                  <p className="mt-4">
                    Previous encounters have featured plenty of {preview.config.actionWords[0]} and memorable moments.
                    {preview.config.fanType} can expect nothing less from this upcoming {preview.matchTerm}.
                  </p>
                </>
              )}
            </div>
          </section>
          )}

          {/* Where to Watch */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Tv className="w-6 h-6 text-primary" />
              {preview.isSingleEvent
                ? `Where to Watch ${preview.eventName}`
                : `Where to Watch ${preview.homeTeam} vs ${preview.awayTeam}`}
            </h2>

            <Card className="bg-gradient-to-br from-primary/20 to-primary/5 border-primary/30">
              <CardContent className="p-6">
                <p className="text-gray-300 mb-4">
                  {preview.isSingleEvent
                    ? `Stream ${preview.eventName} live and free on DamiTV. Our platform offers:`
                    : `Stream ${preview.homeTeam} vs ${preview.awayTeam} live and free on DamiTV. Our platform offers:`}
                </p>

                <ul className="space-y-2 text-gray-300 mb-6">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-primary rounded-full"></span>
                    <strong>HD Quality Streaming</strong> - Crystal clear picture quality
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-primary rounded-full"></span>
                    <strong>No Registration</strong> - Start watching instantly
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-primary rounded-full"></span>
                    <strong>Multiple Sources</strong> - Alternative streams if one fails
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-primary rounded-full"></span>
                    <strong>Mobile Friendly</strong> - Watch on any device
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-primary rounded-full"></span>
                    <strong>No VPN Required</strong> - Access from anywhere
                  </li>
                </ul>

                <Link to={`/match/${preview.sport}/${match.id}`}>
                  <Button className="bg-primary hover:bg-primary/90">
                    <Play className="w-4 h-4 mr-2" />
                    Watch Now Free
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </section>

          {/* Event/Match Facts */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">
              {preview.isSingleEvent ? 'Event Details' : 'Match Facts'}
            </h2>

            <Card className="bg-[#1a1d2d] border-gray-800">
              <CardContent className="p-6">
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-gray-500 text-sm">{preview.isSingleEvent ? 'Category' : 'Competition'}</dt>
                    <dd className="text-white font-medium">{preview.competition}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500 text-sm">Date</dt>
                    <dd className="text-white font-medium">{preview.formattedDate}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500 text-sm">{getTimeLabel(preview.sport, preview.isSingleEvent)}</dt>
                    <dd className="text-white font-medium">{preview.formattedTime}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500 text-sm">Broadcast</dt>
                    <dd className="text-white font-medium">Free on DamiTV</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </section>

          {/* Related Events/Matches CTA */}
          <section className="mt-12 text-center">
            <h2 className="text-xl font-bold text-white mb-4">More Live Events</h2>
            <p className="text-gray-400 mb-6">
              Check out other live sports and events available on DamiTV
            </p>
            <Link to="/live">
              <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white">
                View All Live Events
              </Button>
            </Link>
          </section>
        </div>
      </article>
    </PageLayout>
  );
};

export default MatchPreview;
