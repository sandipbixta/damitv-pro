import { Match } from '@/types/sports';

// Generate SEO-friendly slug from match title
export const generateMatchSlug = (match: Match): string => {
  const title = match.title || `${match.teams?.home?.name}-vs-${match.teams?.away?.name}`;
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
};

// Sport-specific configurations
const sportConfig: Record<string, {
  duration: string;
  fanType: string;
  venue: string;
  actionWords: string[];
  matchTerms: string[];
  isSingleEvent?: boolean;
}> = {
  basketball: {
    duration: '48 minutes of intense action',
    fanType: 'Basketball fans',
    venue: 'arena',
    actionWords: ['slam dunks', 'three-pointers', 'fast breaks', 'blocks', 'assists'],
    matchTerms: ['game', 'matchup', 'showdown', 'battle']
  },
  football: {
    duration: '90 minutes',
    fanType: 'Football fans',
    venue: 'stadium',
    actionWords: ['goals', 'saves', 'tackles', 'assists', 'headers'],
    matchTerms: ['match', 'fixture', 'clash', 'encounter']
  },
  soccer: {
    duration: '90 minutes',
    fanType: 'Soccer fans',
    venue: 'stadium',
    actionWords: ['goals', 'saves', 'tackles', 'assists', 'headers'],
    matchTerms: ['match', 'fixture', 'clash', 'encounter']
  },
  tennis: {
    duration: 'multiple sets of thrilling action',
    fanType: 'Tennis enthusiasts',
    venue: 'court',
    actionWords: ['aces', 'volleys', 'winners', 'break points', 'tiebreaks'],
    matchTerms: ['match', 'contest', 'battle', 'showdown']
  },
  hockey: {
    duration: '60 minutes of non-stop action',
    fanType: 'Hockey fans',
    venue: 'rink',
    actionWords: ['goals', 'saves', 'checks', 'power plays', 'assists'],
    matchTerms: ['game', 'matchup', 'clash', 'battle']
  },
  baseball: {
    duration: '9 innings of excitement',
    fanType: 'Baseball fans',
    venue: 'ballpark',
    actionWords: ['home runs', 'strikeouts', 'doubles', 'stolen bases', 'catches'],
    matchTerms: ['game', 'matchup', 'showdown', 'series']
  },
  mma: {
    duration: 'rounds of intense fighting',
    fanType: 'MMA fans',
    venue: 'octagon',
    actionWords: ['knockouts', 'submissions', 'takedowns', 'strikes', 'grappling'],
    matchTerms: ['fight', 'bout', 'matchup', 'showdown']
  },
  boxing: {
    duration: 'rounds of intense boxing',
    fanType: 'Boxing fans',
    venue: 'ring',
    actionWords: ['knockouts', 'jabs', 'uppercuts', 'combinations', 'defensive moves'],
    matchTerms: ['fight', 'bout', 'matchup', 'clash']
  },
  cricket: {
    duration: 'overs of exciting cricket',
    fanType: 'Cricket fans',
    venue: 'ground',
    actionWords: ['boundaries', 'wickets', 'sixes', 'catches', 'run outs'],
    matchTerms: ['match', 'fixture', 'clash', 'contest']
  },
  wrestling: {
    duration: 'hours of entertainment',
    fanType: 'Wrestling fans',
    venue: 'arena',
    actionWords: ['slams', 'finishers', 'submissions', 'high-flying moves', 'championship matches'],
    matchTerms: ['show', 'event', 'episode', 'card'],
    isSingleEvent: true
  },
  fight: {
    duration: 'hours of action-packed entertainment',
    fanType: 'Combat sports fans',
    venue: 'arena',
    actionWords: ['knockouts', 'submissions', 'title matches', 'rivalries', 'showdowns'],
    matchTerms: ['event', 'show', 'card', 'night'],
    isSingleEvent: true
  },
  default: {
    duration: 'hours of exciting action',
    fanType: 'Sports fans',
    venue: 'venue',
    actionWords: ['action', 'plays', 'highlights', 'moments', 'skills'],
    matchTerms: ['match', 'game', 'event', 'contest']
  }
};

