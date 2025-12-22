import React from 'react';
import { ExternalLink, MessageCircle } from 'lucide-react';
import { Button } from './ui/button';

interface TelegramBannerProps {
  className?: string;
}

const TelegramBanner: React.FC<TelegramBannerProps> = ({ className = "" }) => {
  const handleTelegramClick = () => {
    window.open('https://t.me/damitv', '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Telegram Join Banner */}
      <Button
        onClick={handleTelegramClick}
        className="w-full bg-[#0088cc] hover:bg-[#006699] text-white py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-[1.02] shadow-lg"
        variant="default"
      >
        <div className="flex items-center justify-center gap-2 w-full">
          <MessageCircle className="h-5 w-5" />
          <span className="font-medium">Join DAMITV on Telegram for Updates</span>
          <ExternalLink className="h-4 w-4 opacity-80" />
        </div>
      </Button>
    </div>
  );
};

export default TelegramBanner;
