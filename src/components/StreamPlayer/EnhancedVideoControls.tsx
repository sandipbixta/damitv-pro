import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, Volume2, VolumeX, Maximize, Minimize, 
  Settings, RotateCcw, FastForward, Rewind, Monitor,
  Loader2, ChevronUp
} from 'lucide-react';
import { Slider } from '../ui/slider';
import { cn } from '@/lib/utils';

interface EnhancedVideoControlsProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  isPlaying: boolean;
  isBuffering: boolean;
  duration: number;
  currentTime: number;
  volume: number;
  isMuted: boolean;
  isFullscreen: boolean;
  isTheaterMode?: boolean;
  currentQuality: string;
  availableQualities: Array<{ level: number; name: string; bitrate?: number }>;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onMuteToggle: () => void;
  onFullscreenToggle: () => void;
  onTheaterModeToggle?: () => void;
  onQualityChange: (level: number) => void;
  onRetry?: () => void;
}

const EnhancedVideoControls: React.FC<EnhancedVideoControlsProps> = ({
  videoRef,
  isPlaying,
  isBuffering,
  duration,
  currentTime,
  volume,
  isMuted,
  isFullscreen,
  isTheaterMode,
  currentQuality,
  availableQualities,
  onPlay,
  onPause,
  onSeek,
  onVolumeChange,
  onMuteToggle,
  onFullscreenToggle,
  onTheaterModeToggle,
  onQualityChange,
  onRetry
}) => {
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showVolume, setShowVolume] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekPreview, setSeekPreview] = useState(0);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const controlsRef = useRef<HTMLDivElement>(null);

  // Format time helper
  const formatTime = (seconds: number): string => {
    if (!isFinite(seconds) || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Auto-hide controls
  useEffect(() => {
    const resetHideTimer = () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
      setShowControls(true);
      hideTimeoutRef.current = setTimeout(() => {
        if (isPlaying && !showSettings && !showVolume) {
          setShowControls(false);
        }
      }, 3000);
    };

    const handleMouseMove = () => resetHideTimer();
    const handleMouseLeave = () => {
      if (isPlaying && !showSettings) {
        setShowControls(false);
      }
    };

    const container = controlsRef.current?.parentElement;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('mouseleave', handleMouseLeave);
      }
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [isPlaying, showSettings, showVolume]);

  // Skip forward/backward
  const handleSkip = (seconds: number) => {
    const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
    onSeek(newTime);
  };

  // Progress calculation
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const buffered = videoRef.current?.buffered;
  const bufferedEnd = buffered && buffered.length > 0 ? buffered.end(buffered.length - 1) : 0;
  const bufferedProgress = duration > 0 ? (bufferedEnd / duration) * 100 : 0;

  return (
    <div
      ref={controlsRef}
      className={cn(
        "absolute inset-0 flex flex-col justify-end transition-opacity duration-300",
        showControls ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

      {/* Center play/pause button */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {isBuffering ? (
          <div className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        ) : !isPlaying && (
          <button
            onClick={isPlaying ? onPause : onPlay}
            className="w-20 h-20 rounded-full bg-primary/90 hover:bg-primary flex items-center justify-center transition-all hover:scale-110 pointer-events-auto"
          >
            <Play className="w-10 h-10 text-white ml-1" fill="white" />
          </button>
        )}
      </div>

      {/* Bottom controls */}
      <div className="relative z-10 p-4 space-y-3">
        {/* Progress bar */}
        <div 
          className="relative h-1.5 bg-white/20 rounded-full cursor-pointer group"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            onSeek(percent * duration);
          }}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            setSeekPreview(percent * duration);
            setIsSeeking(true);
          }}
          onMouseLeave={() => setIsSeeking(false)}
        >
          {/* Buffered progress */}
          <div 
            className="absolute h-full bg-white/30 rounded-full"
            style={{ width: `${bufferedProgress}%` }}
          />
          {/* Played progress */}
          <div 
            className="absolute h-full bg-primary rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
          {/* Seek preview */}
          {isSeeking && (
            <div 
              className="absolute -top-8 bg-black/80 text-white text-xs px-2 py-1 rounded transform -translate-x-1/2"
              style={{ left: `${(seekPreview / duration) * 100}%` }}
            >
              {formatTime(seekPreview)}
            </div>
          )}
          {/* Progress handle */}
          <div 
            className="absolute h-4 w-4 bg-primary rounded-full -top-1.5 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
            style={{ left: `${progress}%` }}
          />
        </div>

        {/* Controls row */}
        <div className="flex items-center justify-between">
          {/* Left controls */}
          <div className="flex items-center gap-2">
            {/* Play/Pause */}
            <button
              onClick={isPlaying ? onPause : onPlay}
              className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 text-white" fill="white" />
              ) : (
                <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
              )}
            </button>

            {/* Skip backward */}
            <button
              onClick={() => handleSkip(-10)}
              className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
            >
              <Rewind className="w-4 h-4 text-white" />
            </button>

            {/* Skip forward */}
            <button
              onClick={() => handleSkip(10)}
              className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
            >
              <FastForward className="w-4 h-4 text-white" />
            </button>

            {/* Volume */}
            <div 
              className="relative flex items-center"
              onMouseEnter={() => setShowVolume(true)}
              onMouseLeave={() => setShowVolume(false)}
            >
              <button
                onClick={onMuteToggle}
                className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-white" />
                ) : (
                  <Volume2 className="w-4 h-4 text-white" />
                )}
              </button>
              
              <div className={cn(
                "overflow-hidden transition-all duration-200",
                showVolume ? "w-24 opacity-100 ml-1" : "w-0 opacity-0"
              )}>
                <Slider
                  value={[isMuted ? 0 : volume * 100]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={(value) => onVolumeChange(value[0] / 100)}
                  className="w-full"
                />
              </div>
            </div>

            {/* Time display */}
            <div className="text-white text-sm font-mono ml-2">
              <span>{formatTime(currentTime)}</span>
              <span className="text-white/50 mx-1">/</span>
              <span className="text-white/70">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-1">
            {/* Quality selector */}
            {availableQualities.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="h-8 px-3 rounded-md hover:bg-white/10 flex items-center gap-1.5 transition-colors"
                >
                  <Settings className="w-4 h-4 text-white" />
                  <span className="text-white text-sm font-medium">{currentQuality}</span>
                </button>

                {showSettings && (
                  <div className="absolute bottom-full right-0 mb-2 bg-black/95 border border-white/10 rounded-lg p-2 min-w-[150px] backdrop-blur-sm">
                    <div className="text-xs text-white/50 uppercase tracking-wider px-2 py-1 mb-1">Quality</div>
                    {availableQualities.map((q) => (
                      <button
                        key={q.level}
                        onClick={() => {
                          onQualityChange(q.level);
                          setShowSettings(false);
                        }}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between",
                          currentQuality === q.name 
                            ? "bg-primary text-white" 
                            : "text-white/80 hover:bg-white/10"
                        )}
                      >
                        <span>{q.name}</span>
                        {q.bitrate && (
                          <span className="text-xs text-white/50">{Math.round(q.bitrate / 1000)}k</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Retry button */}
            {onRetry && (
              <button
                onClick={onRetry}
                className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
                title="Retry stream"
              >
                <RotateCcw className="w-4 h-4 text-white" />
              </button>
            )}

            {/* Theater mode */}
            {onTheaterModeToggle && (
              <button
                onClick={onTheaterModeToggle}
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center transition-colors",
                  isTheaterMode ? "bg-primary/50 hover:bg-primary/70" : "hover:bg-white/10"
                )}
                title="Theater mode"
              >
                <Monitor className="w-4 h-4 text-white" />
              </button>
            )}

            {/* Fullscreen */}
            <button
              onClick={onFullscreenToggle}
              className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
              title="Fullscreen"
            >
              {isFullscreen ? (
                <Minimize className="w-4 h-4 text-white" />
              ) : (
                <Maximize className="w-4 h-4 text-white" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedVideoControls;
