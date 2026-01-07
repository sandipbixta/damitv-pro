import React from 'react';
import { AlertTriangle, RefreshCcw, Monitor, Info } from 'lucide-react';
import { Button } from '../ui/button';
import { AspectRatio } from '../ui/aspect-ratio';
import PlayerContainer from './PlayerContainer';

interface ErrorStateProps {
  hasError: boolean;
  isTimeout: boolean;
  onRetry: () => void;
  onOpenInNewTab: () => void;
  onGoBack: (e: React.MouseEvent | React.TouchEvent) => void;
  debugInfo?: string;
}

const ErrorState: React.FC<ErrorStateProps> = ({
  hasError,
  isTimeout,
  onRetry,
  onOpenInNewTab,
  onGoBack,
  debugInfo
}) => {
  if (!hasError) return null;

  return (
    <PlayerContainer>
      <AspectRatio ratio={16 / 9}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white text-center max-w-md mx-auto p-4">
            <AlertTriangle className="h-10 w-10 sm:h-12 sm:w-12 text-yellow-400 mx-auto mb-3" />
            
            <p className="text-lg sm:text-xl mb-2">
              Stream Loading Issue
            </p>
            
            <p className="text-xs sm:text-sm text-gray-400 mb-4">
              {isTimeout 
                ? "The stream is taking longer than expected to load."
                : "Stream source may be temporarily unavailable."
              }
            </p>

            <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-4 w-4 text-blue-400" />
                <span className="text-sm font-medium text-blue-300">Try Again</span>
              </div>
              <p className="text-xs text-blue-200">
                Click retry to attempt loading the stream again.
              </p>
            </div>
            
            <div className="flex flex-col gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onRetry}
                className="border-primary bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <RefreshCcw className="h-4 w-4 mr-2" /> 
                Retry
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onOpenInNewTab}
                className="border-border bg-transparent hover:bg-muted text-muted-foreground"
              >
                <Monitor className="h-4 w-4 mr-2" /> 
                Open in New Tab
              </Button>
            </div>
          </div>
        </div>
      </AspectRatio>
    </PlayerContainer>
  );
};

export default ErrorState;
