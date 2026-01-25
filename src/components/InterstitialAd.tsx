import React, { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';

interface InterstitialAdProps {
  onClose: () => void;
  duration?: number; // seconds
}

const InterstitialAd: React.FC<InterstitialAdProps> = ({
  onClose,
  duration = 5
}) => {
  const [countdown, setCountdown] = useState(duration);
  const [canSkip, setCanSkip] = useState(false);
  const [adLoaded, setAdLoaded] = useState(false);

  useEffect(() => {
    // Countdown timer
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanSkip(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Load ad script
    const loadAd = () => {
      const container = document.getElementById('interstitial-ad-container');
      if (!container) return;

      // Set atOptions
      (window as any).atOptions = {
        'key': '7c589340b2a1155dcea92f44cc468438',
        'format': 'iframe',
        'height': 250,
        'width': 300,
        'params': {}
      };

      // Create and load the ad script
      const script = document.createElement('script');
      script.src = 'https://foreseehawancestor.com/7c589340b2a1155dcea92f44cc468438/invoke.js';
      script.async = true;
      script.onload = () => setAdLoaded(true);
      container.appendChild(script);
    };

    loadAd();

    return () => {
      clearInterval(timer);
    };
  }, []);

  const handleSkip = useCallback(() => {
    if (canSkip) {
      onClose();
    }
  }, [canSkip, onClose]);

  // Auto-close when countdown reaches 0 and user clicks anywhere
  useEffect(() => {
    if (countdown === 0) {
      // Auto close after additional 2 seconds if user doesn't interact
      const autoClose = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(autoClose);
    }
  }, [countdown, onClose]);

  return (
    <div className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center">
      {/* Skip/Close button */}
      <div className="absolute top-4 right-4">
        {canSkip ? (
          <button
            onClick={handleSkip}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-full transition-all"
          >
            <span>Skip Ad</span>
            <X className="w-4 h-4" />
          </button>
        ) : (
          <div className="bg-white/20 text-white px-4 py-2 rounded-full">
            Skip in {countdown}s
          </div>
        )}
      </div>

      {/* Ad Container */}
      <div className="flex flex-col items-center gap-4">
        {/* Ad label */}
        <div className="text-white/60 text-sm uppercase tracking-wider">
          Advertisement
        </div>

        {/* Ad iframe container */}
        <div
          id="interstitial-ad-container"
          className="bg-white/5 rounded-lg overflow-hidden flex items-center justify-center"
          style={{ minWidth: 300, minHeight: 250 }}
        >
          {!adLoaded && (
            <div className="text-white/40 text-sm">Loading ad...</div>
          )}
        </div>

        {/* Progress bar */}
        <div className="w-[300px] h-1 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-1000 ease-linear"
            style={{ width: `${((duration - countdown) / duration) * 100}%` }}
          />
        </div>

        {/* Continue message */}
        {canSkip && (
          <button
            onClick={handleSkip}
            className="text-white/80 hover:text-white text-sm underline mt-2"
          >
            Click anywhere to continue
          </button>
        )}
      </div>

      {/* Click anywhere to close when skippable */}
      {canSkip && (
        <div
          className="absolute inset-0 -z-10"
          onClick={handleSkip}
        />
      )}
    </div>
  );
};

export default InterstitialAd;

// Hook to manage interstitial ad display
export const useInterstitialAd = () => {
  const [showAd, setShowAd] = useState(false);
  const [pendingCallback, setPendingCallback] = useState<(() => void) | null>(null);

  const SESSION_KEY = 'interstitialAdShown';
  const COOLDOWN_MINUTES = 30; // Show max once per 30 minutes

  const shouldShowAd = useCallback((): boolean => {
    try {
      const lastShown = localStorage.getItem(SESSION_KEY);
      if (!lastShown) return true;

      const lastTime = parseInt(lastShown, 10);
      const now = Date.now();
      const cooldownMs = COOLDOWN_MINUTES * 60 * 1000;

      return (now - lastTime) >= cooldownMs;
    } catch {
      return false;
    }
  }, []);

  const markAdShown = useCallback(() => {
    try {
      localStorage.setItem(SESSION_KEY, Date.now().toString());
    } catch {
      // Ignore
    }
  }, []);

  const triggerAd = useCallback((onComplete?: () => void) => {
    if (shouldShowAd()) {
      setShowAd(true);
      markAdShown();
      if (onComplete) {
        setPendingCallback(() => onComplete);
      }
    } else if (onComplete) {
      // Cooldown active, just run callback
      onComplete();
    }
  }, [shouldShowAd, markAdShown]);

  const closeAd = useCallback(() => {
    setShowAd(false);
    if (pendingCallback) {
      pendingCallback();
      setPendingCallback(null);
    }
  }, [pendingCallback]);

  return {
    showAd,
    triggerAd,
    closeAd,
    InterstitialComponent: showAd ? (
      <InterstitialAd onClose={closeAd} duration={5} />
    ) : null
  };
};
