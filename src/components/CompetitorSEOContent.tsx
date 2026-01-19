import React from 'react';
import { generateCompetitorContent } from '@/utils/competitorSEO';

interface CompetitorSEOContentProps {
  matchTitle?: string;
  showFAQ?: boolean;
  showCompetitorMentions?: boolean;
}

const CompetitorSEOContent: React.FC<CompetitorSEOContentProps> = ({
  matchTitle,
  showFAQ = true,
  showCompetitorMentions = true
}) => {
  const { faqData, competitorMentions } = generateCompetitorContent(matchTitle);

  return (
    <div className="hidden">
      {/* Hidden SEO content for search engines */}
      
      {showCompetitorMentions && (
        <section>
          <h2>Free Sports Streaming Alternative</h2>
          {competitorMentions.map((mention, index) => (
            <p key={index}>{mention}</p>
          ))}
          
          <p>
            DamiTV is the best free alternative to popular sports streaming sites. 
            Unlike other platforms that suffer from constant ads, pop-ups, and poor quality streams, 
            we provide a clean, fast, and reliable streaming experience.
          </p>
          
          <p>
            Whether you're looking for live football, basketball, tennis, or any other sport, 
            DamiTV delivers HD quality streams without the hassles found on traditional streaming platforms. 
            Our mobile-optimized interface works perfectly on all devices.
          </p>
        </section>
      )}

      {showFAQ && (
        <section>
          <h2>Frequently Asked Questions</h2>
          {faqData.map((faq, index) => (
            <div key={index}>
              <h3>{faq.question}</h3>
              <p>{faq.answer}</p>
            </div>
          ))}
        </section>
      )}

      {/* Additional competitor targeting content */}
      <section>
        <h2>Why Choose DamiTV Over Other Streaming Sites?</h2>
        <ul>
          <li>Higher quality HD streams with minimal buffering</li>
          <li>Cleaner interface without intrusive advertisements</li>
          <li>Better mobile experience and responsive design</li>
          <li>More reliable servers with superior uptime</li>
          <li>Safer browsing without malicious redirects</li>
          <li>Faster loading times and better performance</li>
          <li>No registration required - completely free access</li>
        </ul>
      </section>

      {/* Sports coverage content */}
      <section>
        <h2>Complete Sports Coverage</h2>
        <p>
          Watch live Premier League, Champions League, La Liga, Serie A, Bundesliga, 
          NBA, NFL, NHL, tennis, boxing, MMA, and more. All major sports and leagues 
          covered with multiple streaming sources for each event.
        </p>
        
        <p>
          Our platform covers international tournaments, domestic leagues, 
          and special sporting events from around the world. Never miss your 
          favorite team or player in action.
        </p>
      </section>
    </div>
  );
};

export default CompetitorSEOContent;