// Detect if this is a single event (WWE, UFC card, etc.) vs team vs team match
const isSingleEventShow = (title: string, sport: string): boolean => {
  const singleEventKeywords = [
    'wwe', 'raw', 'smackdown', 'nxt', 'aew', 'dynamite', 'rampage',
    'ufc', 'bellator', 'pfl', 'one championship',
    'monday night', 'friday night', 'saturday night',
    'wrestlemania', 'summerslam', 'royal rumble', 'survivor series'
  ];
  const lowerTitle = title.toLowerCase();
  const lowerSport = sport.toLowerCase();

  return singleEventKeywords.some(keyword => lowerTitle.includes(keyword)) ||
         lowerSport === 'fight' ||
         lowerSport === 'wrestling' ||
         !title.toLowerCase().includes(' vs ');
};

// Get random item from array
const getRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Get sport config with fallback
const getSportConfig = (sport: string) => {
  const normalizedSport = sport.toLowerCase().replace(/[^a-z]/g, '');
  return sportConfig[normalizedSport] || sportConfig.default;
};

// Generate unique content for single events (WWE, UFC cards, etc.)
const generateSingleEventContent = (
  eventName: string,
  sport: string,
  competition: string
) => {
  const config = getSportConfig(sport);
  const matchTerm = getRandom(config.matchTerms);
  const action1 = getRandom(config.actionWords);
  const action2 = getRandom(config.actionWords.filter(a => a !== action1));

  const paragraphs = [
    // Paragraph 1 - Introduction
    [
      `${eventName} delivers another action-packed ${matchTerm} for fans worldwide. Get ready for ${config.duration} featuring the biggest superstars and most exciting moments.`,
      `The latest edition of ${eventName} promises to be an unforgettable ${matchTerm}. Expect ${action1}, ${action2}, and non-stop entertainment from start to finish.`,
      `${eventName} returns with another must-see ${matchTerm}. ${config.fanType} won't want to miss a single moment of this spectacular event.`
    ],

    // Paragraph 2 - Event highlights
    [
      `${config.fanType} are eagerly anticipating this ${eventName} ${matchTerm}. The card features championship matches, intense rivalries, and potential career-defining moments.`,
      `This edition of ${eventName} features some of the most anticipated matchups of the year. From ${action1} to shocking twists, this ${matchTerm} has it all.`,
      `Tonight's ${eventName} ${matchTerm} is stacked with incredible talent. Expect ${action1}, dramatic storylines, and moments that will be talked about for weeks.`
    ],

    // Paragraph 3 - What to expect
    [
      `${eventName} consistently delivers ${config.duration}. With rivalries heating up and championships on the line, this ${matchTerm} could be one for the ages.`,
      `Prepare for ${config.duration} of premium entertainment as ${eventName} showcases the best in the business. Every match promises intensity and excitement.`,
      `${eventName} never disappoints, and tonight's ${matchTerm} looks to continue that tradition. From opening bell to main event, expect nothing but the best.`
    ],

    // Paragraph 4 - Streaming CTA
    [
      `Watch ${eventName} live stream free on DamiTV. No registration required - simply click and enjoy HD quality streaming of this spectacular ${matchTerm}.`,
      `Stream ${eventName} live and free at DamiTV. Get instant access to every match in HD quality without any sign-up needed.`,
      `Catch all the action from ${eventName} with free live streaming on DamiTV. This ${matchTerm} is available in HD - no account required.`
    ]
  ];

  return paragraphs.map(options => getRandom(options));
};

