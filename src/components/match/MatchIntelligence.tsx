import React, { useState } from 'react';
import { Clock, MapPin, CheckCircle, AlertCircle, RefreshCw, Users, TrendingUp, Zap, Wifi, Monitor, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Match } from '@/types/sports';
import { format } from 'date-fns';
import { triggerPopunderAd } from '@/utils/popunderAd';

interface MatchIntelligenceProps {
  match: Match;
  isLive?: boolean;
  lastUpdated?: Date;
  homeLineup?: string[];
  awayLineup?: string[];
  homeScore?: number | null;
  awayScore?: number | null;
  venue?: string;
  onAccessStream?: () => void;
}

/**
 * Match Intelligence Page Template
 * Semantic-first design optimized for Google AI Overviews and E-E-A-T signals
 */
const MatchIntelligence: React.FC<MatchIntelligenceProps> = ({
  match,
  isLive = false,
  lastUpdated = new Date(),
  homeLineup = [],
  awayLineup = [],
  homeScore,
  awayScore,
  venue: propVenue,
  onAccessStream
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Extract match details
  const matchTitle = match.title || `${match.teams?.home?.name || 'Home'} vs ${match.teams?.away?.name || 'Away'}`;
  const homeTeam = match.teams?.home?.name || 'Home Team';
  const awayTeam = match.teams?.away?.name || 'Away Team';
  const matchDate = match.date ? new Date(match.date) : new Date();
  const venue = propVenue || 'Stadium TBA';
  const category = match.category || 'Football';

  // Generate 40-word match summary for AI Overviews
  const matchSummary = `Watch ${homeTeam} take on ${awayTeam} in this exciting ${category} match. Stream live with HD quality, real-time updates, and expert analysis. Our verified stream links ensure uninterrupted viewing for fans worldwide seeking the best sports streaming experience.`;

  // Handle CTA click with monetization
  const handleAccessStream = () => {
    triggerPopunderAd(match.id || 'match', 'premium_cta');
    onAccessStream?.();
  };

  // Handle refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // FAQ data for schema markup
  const faqs = [
    {
      question: `What time does ${homeTeam} vs ${awayTeam} start?`,
      answer: `The match is scheduled to kick off at ${format(matchDate, 'h:mm a')} on ${format(matchDate, 'EEEE, MMMM d, yyyy')}. We recommend joining 10 minutes early to ensure your stream is ready.`
    },
    {
      question: 'How can I watch this match for free?',
      answer: 'DamiTV provides free access to live sports streams with multiple quality options. Simply click the stream button above to access verified, working links updated in real-time.'
    },
    {
      question: 'Why is my stream buffering or lagging?',
      answer: 'Buffering can occur due to network congestion, browser extensions, or VPN connections. Try refreshing the page, disabling ad blockers temporarily, or switching to a lower quality stream for smoother playback.'
    },
    {
      question: 'Are the streams on DamiTV legal and safe?',
      answer: 'DamiTV aggregates publicly available stream links and does not host any content. We verify all links for safety and quality. Users should comply with their local streaming regulations.'
    }
  ];

  // Generate JSON-LD Schema
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    "name": matchTitle,
    "startDate": matchDate.toISOString(),
    "location": {
      "@type": "Place",
      "name": venue
    },
    "competitor": [
      { "@type": "SportsTeam", "name": homeTeam },
      { "@type": "SportsTeam", "name": awayTeam }
    ],
    "organizer": {
      "@type": "Organization",
      "name": "DamiTV",
      "url": "https://damitv.pro"
    }
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return (
    <article className="w-full max-w-6xl mx-auto px-4 py-6 space-y-8" itemScope itemType="https://schema.org/SportsEvent">
      {/* JSON-LD Schema */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      {/* Hero Section - The AI Hook */}
      <header className="space-y-6">
        <h1 
          className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground tracking-tight"
          itemProp="name"
        >
          {matchTitle}
        </h1>

        {/* Quick Facts Card */}
        <Card className="bg-navy-900/50 border-gold-500/20 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4">
              {/* Quick Facts List */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-gold-400 flex-shrink-0" />
                  <span className="text-foreground" itemProp="startDate" content={matchDate.toISOString()}>
                    {format(matchDate, 'EEEE, MMM d • h:mm a')}
                  </span>
                </div>
                
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-gold-400 flex-shrink-0" />
                  <span className="text-foreground" itemProp="location">{venue}</span>
                </div>
                
                <div className="flex items-center gap-3">
                  {isLive ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                      <span className="text-green-400 font-medium">Verified • Live Now</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-5 w-5 text-gold-400 flex-shrink-0" />
                      <span className="text-gold-400">Upcoming • Links Ready</span>
                    </>
                  )}
                </div>
              </div>

              {/* Match Summary - 40 words for AI Overviews */}
              <p className="text-muted-foreground leading-relaxed border-t border-border/50 pt-4" itemProp="description">
                {matchSummary}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Primary CTA with Pulse Animation */}
        <Button 
          onClick={handleAccessStream}
          size="lg"
          className="w-full sm:w-auto bg-gold-500 hover:bg-gold-600 text-navy-900 font-semibold px-8 py-6 text-lg animate-pulse-subtle shadow-lg shadow-gold-500/20"
        >
          <Zap className="mr-2 h-5 w-5" />
          Access Premium Stream
        </Button>
      </header>

      {/* Content Layout - E-E-A-T Signal (2-Column Grid) */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Expert Lineup Analysis */}
        <Card className="bg-card/80 border-border/50 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Users className="h-5 w-5 text-gold-400" />
              Expert Lineup Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Home Team */}
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gold-400"></span>
                {homeTeam}
              </h3>
              {homeLineup.length > 0 ? (
                <ul className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                  {homeLineup.slice(0, 11).map((player, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="text-gold-400/60">{idx + 1}.</span> {player}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Lineup will be announced closer to kickoff. Check back for confirmed starting XI.
                </p>
              )}
            </div>

            {/* Away Team */}
            <div className="space-y-3 pt-4 border-t border-border/50">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-muted-foreground"></span>
                {awayTeam}
              </h3>
              {awayLineup.length > 0 ? (
                <ul className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                  {awayLineup.slice(0, 11).map((player, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="text-muted-foreground/60">{idx + 1}.</span> {player}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Lineup will be announced closer to kickoff. Check back for confirmed starting XI.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Live Match Insight */}
        <Card className="bg-card/80 border-border/50 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-xl">
                <TrendingUp className="h-5 w-5 text-gold-400" />
                Live Match Insight
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleRefresh}
                className="text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Last Updated: {format(lastUpdated, 'h:mm:ss a')}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-background/50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-foreground">
                  {homeScore !== null && homeScore !== undefined ? homeScore : '-'}
                </p>
                <p className="text-sm text-muted-foreground">{homeTeam}</p>
              </div>
              <div className="bg-background/50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-foreground">
                  {awayScore !== null && awayScore !== undefined ? awayScore : '-'}
                </p>
                <p className="text-sm text-muted-foreground">{awayTeam}</p>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-border/50">
              <h4 className="font-medium text-foreground">Match Status</h4>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isLive ? 'bg-green-400 animate-pulse' : 'bg-gold-400'}`}></div>
                <span className="text-sm text-muted-foreground">
                  {isLive ? 'Match in Progress' : 'Pre-Match Coverage Available'}
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {isLive 
                  ? 'Live stream is currently active. Multiple verified sources available for uninterrupted viewing.'
                  : 'Stream links will be activated 15 minutes before kickoff. Pre-match analysis and team news available now.'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Technical Help Section - Experience Factor */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Technical Support</h2>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="buffering" className="border border-border/50 rounded-lg px-4 bg-card/50">
            <AccordionTrigger className="text-left hover:no-underline py-4">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-gold-400" />
                <h3 className="text-lg font-semibold text-foreground">
                  Fix Buffering & Stream Issues
                </h3>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-6">
              <ol className="space-y-4 text-muted-foreground">
                <li className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gold-500/20 flex items-center justify-center">
                    <Wifi className="h-4 w-4 text-gold-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground mb-1">Step 1: Optimize Your Connection</h4>
                    <p className="text-sm leading-relaxed">
                      Close other bandwidth-heavy applications. If using WiFi, move closer to your router or switch to a wired connection for the most stable stream quality.
                    </p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gold-500/20 flex items-center justify-center">
                    <Monitor className="h-4 w-4 text-gold-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground mb-1">Step 2: Clear Browser Cache</h4>
                    <p className="text-sm leading-relaxed">
                      Press Ctrl+Shift+Delete (Windows) or Cmd+Shift+Delete (Mac) to clear cached data. This resolves most playback issues caused by outdated scripts.
                    </p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gold-500/20 flex items-center justify-center">
                    <Shield className="h-4 w-4 text-gold-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground mb-1">Step 3: Disable Extensions Temporarily</h4>
                    <p className="text-sm leading-relaxed">
                      Ad blockers and privacy extensions can interfere with video playback. Try disabling them for this site, or use an incognito/private window for smooth streaming.
                    </p>
                  </div>
                </li>
              </ol>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      {/* FAQ Section - AI Schema */}
      <section className="space-y-4" itemScope itemType="https://schema.org/FAQPage">
        <h2 className="text-2xl font-bold text-foreground">Frequently Asked Questions</h2>
        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <div 
              key={index} 
              className="bg-card/50 border border-border/50 rounded-lg p-6"
              itemScope 
              itemProp="mainEntity" 
              itemType="https://schema.org/Question"
            >
              <h3 className="text-lg font-semibold text-foreground mb-3" itemProp="name">
                {faq.question}
              </h3>
              <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                <p className="text-muted-foreground leading-relaxed" itemProp="text">
                  {faq.answer}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Social Bar Container - Fixed Height for Zero CLS */}
      <div 
        className="h-16 bg-card/30 border border-border/30 rounded-lg flex items-center justify-center"
        aria-label="Promotional content area"
      >
        <p className="text-sm text-muted-foreground">
          Join 50,000+ fans streaming live sports on DamiTV
        </p>
      </div>
    </article>
  );
};

export default MatchIntelligence;
