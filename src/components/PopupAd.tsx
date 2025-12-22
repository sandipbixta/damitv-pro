
import React, { useEffect, useRef, useState, MouseEvent } from "react";
import instantAccessImage from "@/assets/instant-access-offer.jpeg";
import { adTracking } from "@/utils/adTracking";

const SMARTLINK_URL = "https://foreseehawancesator.com/gmhn9rc6?key=42fea283e460c45715bc712ec6f5d7e7";
const SESSION_KEY = "specialOfferClosed";

const PopupAd: React.FC = () => {
  const [open, setOpen] = useState<boolean>(() => {
    // Only show popup if it hasn't been closed in this session
    if (typeof window !== "undefined") {
      return !sessionStorage.getItem(SESSION_KEY);
    }
    return true;
  });
  const popupRef = useRef<HTMLDivElement | null>(null);

  // Track ad impression when popup opens
  useEffect(() => {
    if (open) {
      adTracking.trackPopupImpression();
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Handler to close popup and mark in sessionStorage
  const handleClose = () => {
    adTracking.trackPopupClose();
    setOpen(false);
    sessionStorage.setItem(SESSION_KEY, "true");
    console.log("[PopupAd] Special offer popup closed");
  };

  // Handler to open the smartlink URL (only when clicking image)
  const handleImageClick = () => {
    adTracking.trackPopupClick();
    window.open(SMARTLINK_URL, "_blank", "noopener noreferrer");
    console.log("[PopupAd] Smartlink opened");
  };

  // Fallback: allow overlay click to close if adblocker breaks close button
  const handleOverlayClick = (e: MouseEvent<HTMLDivElement>) => {
    // Only allow close if clicked directly on overlay (not child nodes)
    if (e.target === e.currentTarget) {
      handleClose();
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
        {/* Special Offer Image - Click to open smartlink */}
        <div className="w-full overflow-hidden rounded-xl">
          <img
            src={instantAccessImage}
            alt="Instant High-Speed Access - Unlock Exclusive Sports Streams"
            width={446}
            height={446}
            className="w-full h-auto cursor-pointer hover:scale-105 transition-transform duration-300"
            onClick={handleImageClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleImageClick();
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default PopupAd;
