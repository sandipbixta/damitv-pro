

import React from 'react';
import { Button } from '../ui/button';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useIsMobile } from '../../hooks/use-mobile';

interface PlayerControlsProps {
  onGoBack: (e: React.MouseEvent | React.TouchEvent) => void;
  onTogglePictureInPicture: () => void;
  onOpenInNewTab: () => void;
  isPictureInPicture: boolean;
}

const PlayerControls: React.FC<PlayerControlsProps> = ({
  onGoBack,
  onTogglePictureInPicture,
  onOpenInNewTab,
  isPictureInPicture
}) => {
  const isMobile = useIsMobile();

  return (
    <>
      {/* Back button */}
      <div className="absolute top-3 left-3 z-30">
        <Button
          variant="ghost"
          size="sm"
          className="bg-gradient-to-br from-primary/90 to-primary/70 hover:from-primary hover:to-primary/90 backdrop-blur-sm rounded-xl h-11 w-11 p-0 touch-manipulation transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
          onClick={onGoBack}
        >
          <ArrowLeft className="h-5 w-5 text-white drop-shadow" />
        </Button>
      </div>
      
      {/* Controls overlay - only external link button */}
      <div className={cn(
        "absolute top-3 right-3 sm:top-4 sm:right-4 transition-all duration-200 flex gap-2.5",
        isMobile ? "opacity-100" : "opacity-0 group-hover:opacity-100"
      )}>
        <button 
          onClick={onOpenInNewTab}
          className="bg-gradient-to-br from-background/90 to-background/70 backdrop-blur-md border border-border/50 hover:border-primary/50 text-white p-2 sm:p-2.5 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl touch-manipulation group/btn"
          title="Open stream in new tab"
          aria-label="Open stream in new tab"
        >
          <ExternalLink className="h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 duration-300" />
        </button>
      </div>
    </>
  );
};

export default PlayerControls;
