import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Clock } from 'lucide-react';

interface VideoPlayerSelectorProps {
  src: string;
  onLoad?: () => void;
  onError?: () => void;
  title?: string;
  isManualChannel?: boolean;
  isTvChannel?: boolean;
  videoRef?: React.RefObject<HTMLVideoElement>;
  matchStartTime?: number | Date | null;
}

const VideoPlayerSelector: React.FC<VideoPlayerSelectorProps> = ({
  src,
  onLoad,
  onError,
  title = "Live Stream",
  videoRef: externalVideoRef,
  matchStartTime
}) => {
  const internalVideoRef = useRef<HTMLVideoElement>(null);
  const videoRef = externalVideoRef || internalVideoRef;
  const hlsRef = useRef<Hls | null>(null);
  const [countdown, setCountdown] = useState<string>('');
  
  // Check if it's a direct HLS stream
  const isHlsStream = src.includes('.m3u8');
  
  // Calculate countdown for upcoming matches
  useEffect(() => {
    if (!matchStartTime) {
      setCountdown('');
      return;
    }

    const matchDate = typeof matchStartTime === 'number' ? matchStartTime : new Date(matchStartTime).getTime();

    if (matchDate <= Date.now()) {
      setCountdown('');
      return;
    }

    const updateCountdown = () => {
      const now = Date.now();
      const timeUntilMatch = matchDate - now;

      if (timeUntilMatch <= 0) {
        setCountdown('');
        return;
      }

      const days = Math.floor(timeUntilMatch / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeUntilMatch % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeUntilMatch % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeUntilMatch % (1000 * 60)) / 1000);

      if (days > 0) {
        setCountdown(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setCountdown(`${hours}h ${minutes}m ${seconds}s`);
      } else if (minutes > 0) {
        setCountdown(`${minutes}m ${seconds}s`);
      } else {
        setCountdown(`${seconds}s`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [matchStartTime]);
  
  useEffect(() => {
    if (!isHlsStream || !videoRef.current) return;

    const video = videoRef.current;
    console.log('🎬 Initializing HLS player for:', src);
    
    // Clear any existing source
    video.src = '';
    video.load();

    // Small delay to ensure video element is ready
    const timer = setTimeout(() => {
      if (Hls.isSupported()) {
        console.log('✅ HLS.js is supported, loading stream...');
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90,
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
          debug: true,
          xhrSetup: (xhr: any) => {
            xhr.withCredentials = false;
          }
        });
        
        hls.loadSource(src);
        hls.attachMedia(video);
        
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          console.log('✅ HLS manifest parsed, starting playback...');
          video.play().then(() => {
            console.log('✅ Video playing');
            onLoad?.();
          }).catch(err => {
            console.error('❌ Error playing video:', err);
            onError?.();
          });
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          console.error('❌ HLS error:', data);
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.log('🔄 Network error, trying to recover...');
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.log('🔄 Media error, trying to recover...');
                hls.recoverMediaError();
                break;
              default:
                console.error('💀 Fatal error, cannot recover');
                hls.destroy();
                onError?.();
                break;
            }
          }
        });

        hlsRef.current = hls;
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS support (Safari)
        console.log('✅ Using native HLS support (Safari)');
        video.src = src;
        video.load();
        video.play().then(() => {
          console.log('✅ Video playing (native HLS)');
          onLoad?.();
        }).catch(err => {
          console.error('❌ Error playing video:', err);
          onError?.();
        });
      } else {
        console.error('❌ HLS is not supported in this browser');
        onError?.();
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (hlsRef.current) {
        console.log('🧹 Cleaning up HLS instance');
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src, isHlsStream, onLoad, onError, videoRef]);

  // For HLS streams, render video element
  if (isHlsStream) {
    return (
      <div className="relative w-full h-full">
        {/* Countdown Overlay */}
        {countdown && matchStartTime && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
            {/* Background decoration */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-10 left-10 w-32 h-32 bg-primary rounded-full blur-3xl" />
              <div className="absolute bottom-10 right-10 w-32 h-32 bg-purple-500 rounded-full blur-3xl" />
            </div>
            
            <div className="text-center text-white p-6 z-10">
              <Clock className="w-16 h-16 mx-auto mb-4 text-primary animate-pulse" />
              <h3 className="text-xl font-bold mb-2">Match Starting Soon</h3>
              <p className="text-sm text-gray-400 mb-4">Stream will be available when the match begins</p>
              
              {/* Countdown Display */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 inline-block">
                <div className="text-4xl font-black text-white mb-1 font-mono tracking-wider">
                  {countdown}
                </div>
                <div className="text-xs text-gray-400 uppercase tracking-widest">Until Kickoff</div>
              </div>
              
              {title && (
                <p className="text-base text-white/80 mt-3 font-semibold">
                  {title}
                </p>
              )}
            </div>
          </div>
        )}
        
        <video
          ref={videoRef}
          className="w-full h-full"
          controls
          playsInline
          autoPlay
          muted
          preload="auto"
          controlsList="nodownload"
          style={{ 
            border: 'none',
            background: 'black',
            objectFit: 'contain',
            width: '100%',
            height: '100%'
          }}
        />
      </div>
    );
  }

  // For other streams, use iframe with countdown overlay
  return (
    <div className="relative w-full h-full">
      {/* Countdown Overlay */}
      {countdown && matchStartTime && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
          {/* Background decoration */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-32 h-32 bg-primary rounded-full blur-3xl" />
            <div className="absolute bottom-10 right-10 w-32 h-32 bg-purple-500 rounded-full blur-3xl" />
          </div>
          
          <div className="text-center text-white p-6 z-10">
            <Clock className="w-16 h-16 mx-auto mb-4 text-primary animate-pulse" />
            <h3 className="text-xl font-bold mb-2">Match Starting Soon</h3>
            <p className="text-sm text-gray-400 mb-4">Stream will be available when the match begins</p>
            
            {/* Countdown Display */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 inline-block">
              <div className="text-4xl font-black text-white mb-1 font-mono tracking-wider">
                {countdown}
              </div>
              <div className="text-xs text-gray-400 uppercase tracking-widest">Until Kickoff</div>
            </div>
            
            {title && (
              <p className="text-base text-white/80 mt-3 font-semibold">
                {title}
              </p>
            )}
          </div>
        </div>
      )}
      
      <iframe
        src={src}
        width="100%"
        height="100%"
        allowFullScreen
        title={title}
        style={{ 
          border: 'none',
          background: 'black',
          width: '100%',
          height: '100%'
        }}
        onLoad={onLoad}
        onError={onError}
      />
    </div>
  );
};

export default VideoPlayerSelector;