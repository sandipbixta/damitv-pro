import React, { useEffect, useRef } from 'react';

interface LeaderboardAdProps {
  className?: string;
}

/**
 * Leaderboard Ad (728x90)
 * Best for placement below video player on desktop
 * Responsive - hides on mobile where it doesn't fit well
 */
const LeaderboardAd: React.FC<LeaderboardAdProps> = ({ className = '' }) => {
  const adContainerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    if (!adContainerRef.current || scriptLoadedRef.current) return;

    const container = adContainerRef.current;
    const containerId = `leaderboard-ad-${Date.now()}`;
    container.id = containerId;

    // Staggered delay to avoid conflicts with other ads
    const timer = setTimeout(() => {
      (window as any).atOptions = {
        'key': '6f9d1f3d2ad1eb4e3efaf82e5571ea37',
        'format': 'iframe',
        'height': 90,
        'width': 728,
        'params': {}
      };

      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = 'https://foreseehawancestor.com/6f9d1f3d2ad1eb4e3efaf82e5571ea37/invoke.js';

      container.appendChild(script);
      scriptLoadedRef.current = true;
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className={`hidden md:flex justify-center py-3 ${className}`}>
      <div
        ref={adContainerRef}
        className="overflow-hidden flex justify-center items-center"
        style={{ maxWidth: '728px', width: '100%', minHeight: '90px' }}
      />
    </div>
  );
};

export default LeaderboardAd;
