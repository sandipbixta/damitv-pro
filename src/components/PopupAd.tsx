
import React, { useEffect, useRef, useState, MouseEvent } from "react";
import instantAccessImage from "@/assets/instant-access-offer.jpeg";


const SMARTLINK_URL = "https://foreseehawancestor.com/gmhn9rc6?key=42fea283e460c45715bc712ec6f5d7e7";
const SESSION_KEY = "specialOfferClosed";
const POPUP_DELAY_MS = 5000; // 5 second delay before showing popup

const PopupAd: React.FC = () => {
  const [open, setOpen] = useState<boolean>(false);
  const [hasInteracted, setHasInteracted] = useState<boolean>(false);
  const popupRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize popup with delay after user interaction
  useEffect(() => {
    // Check if already closed in this session
    if (typeof window !== "undefined" && sessionStorage.getItem(SESSION_KEY)) {
      return;
    }

    // Wait for user interaction before starting timer (required for popup compliance)
    const handleFirstInteraction = () => {
      if (hasInteracted) return;
      setHasInteracted(true);
      
      // Start timer after first interaction
      timerRef.current = setTimeout(() => {
        setOpen(true);
        console.log("[PopupAd] Special offer popup shown after delay");
      }, POPUP_DELAY_MS);
    };

    // Listen for any user interaction
    const events = ['click', 'scroll', 'touchstart', 'keydown'];
    events.forEach(event => {
      document.addEventListener(event, handleFirstInteraction, { once: true, passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleFirstInteraction);
      });
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [hasInteracted]);

  // Track ad impression when popup opens
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Handler to close popup and mark in sessionStorage
  const handleClose = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(false);
    sessionStorage.setItem(SESSION_KEY, "true");
    console.log("[PopupAd] Special offer popup closed");
  };

  // Handler for image click - use direct navigation for better compatibility
  const handleImageClick = (e: MouseEvent<HTMLAnchorElement>) => {
    console.log("[PopupAd] Smartlink clicked - direct navigation");
    // Let the anchor tag handle navigation naturally
  };

  // Fallback: allow overlay click to close
  const handleOverlayClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setOpen(false);
      sessionStorage.setItem(SESSION_KEY, "true");
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] bg-black/60 flex items-center justify-center"
      onClick={handleOverlayClick}
      aria-label="Special Offer Overlay"
    >
      <div
        ref={popupRef}
        className="relative rounded-xl shadow-2xl bg-white dark:bg-neutral-900 border border-gray-300 dark:border-gray-700 max-w-md w-full mx-2 animate-scale-in"
        aria-label="Special Offer"
      >
        <button
          aria-label="Close Special Offer"
          onClick={handleClose}
          className="absolute -right-3 -top-3 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-gray-700 rounded-full text-xl w-8 h-8 flex items-center justify-center shadow hover:bg-red-100 hover:text-red-500 transition z-10"
          data-close-btn="true"
          tabIndex={0}
          type="button"
          style={{ cursor: "pointer" }}
        >
          ×
        </button>
        {/* Special Offer Image - Direct anchor link for better ad blocker bypass */}
        <a
          href={SMARTLINK_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleImageClick}
          className="block w-full overflow-hidden rounded-xl"
        >
          <img
            src={instantAccessImage}
            alt="Instant High-Speed Access - Unlock Exclusive Sports Streams"
            width={446}
            height={446}
            className="w-full h-auto cursor-pointer hover:scale-105 transition-transform duration-300"
          />
        </a>
      </div>
    </div>
  );
};

export default PopupAd;
