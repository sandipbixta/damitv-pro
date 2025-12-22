import React from "react";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

const TelegramFAB = () => {
  return (
    <a
      href="https://t.me/Sports_matches_bot"
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "fixed bottom-20 md:bottom-8 left-4 z-50",
        "flex items-center gap-2",
        "bg-[#0088cc] hover:bg-[#0077b5] text-white",
        "rounded-full shadow-lg hover:shadow-xl",
        "transition-all duration-300 hover:scale-105",
        "p-3 md:px-4 md:py-3"
      )}
      aria-label="Join our Telegram channel for live links"
    >
      <Send className="h-5 w-5" />
      <span className="hidden md:inline text-sm font-medium whitespace-nowrap">
        Get Live Links on Telegram
      </span>
    </a>
  );
};

export default TelegramFAB;
