import React from 'react';
import { Loader, Video } from 'lucide-react';
import { AspectRatio } from '../ui/aspect-ratio';
import PlayerContainer from './PlayerContainer';

interface LoadingStateProps {
  isLoading: boolean;
  hasStream: boolean;
  onGoBack: (e: React.MouseEvent | React.TouchEvent) => void;
}

const LoadingState: React.FC<LoadingStateProps> = ({ isLoading, hasStream, onGoBack }) => {
  if (isLoading) {
    return (
      <PlayerContainer>
        <AspectRatio ratio={16 / 9}>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-white text-center">
              <Loader className="h-10 w-10 sm:h-12 sm:w-12 animate-spin mx-auto mb-3 sm:mb-4 text-primary" />
              <p className="text-lg sm:text-xl">Loading stream...</p>
              <p className="text-xs sm:text-sm text-gray-400 mt-1 sm:mt-2">This may take a moment</p>
            </div>
          </div>
        </AspectRatio>
      </PlayerContainer>
    );
  }

  if (!hasStream) {
    return (
      <PlayerContainer>
        <AspectRatio ratio={16 / 9}>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-white text-center">
              <Video className="h-10 w-10 sm:h-12 sm:w-12 text-gray-600 mx-auto mb-3" />
              <p className="text-lg sm:text-xl">No live stream available</p>
              <p className="text-xs sm:text-sm text-gray-400 mt-1 sm:mt-2">Check back closer to match time</p>
            </div>
          </div>
        </AspectRatio>
      </PlayerContainer>
    );
  }

  return null;
};

export default LoadingState;
