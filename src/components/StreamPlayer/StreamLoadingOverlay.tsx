
import React from 'react';
import { Loader } from 'lucide-react';

interface StreamLoadingOverlayProps {
  isVisible: boolean;
  retryCount: number;
  useProxyMethod: boolean;
}

const StreamLoadingOverlay: React.FC<StreamLoadingOverlayProps> = ({ 
  isVisible, 
  retryCount, 
  useProxyMethod 
}) => {
  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#151922]">
      <div className="text-white text-center">
        <Loader className="h-8 w-8 sm:h-10 sm:w-10 animate-spin mx-auto mb-2 sm:mb-3 text-[#ff5a36]" />
        <p className="text-sm sm:text-lg">Loading stream within DAMITV...</p>
        {retryCount > 0 && (
          <p className="text-xs text-gray-400 mt-1">
            Bypass attempt {retryCount} - Keeping you on DAMITV
          </p>
        )}
        {useProxyMethod && (
          <p className="text-xs text-yellow-400 mt-2">
            Using advanced bypass method...
          </p>
        )}
      </div>
    </div>
  );
};

export default StreamLoadingOverlay;
