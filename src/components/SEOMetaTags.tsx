import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOMetaTagsProps {
  title: string;
  description: string;
  keywords?: string;
  canonicalUrl?: string;
  ogImage?: string;
  structuredData?: object;
  breadcrumbs?: Array<{name: string; url: string}>;
  matchInfo?: {
    homeTeam?: string;
    awayTeam?: string;
    league?: string;
    date?: Date;
    venue?: string;
  };
}

const SEOMetaTags: React.FC<SEOMetaTagsProps> = ({
  title,
  description,
  keywords,
  canonicalUrl,
  ogImage = 'https://i.imgur.com/m4nV9S8.png',
  structuredData,
  breadcrumbs,
  matchInfo
}) => {
  // Generate dynamic keywords based on match info
  const generateKeywords = () => {
    let baseKeywords = keywords || 'live sports streaming, watch sports online, free sports streams';
    
    if (matchInfo) {
      const { homeTeam, awayTeam, league } = matchInfo;
      const matchTitle = homeTeam && awayTeam ? `${homeTeam} vs ${awayTeam}` : '';
      
      const matchKeywords = [
        homeTeam && `${homeTeam} live stream`,
        awayTeam && `${awayTeam} online`,
        matchTitle && `${matchTitle}`,
        league && `${league} streaming`,
        'live football stream',
        'watch football online free'
      ].filter(Boolean).join(', ');
      
      baseKeywords = `${baseKeywords}, ${matchKeywords}`;
    }
    
    return baseKeywords;
  };

  // Generate structured data for matches
  const generateMatchStructuredData = () => {
    if (!matchInfo) return structuredData;

    const { homeTeam, awayTeam, league, date, venue } = matchInfo;
    
    if (homeTeam && awayTeam && date) {
      return {
        "@context": "https://schema.org",
        "@type": "SportsEvent",
        "name": `${homeTeam} vs ${awayTeam}`,
        "description": `Watch ${homeTeam} vs ${awayTeam} live stream online for free on DamiTV`,
        "startDate": date.toISOString(),
        "competitor": [
          { "@type": "SportsTeam", "name": homeTeam },
          { "@type": "SportsTeam", "name": awayTeam }
        ],
        "sport": league || "Football",
        "location": venue ? { "@type": "Place", "name": venue } : undefined,
        "organizer": {
          "@type": "Organization",
          "name": "DamiTV",
          "url": "https://damitv.pro"
        },
        "url": canonicalUrl || window.location.href,
        "image": ogImage,
        "eventStatus": "https://schema.org/EventScheduled",
        "eventAttendanceMode": "https://schema.org/OnlineEventAttendanceMode"
      };
    }

    return structuredData;
  };

  // Generate breadcrumb structured data
  const generateBreadcrumbData = () => {
    if (!breadcrumbs || breadcrumbs.length === 0) return null;

    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": breadcrumbs.map((crumb, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "name": crumb.name,
        "item": crumb.url
      }))
    };
  };

  const finalStructuredData = generateMatchStructuredData();
  const breadcrumbData = generateBreadcrumbData();

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={generateKeywords()} />
      
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="DamiTV" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl || window.location.href} />
      <meta property="og:image" content={ogImage} />
      
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      
      <meta name="robots" content="index, follow" />
      
      {finalStructuredData && (
        <script type="application/ld+json">
          {JSON.stringify(finalStructuredData)}
        </script>
      )}
      
      {breadcrumbData && (
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbData)}
        </script>
      )}
    </Helmet>
  );
};

export default SEOMetaTags;
