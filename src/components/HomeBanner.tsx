import React, { useEffect, useRef, useState } from 'react';

/**
 * Leaderboard Ad Banner - Adsterra
 * Desktop: 728x90 (Leaderboard)
 * Mobile: 320x50 (Mobile Banner) - scaled to fit
 */
const HomeBanner: React.FC = () => {
  const desktopAdRef = useRef<HTMLDivElement>(null);
  const mobileAdRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileScale, setMobileScale] = useState(1);
  const scriptLoadedRef = useRef({ desktop: false, mobile: false });

  // Detect mobile and calculate scale on mount and resize
  useEffect(() => {
    const updateMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        // Scale to fit within viewport with padding
        const scale = Math.min(1, (window.innerWidth - 32) / 320);
        setMobileScale(scale);
      }
    };

    updateMobile();
    window.addEventListener('resize', updateMobile);
    return () => window.removeEventListener('resize', updateMobile);
  }, []);

  // Load desktop ad
  useEffect(() => {
    if (isMobile || scriptLoadedRef.current.desktop || !desktopAdRef.current) return;
    scriptLoadedRef.current.desktop = true;

    (window as any).atOptions = {
      'key': '6f9d1f3d2ad1eb4e3efaf82e5571ea37',
      'format': 'iframe',
      'height': 90,
      'width': 728,
      'params': {}
    };

    const desktopScript = document.createElement('script');
    desktopScript.src = 'https://foreseehawancestor.com/6f9d1f3d2ad1eb4e3efaf82e5571ea37/invoke.js';
    desktopScript.async = true;
    desktopAdRef.current.appendChild(desktopScript);
  }, [isMobile]);

  // Load mobile ad
  useEffect(() => {
    if (!isMobile || scriptLoadedRef.current.mobile || !mobileAdRef.current) return;
    scriptLoadedRef.current.mobile = true;

    (window as any).atOptions = {
      'key': '6f9d1f3d2ad1eb4e3efaf82e5571ea37',
      'format': 'iframe',
      'height': 50,
      'width': 320,
      'params': {}
    };

    const mobileScript = document.createElement('script');
    mobileScript.src = 'https://foreseehawancestor.com/6f9d1f3d2ad1eb4e3efaf82e5571ea37/invoke.js';
    mobileScript.async = true;
    mobileAdRef.current.appendChild(mobileScript);
  }, [isMobile]);

  return (
    <div className="my-6 flex justify-center overflow-hidden">
      {/* Desktop Leaderboard: 728x90 */}
      <div className="hidden md:flex justify-center">
        <div
          ref={desktopAdRef}
          className="relative overflow-hidden rounded-lg"
          style={{ width: 728, height: 90, minHeight: 90 }}
        />
      </div>

      {/* Mobile Banner: 320x50 - Adsterra - Scaled to fit */}
      <div className="flex md:hidden justify-center w-full overflow-hidden">
        <div
          className="overflow-hidden flex justify-center items-center"
          style={{
            maxWidth: '100%',
            width: `${320 * mobileScale}px`,
            height: `${50 * mobileScale}px`
          }}
        >
          <div
            ref={mobileAdRef}
            className="relative overflow-hidden rounded-lg"
            style={{
              width: 320,
              height: 50,
              minWidth: 320,
              minHeight: 50,
              transform: `scale(${mobileScale})`,
              transformOrigin: 'center center'
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default HomeBanner;
