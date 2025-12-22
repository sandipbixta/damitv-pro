import { analytics } from './analytics';

interface SEOMetrics {
  pageTitle: string;
  metaDescription: string;
  h1Count: number;
  imageAltCount: number;
  internalLinks: number;
  externalLinks: number;
  loadTime: number;
  wordCount: number;
}

export class SEOOptimizer {
  private static instance: SEOOptimizer;
  
  static getInstance(): SEOOptimizer {
    if (!SEOOptimizer.instance) {
      SEOOptimizer.instance = new SEOOptimizer();
    }
    return SEOOptimizer.instance;
  }

  // Analyze current page SEO metrics
  analyzePage(): SEOMetrics {
    const title = document.title;
    const metaDescription = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
    const h1Elements = document.querySelectorAll('h1');
    const images = document.querySelectorAll('img');
    const internalLinks = document.querySelectorAll('a[href^="/"], a[href^="' + window.location.origin + '"]');
    const externalLinks = document.querySelectorAll('a[href^="http"]:not([href^="' + window.location.origin + '"])');
    
    const imagesWithAlt = Array.from(images).filter(img => img.getAttribute('alt'));
    const wordCount = document.body.innerText.split(/\s+/).length;

    const metrics: SEOMetrics = {
      pageTitle: title,
      metaDescription,
      h1Count: h1Elements.length,
      imageAltCount: imagesWithAlt.length,
      internalLinks: internalLinks.length,
      externalLinks: externalLinks.length,
      loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
      wordCount
    };

    // Track SEO metrics
    analytics.track({
      action: 'seo_analysis',
      category: 'SEO Performance',
      label: window.location.pathname,
      custom_parameters: {
        title_length: title.length,
        meta_description_length: metaDescription.length,
        h1_count: metrics.h1Count,
        word_count: wordCount,
        has_proper_alt_tags: imagesWithAlt.length === images.length,
        load_time_ms: metrics.loadTime
      }
    });

    return metrics;
  }

  // Generate SEO recommendations
  getRecommendations(metrics: SEOMetrics): string[] {
    const recommendations: string[] = [];

    // Title optimization
    if (metrics.pageTitle.length < 30) {
      recommendations.push('Title tag is too short. Aim for 50-60 characters for better SEO.');
    } else if (metrics.pageTitle.length > 60) {
      recommendations.push('Title tag is too long. Keep it under 60 characters to avoid truncation.');
    }

    // Meta description
    if (metrics.metaDescription.length < 120) {
      recommendations.push('Meta description is too short. Aim for 150-160 characters.');
    } else if (metrics.metaDescription.length > 160) {
      recommendations.push('Meta description is too long. Keep it under 160 characters.');
    }

    // H1 tags
    if (metrics.h1Count === 0) {
      recommendations.push('Missing H1 tag. Add one H1 tag per page for better SEO.');
    } else if (metrics.h1Count > 1) {
      recommendations.push('Multiple H1 tags found. Use only one H1 tag per page.');
    }

    // Image optimization
    const totalImages = document.querySelectorAll('img').length;
    if (totalImages > 0 && metrics.imageAltCount < totalImages) {
      recommendations.push(`${totalImages - metrics.imageAltCount} images missing alt attributes. Add descriptive alt text to all images.`);
    }

    // Content length
    if (metrics.wordCount < 300) {
      recommendations.push('Content is too short. Aim for at least 300 words for better SEO ranking.');
    }

    // Internal linking
    if (metrics.internalLinks < 3) {
      recommendations.push('Add more internal links to improve site structure and SEO.');
    }

    // Page speed
    if (metrics.loadTime > 3000) {
      recommendations.push('Page load time is too slow. Optimize images and scripts for better performance.');
    }

    return recommendations;
  }

  // Track keyword rankings (simulate with search console data)
  trackKeywordPerformance(keywords: string[]) {
    keywords.forEach(keyword => {
      analytics.track({
        action: 'keyword_tracking',
        category: 'SEO Keywords',
        label: keyword,
        custom_parameters: {
          page_url: window.location.href,
          keyword_length: keyword.length,
          target_keyword: keyword
        }
      });
    });
  }

  // Generate structured data for better SERP features
  generateStructuredData(type: 'article' | 'match' | 'channel' | 'faq', data: any) {
    const structuredData: any = {
      "@context": "https://schema.org"
    };

    switch (type) {
      case 'article':
        structuredData["@type"] = "Article";
        structuredData.headline = data.title;
        structuredData.description = data.description;
        structuredData.datePublished = data.publishedDate;
        structuredData.author = {
          "@type": "Organization",
          name: "DamiTV"
        };
        break;
        
      case 'match':
        structuredData["@type"] = "SportsEvent";
        structuredData.name = `${data.homeTeam} vs ${data.awayTeam}`;
        structuredData.startDate = data.startTime;
        structuredData.competitor = [
          { "@type": "SportsTeam", name: data.homeTeam },
          { "@type": "SportsTeam", name: data.awayTeam }
        ];
        break;
        
      case 'channel':
        structuredData["@type"] = "BroadcastService";
        structuredData.name = data.channelName;
        structuredData.broadcastDisplayName = data.displayName;
        break;
        
      case 'faq':
        structuredData["@type"] = "FAQPage";
        structuredData.mainEntity = data.questions.map((q: any) => ({
          "@type": "Question",
          name: q.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: q.answer
          }
        }));
        break;
    }

    // Add structured data to page
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);

    // Track structured data implementation
    analytics.track({
      action: 'structured_data_added',
      category: 'SEO Enhancement',
      label: type,
      custom_parameters: {
        page_url: window.location.href,
        schema_type: type
      }
    });
  }

  // Optimize Core Web Vitals
  optimizeWebVitals() {
    // Lazy load images below the fold
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          img.src = img.dataset.src!;
          img.removeAttribute('data-src');
          imageObserver.unobserve(img);
        }
      });
    });

    images.forEach(img => imageObserver.observe(img));

    // Preload critical resources
    const criticalResources = [
      { href: '/api/live-matches', as: 'fetch' },
      { href: '/api/channels', as: 'fetch' }
    ];

    criticalResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource.href;
      link.as = resource.as;
      document.head.appendChild(link);
    });
  }
}

export const seoOptimizer = SEOOptimizer.getInstance();