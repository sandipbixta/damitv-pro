// Competitor SEO targeting utility
export const COMPETITOR_SITES = [
  'totalsportek',
  'daddylivehd', 
  'streamed.su',
  'tflixtv',
  'pp.to',
  'rojadirecta',
  'freesports',
  'sport365.live',
  'streameast',
  'crackstreams',
  'sportsurge',
  'buffstreams',
  'hesgoal',
  'vipleague',
  'firstrowsports',
  'cricfree',
  'livesoccertv'
];

export const COMPETITOR_TERMS = [
  'alternative to totalsportek',
  'better than daddylivehd',
  'streamed.su alternative',
  'tflixtv replacement', 
  'rojadirecta alternative',
  'free sports streaming like',
  'similar to streameast',
  'crackstreams alternative',
  'sportsurge replacement',
  'buffstreams alternative',
  'hesgoal alternative',
  'vipleague replacement'
];

export const generateCompetitorKeywords = (baseKeywords: string = ''): string => {
  const competitorKeywords = [
    // Direct competitor mentions
    ...COMPETITOR_SITES.map(site => `${site} alternative`),
    ...COMPETITOR_SITES.map(site => `better than ${site}`),
    ...COMPETITOR_SITES.map(site => `${site} replacement`),
    ...COMPETITOR_SITES.map(site => `free alternative to ${site}`),
    
    // General alternative phrases
    'best free sports streaming sites',
    'free live sports alternatives',
    'watch sports online without subscription', 
    'free football streaming sites',
    'live sports streaming alternatives',
    'best sports streaming platforms',
    'free soccer streaming sites',
    'live match streaming alternatives',
    'sports streaming without ads',
    'reliable sports streaming sites',
    'hd sports streaming free',
    'mobile sports streaming',
    'safe sports streaming sites',
    
    // Enhanced location-based keywords
    'watch sports online free USA',
    'free sports streaming UK',
    'live football streams Europe',
    'free sports streaming worldwide',
    'international sports streaming',
    'global sports streaming free',
    
    // Long-tail search terms people actually use
    'where to watch live sports for free',
    'how to stream sports without cable',
    'free sports streaming no signup',
    'watch live football matches online',
    'best site to watch sports online free',
    'live sports streaming reddit alternative',
    'free sports streaming sites that work',
    'watch sports online free no ads'
  ];
  
  const allKeywords = baseKeywords 
    ? `${baseKeywords}, ${competitorKeywords.join(', ')}`
    : competitorKeywords.join(', ');
    
  return allKeywords;
};

export const generateCompetitorTitle = (originalTitle: string, page: 'home' | 'live' | 'channels' | 'match'): string => {
  const competitorPhrases = {
    home: 'Best Alternative to TotalSportek, DaddyLiveHD & StreamEast',
    live: 'Free Live Sports - Better than TotalSportek Alternative', 
    channels: 'Live TV Channels - TotalSportek & DaddyLiveHD Alternative',
    match: 'Watch Live - Free Alternative to StreamEast & Crackstreams'
  };
  
  return `${originalTitle} | ${competitorPhrases[page]} | DamiTV`;
};

export const generateCompetitorDescription = (originalDesc: string, page: 'home' | 'live' | 'channels' | 'match'): string => {
  const competitorDescriptions = {
    home: `Free sports streaming alternative to TotalSportek, DaddyLiveHD, StreamEast. Watch live football, basketball, tennis & more without subscription. Better quality, no ads, mobile-friendly alternative to popular streaming sites.`,
    live: `Watch live sports free - best alternative to TotalSportek, StreamEast, Crackstreams. HD quality streams, no registration required. Better than DaddyLiveHD with reliable mobile streaming.`,
    channels: `Free live TV channels - perfect alternative to streaming sites like TotalSportek, Hesgoal, VIPLeague. Watch sports channels without subscription, better quality than traditional streaming platforms.`,
    match: `Stream live matches free - reliable alternative to StreamEast, Crackstreams, BuffStreams. HD quality, no ads, works on mobile. Better experience than TotalSportek or DaddyLiveHD.`
  };
  
  return competitorDescriptions[page];
};

export const generateCompetitorContent = (matchTitle?: string): { 
  faqData: Array<{question: string; answer: string}>;
  competitorMentions: string[];
} => {
  const faqData = [
    {
      question: "Is DamiTV a good alternative to TotalSportek?",
      answer: "Yes, DamiTV offers better streaming quality, faster loading times, and a cleaner interface compared to TotalSportek. We provide HD streams without intrusive ads and work perfectly on mobile devices."
    },
    {
      question: "How does DamiTV compare to DaddyLiveHD and StreamEast?", 
      answer: "DamiTV provides more reliable streams than DaddyLiveHD and StreamEast, with better uptime and faster servers. Our platform is also safer with fewer pop-ups and malicious redirects."
    },
    {
      question: "Can I watch the same sports as on Crackstreams and BuffStreams?",
      answer: "Yes, DamiTV covers all major sports including NFL, NBA, Premier League, Champions League, and more. We offer the same content as Crackstreams and BuffStreams but with better quality and reliability."
    },
    {
      question: "Is DamiTV free like other streaming sites?",
      answer: "Yes, DamiTV is completely free to use, just like TotalSportek, StreamEast, and other popular sports streaming platforms. No registration or subscription required."
    },
    {
      question: "Does DamiTV work better on mobile than Hesgoal and VIPLeague?",
      answer: "Absolutely! DamiTV is fully optimized for mobile viewing, providing a much better experience than Hesgoal, VIPLeague, or similar sites. Our responsive design works perfectly on phones and tablets."
    },
    {
      question: "Why should I use DamiTV instead of Rojadirecta or other streaming sites?",
      answer: "DamiTV offers superior streaming quality, better server reliability, cleaner interface, and fewer ads compared to Rojadirecta and other traditional streaming platforms. We also provide better customer experience and faster loading times."
    }
  ];

  const competitorMentions = [
    `Looking for a reliable alternative to ${COMPETITOR_SITES.slice(0, 3).join(', ')}? DamiTV provides the same content with better quality.`,
    `Unlike ${COMPETITOR_SITES.slice(3, 6).join(', ')}, DamiTV offers HD streams without constant buffering or redirects.`,
    `DamiTV delivers what ${COMPETITOR_SITES.slice(6, 9).join(', ')} promise but with superior performance and user experience.`,
    `Free sports streaming that actually works - better than ${COMPETITOR_SITES.slice(0, 4).join(', ')} combined.`
  ];

  return { faqData, competitorMentions };
};

export const trackCompetitorSearch = (searchTerm: string, referrer?: string) => {
  // Track when users come from competitor searches
  const isCompetitorSearch = COMPETITOR_SITES.some(site => 
    searchTerm.toLowerCase().includes(site.toLowerCase())
  );
  
  if (isCompetitorSearch) {
    // Analytics tracking would go here
    console.log(`Competitor search detected: ${searchTerm}`, { referrer });
  }
};