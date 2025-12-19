// Comprehensive SEO configuration for all pages
export const SEO_CONFIG = {
  siteUrl: 'https://damitv.pro',
  siteName: 'DamiTV',
  defaultTitle: 'DamiTV - Best Free Sports Streaming Site Alternative',
  defaultDescription: 'Watch free HD sports streaming - football, basketball, tennis & more. Top alternative to TotalSportek, Hesgoal, StreamEast. No registration required.',
  
  pages: {
    home: {
      title: 'Best Free Sports Streaming Site Alternatives | DamiTV',
      description: 'Watch free HD sports streams for football, basketball, tennis & more. Top alternative to TotalSportek, Hesgoal, VIPLeague, Buffstreams. No registration required.',
      keywords: 'free sports streaming, live sports, totalsportek alternative, hesgoal alternative, vipleague alternative, streameast alternative, buffstreams alternative, daddylivehd alternative, batmanstream alternative, crackstreams alternative',
      priority: 1.0,
      changefreq: 'daily' as const
    },
    live: {
      title: 'Live Sports Streaming Free - Watch Football Online | DamiTV',
      description: 'Watch live football, basketball, tennis and more sports free. HD streaming with multiple sources. No registration needed.',
      keywords: 'live sports streaming, live football, live soccer, watch sports online, free live sports, stream football live, totalsportek live, streameast live, crackstreams live, hesgoal live',
      priority: 0.9,
      changefreq: 'hourly' as const
    },
    channels: {
      title: 'Live TV Sports Channels Free - 70+ Channels | DamiTV',
      description: 'Watch 70+ free sports TV channels online. International channels for football, basketball, tennis and more. HD streaming, no registration.',
      keywords: 'live tv channels, sports tv, football channels, basketball channels, free sports channels, tv guide, epg, sky sports, bt sport, bein sports',
      priority: 0.9,
      changefreq: 'daily' as const
    },
    schedule: {
      title: 'Sports Schedule Today - Match Times & Fixtures | DamiTV',
      description: 'Today\'s sports schedule with football, basketball, tennis fixtures. Check match times for Premier League, Champions League and more.',
      keywords: 'football schedule, sports schedule, match fixtures, premier league schedule, champions league schedule, nba schedule, live matches today',
      priority: 0.8,
      changefreq: 'daily' as const
    },
    daddylivehdAlternatives: {
      title: 'Top DaddyliveHD Alternatives 2025 | Best HD Sports Streaming',
      description: 'Discover the best DaddyliveHD alternatives for free HD sports streaming in 2025. Compare features, quality, and reliability of top daddylivehd replacement sites.',
      keywords: 'daddylivehd alternatives, daddylivehd, daddylive, best sports streaming sites, free sports streams, HD sports streaming',
      priority: 0.8,
      changefreq: 'weekly' as const
    },
    batmanstreamAlternatives: {
      title: 'Top Batmanstream Alternatives 2025 | Safe Free HD Streaming',
      description: 'Discover the safest Batmanstream alternatives for free HD sports streaming in 2025. Expert-reviewed batman stream live replacements with security ratings.',
      keywords: 'batmanstream alternatives, batmanstreams, batman stream live, vipleague alternative, safe sports streaming, HD sports streams',
      priority: 0.8,
      changefreq: 'weekly' as const
    },
    hesgoalAlternatives: {
      title: 'Best Hesgoal Alternatives 2025 | Legal & Safe Sports Streaming',
      description: 'Discover the best legal Hesgoal alternatives for free live sports streaming in 2025. Expert review of hesgoal live stream replacements with country availability.',
      keywords: 'hesgoal alternatives, hesgoal, hesgoal live stream, best free sports streams 2025, safe streaming sites, legal sports streaming',
      priority: 0.8,
      changefreq: 'weekly' as const
    },
    about: {
      title: 'About DamiTV - Free Live Sports Streaming Platform',
      description: 'Learn about DamiTV, your premier destination for free live sports streaming. Watch football, basketball, tennis, and more in HD quality.',
      keywords: 'about damitv, sports streaming platform, free sports, live football streaming',
      priority: 0.5,
      changefreq: 'monthly' as const
    },
    contact: {
      title: 'Contact DamiTV - Get in Touch With Us',
      description: 'Contact DamiTV for support, feedback, or partnership inquiries. We\'re here to help with any questions about our free sports streaming service.',
      keywords: 'contact damitv, support, feedback, help',
      priority: 0.4,
      changefreq: 'monthly' as const
    },
    privacy: {
      title: 'Privacy Policy - DamiTV Sports Streaming',
      description: 'Read DamiTV\'s privacy policy to understand how we protect your data and respect your privacy while using our free sports streaming platform.',
      keywords: 'privacy policy, data protection, user privacy',
      priority: 0.3,
      changefreq: 'yearly' as const
    },
    terms: {
      title: 'Terms of Service - DamiTV Sports Streaming',
      description: 'Read DamiTV\'s terms of service to understand the rules and guidelines for using our free sports streaming platform.',
      keywords: 'terms of service, user agreement, terms and conditions',
      priority: 0.3,
      changefreq: 'yearly' as const
    },
    dmca: {
      title: 'DMCA Notice - DamiTV Copyright Policy',
      description: 'Information about DamiTV\'s DMCA policy and how to submit copyright infringement notices.',
      keywords: 'dmca, copyright, takedown notice',
      priority: 0.3,
      changefreq: 'yearly' as const
    },
    install: {
      title: 'Install DamiTV App - Watch Sports on Mobile',
      description: 'Install the DamiTV progressive web app to watch free sports streaming on your mobile device. Works on iOS and Android.',
      keywords: 'install app, mobile app, pwa, damitv app',
      priority: 0.6,
      changefreq: 'monthly' as const
    }
  }
};

// Generate FAQ schema
export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
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
}

// Internal linking structure for SEO
export const INTERNAL_LINKS = {
  homepage: [
    { text: 'Live Matches', url: '/live', description: 'Watch live sports now' },
    { text: 'TV Channels', url: '/channels', description: '70+ sports channels' },
    { text: 'Sports Schedule', url: '/schedule', description: 'Upcoming matches' },
  ],
  alternatives: [
    { text: 'Best Sports Streaming Sites', url: '/', description: 'Compare alternatives' },
    { text: 'Live Sports', url: '/live', description: 'Watch now' },
    { text: 'Channels Guide', url: '/channels', description: 'Browse channels' },
  ],
  footer: [
    { text: 'About Us', url: '/about' },
    { text: 'Contact', url: '/contact' },
    { text: 'Privacy Policy', url: '/privacy' },
    { text: 'Terms of Service', url: '/terms' },
    { text: 'DMCA', url: '/dmca' },
  ]
};
