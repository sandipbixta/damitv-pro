import { useEffect, useRef } from 'react';

interface NativeBannerAdProps {
  className?: string;
}

/**
 * Adsterra Native Banner Ad
 * Blends with content for higher engagement
 * High CTR format
 */
const NativeBannerAd: React.FC<NativeBannerAdProps> = ({ className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current || scriptLoadedRef.current) return;

    const container = containerRef.current;

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      const script = document.createElement('script');
      script.async = true;
      script.setAttribute('data-cfasync', 'false');
      script.src = 'https://foreseehawancestor.com/a873bc1d3d203f2f13c32a99592441b8/invoke.js';

      container.appendChild(script);
      scriptLoadedRef.current = true;

      console.log('Native Banner: Loaded');
    }, 200);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className={`w-full flex justify-center py-4 ${className}`}>
      <div
        ref={containerRef}
        id="container-a873bc1d3d203f2f13c32a99592441b8"
        className="w-full max-w-4xl"
      />
    </div>
  );
};

export default NativeBannerAd;