// Generate unique content based on match and sport
const generateUniqueContent = (
  homeTeam: string,
  awayTeam: string,
  sport: string,
  competition: string
) => {
  const config = getSportConfig(sport);
  const matchTerm = getRandom(config.matchTerms);
  const action1 = getRandom(config.actionWords);
  const action2 = getRandom(config.actionWords.filter(a => a !== action1));

  // Generate varied paragraphs based on sport type
  const paragraphs = [
    // Paragraph 1 - Introduction (varies by context)
    [
      `${homeTeam} faces ${awayTeam} in an exciting ${competition} ${matchTerm}. Both teams enter this ${matchTerm} with determination to claim victory and improve their standings.`,
      `The ${competition} brings us an intriguing ${matchTerm} as ${homeTeam} hosts ${awayTeam}. This promises to be a competitive affair with both sides eager to perform.`,
      `${awayTeam} travels to face ${homeTeam} in what should be a captivating ${competition} ${matchTerm}. Stakes are high as both teams look to make their mark.`
    ],

    // Paragraph 2 - Fan excitement (sport-specific)
    [
      `${config.fanType} worldwide are anticipating this ${matchTerm} between ${homeTeam} and ${awayTeam}. Recent performances suggest we could witness some spectacular ${action1} and ${action2}.`,
      `This ${homeTeam} vs ${awayTeam} ${matchTerm} has captured the attention of ${config.fanType.toLowerCase()} everywhere. Expect plenty of ${action1} as these teams compete for supremacy.`,
      `${config.fanType} are counting down to this ${homeTeam} vs ${awayTeam} showdown. The ${config.venue} will be electric as both teams aim to showcase their best.`
    ],

    // Paragraph 3 - Match details (sport-specific)
    [
      `The ${competition} ${matchTerm} between ${homeTeam} and ${awayTeam} is set to deliver ${config.duration}. With talented players on both rosters, fans can expect an entertaining contest.`,
      `Expect ${config.duration} as ${homeTeam} and ${awayTeam} battle it out in this ${competition} ${matchTerm}. Both teams possess the quality to create memorable moments.`,
      `This ${competition} fixture promises ${config.duration} of top-tier competition. ${homeTeam} and ${awayTeam} both have the firepower to produce a classic.`
    ],

    // Paragraph 4 - Streaming CTA
    [
      `Watch ${homeTeam} vs ${awayTeam} live stream free on DamiTV. No registration required - simply click and enjoy HD quality streaming of this ${competition} ${matchTerm}.`,
      `Stream ${homeTeam} vs ${awayTeam} live and free at DamiTV. Get instant access to this ${competition} ${matchTerm} in HD quality without any sign-up needed.`,
      `Catch every moment of ${homeTeam} vs ${awayTeam} with free live streaming on DamiTV. This ${competition} ${matchTerm} is available in HD - no account required.`
    ]
  ];

  // Select one random paragraph from each category
  return paragraphs.map(options => getRandom(options));
};

// Generate match preview content
export const generateMatchPreview = (match: Match) => {
  const title = match.title || '';
  const sport = match.category || match.sportId || 'sports';
  const config = getSportConfig(sport);
  const matchDate = new Date(match.date);

  // Check if this is a single event (WWE, UFC, etc.)
  const isSingleEvent = isSingleEventShow(title, sport);

  let homeTeam: string;
  let awayTeam: string;
  let eventName: string;

  if (isSingleEvent) {
    // For single events, use the title as the event name
    eventName = title || 'Live Event';
    homeTeam = eventName;
    awayTeam = ''; // No away team for single events
  } else {
    // For team vs team matches
    homeTeam = match.teams?.home?.name || title?.split(' vs ')[0] || title?.split(' - ')[0] || 'Home Team';
    awayTeam = match.teams?.away?.name || title?.split(' vs ')[1]?.split(' -')[0] || title?.split(' - ')[1] || 'Away Team';
    eventName = `${homeTeam} vs ${awayTeam}`;
  }

  const competition = match.category?.charAt(0).toUpperCase() + match.category?.slice(1) || 'Sports';

  const formattedDate = matchDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const formattedTime = matchDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });

  // Generate unique preview paragraphs based on event type
  const previewParagraphs = isSingleEvent
    ? generateSingleEventContent(eventName, sport, competition)
    : generateUniqueContent(homeTeam, awayTeam, sport, competition);

  // Sport-specific terms
  const matchTerm = getRandom(config.matchTerms);

  // SEO keywords - different for single events vs matches
  const keywords = isSingleEvent
    ? [
        `${eventName} live stream`,
        `watch ${eventName} free`,
        `${eventName} free streaming`,
        `${eventName} online free`,
        `stream ${eventName}`,
        `${sport} live stream free`,
        `free ${sport} streaming`,
      ].join(', ')
    : [
        `${homeTeam} vs ${awayTeam} live stream`,
        `watch ${homeTeam} ${awayTeam} free`,
        `${homeTeam} vs ${awayTeam} free streaming`,
        `${competition} live stream`,
        `${homeTeam} live stream`,
        `${awayTeam} live stream`,
        `${sport} live stream free`,
        `free ${sport} streaming`,
      ].join(', ');

  // Meta description - different for single events
  const metaDescription = isSingleEvent
    ? `Watch ${eventName} live stream free on DamiTV. ${competition} ${matchTerm} streaming in HD quality. No registration required.`
    : `Watch ${homeTeam} vs ${awayTeam} live stream free on DamiTV. ${competition} ${matchTerm} streaming in HD quality. No registration required.`;

  // Page title - different for single events
  const pageTitle = isSingleEvent
    ? `${eventName} Live Stream Free | Watch Online | DamiTV`
    : `${homeTeam} vs ${awayTeam} Live Stream Free | ${competition} | DamiTV`;

  return {
    homeTeam,
    awayTeam,
    eventName,
    isSingleEvent,
    competition,
    sport,
    config,
    matchTerm,
    formattedDate,
    formattedTime,
    previewParagraphs,
    keywords,
    metaDescription,
    pageTitle,
    slug: generateMatchSlug(match)
  };
};

// Generate schema markup for match
export const generateMatchSchema = (match: Match, preview: ReturnType<typeof generateMatchPreview>) => {
  // Different schema for single events vs team matches
  if (preview.isSingleEvent) {
    return {
      "@context": "https://schema.org",
      "@type": "Event",
      "name": preview.eventName,
      "description": preview.metaDescription,
      "startDate": new Date(match.date).toISOString(),
      "eventAttendanceMode": "https://schema.org/OnlineEventAttendanceMode",
      "eventStatus": "https://schema.org/EventScheduled",
      "location": {
        "@type": "VirtualLocation",
        "url": `https://damitv.pro/preview/${preview.slug}`
      },
      "organizer": {
        "@type": "Organization",
        "name": preview.competition
      },
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD",
        "availability": "https://schema.org/InStock",
        "url": `https://damitv.pro/preview/${preview.slug}`,
        "description": "Free live streaming on DamiTV"
      }
    };
  }

  return {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    "name": `${preview.homeTeam} vs ${preview.awayTeam}`,
    "description": preview.metaDescription,
    "startDate": new Date(match.date).toISOString(),
    "location": {
      "@type": "Place",
      "name": `${preview.homeTeam} ${preview.config.venue}`,
      "address": {
        "@type": "PostalAddress",
        "addressCountry": "US"
      }
    },
    "competitor": [
      {
        "@type": "SportsTeam",
        "name": preview.homeTeam
      },
      {
        "@type": "SportsTeam",
        "name": preview.awayTeam
      }
    ],
    "organizer": {
      "@type": "Organization",
      "name": preview.competition
    },
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock",
      "url": `https://damitv.pro/preview/${preview.slug}`,
      "description": "Free live streaming on DamiTV"
    }
  };
};
