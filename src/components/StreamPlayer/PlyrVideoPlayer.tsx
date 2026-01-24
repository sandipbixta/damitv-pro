import React, { useRef, useEffect, useState } from 'react';
import Plyr from 'plyr';
import Hls from 'hls.js';
import 'plyr/dist/plyr.css';
import { Stream, Match } from '../../types/sports';
import { ManualMatch } from '../../types/manualMatch';

interface PlyrVideoPlayerProps {
  stream: Stream | null;
  onError?: () => void;
  onReady?: () => void;
  match?: Match | ManualMatch | null;
}

const PlyrVideoPlayer: React.FC<PlyrVideoPlayerProps> = ({
  stream,
  onError,
  onReady,
  match
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<Plyr | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!videoRef.current || !stream?.embedUrl) return;

    const video = videoRef.current;
    const src = stream.embedUrl.startsWith('http://')
      ? stream.embedUrl.replace(/^http:\/\//i, 'https://')
      : stream.embedUrl;

    // Initialize Plyr with custom options
    const player = new Plyr(video, {
      controls: [
        'play-large',
        'play',
        'progress',
        'current-time',
        'duration',
        'mute',
        'volume',
        'settings',
        'pip',
        'airplay',
        'fullscreen'
      ],
      settings: ['quality', 'speed'],
      quality: {
        default: 720,
        options: [1080, 720, 480, 360],
        forced: false,
        onChange: (quality: number) => {
          if (hlsRef.current) {
            const levels = hlsRef.current.levels;
            const levelIndex = levels.findIndex(l => l.height === quality);
            if (levelIndex !== -1) {
              hlsRef.current.currentLevel = levelIndex;
            }
          }
        }
      },
      speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 2] },
      keyboard: { focused: true, global: true },
      tooltips: { controls: true, seek: true },
      captions: { active: false, language: 'auto' },
      fullscreen: { enabled: true, fallback: true, iosNative: true },
      storage: { enabled: true, key: 'damitv-plyr' },
      i18n: {
        restart: 'Restart',
        play: 'Play',
        pause: 'Pause',
        fastForward: 'Forward {seektime}s',
        rewind: 'Rewind {seektime}s',
        seek: 'Seek',
        played: 'Played',
        buffered: 'Buffered',
        currentTime: 'Current time',
        duration: 'Duration',
        volume: 'Volume',
        mute: 'Mute',
        unmute: 'Unmute',
        enableCaptions: 'Enable captions',
        disableCaptions: 'Disable captions',
        enterFullscreen: 'Enter fullscreen',
        exitFullscreen: 'Exit fullscreen',
        frameTitle: 'Player for {title}',
        captions: 'Captions',
        settings: 'Settings',
        pip: 'PIP',
        menuBack: 'Go back to previous menu',
        speed: 'Speed',
        normal: 'Normal',
        quality: 'Quality',
        loop: 'Loop',
        start: 'Start',
        end: 'End',
        all: 'All',
        reset: 'Reset',
        disabled: 'Disabled',
        enabled: 'Enabled',
        advertisement: 'Ad',
        qualityBadge: {
          1080: 'FHD',
          720: 'HD',
          480: 'SD',
          360: 'SD'
        }
      }
    });

    playerRef.current = player;

    // Handle HLS streams
    if (src.includes('.m3u8')) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
          maxBufferSize: 60 * 1000 * 1000,
          maxBufferHole: 0.5,
          fragLoadingTimeOut: 20000,
          manifestLoadingTimeOut: 10000,
          levelLoadingTimeOut: 10000,
          startLevel: -1,
          autoStartLoad: true,
        });

        hlsRef.current = hls;
        hls.loadSource(src);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
          console.log('HLS manifest parsed:', data.levels.length, 'quality levels');

          // Update Plyr quality options based on HLS levels
          const qualities = data.levels.map(level => level.height);
          player.quality = qualities[0] || 720;

          setIsReady(true);
          onReady?.();

          // Auto-play
          video.play().catch(() => {
            console.log('Auto-play prevented by browser');
          });
        });

        hls.on(Hls.Events.ERROR, (_, data) => {
          console.error('HLS error:', data.type, data.details);
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.log('Network error, attempting recovery...');
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.log('Media error, attempting recovery...');
                hls.recoverMediaError();
                break;
              default:
                console.log('Fatal error, destroying HLS');
                hls.destroy();
                onError?.();
                break;
            }
          }
        });

        hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
          const level = hls.levels[data.level];
          console.log(`Quality switched to: ${level.height}p`);
        });

      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari native HLS
        video.src = src;
        video.addEventListener('loadedmetadata', () => {
          setIsReady(true);
          onReady?.();
          video.play().catch(() => {});
        });
      }
    } else {
      // Direct video source
      video.src = src;
      video.addEventListener('loadedmetadata', () => {
        setIsReady(true);
        onReady?.();
      });
    }

    // Player events
    player.on('error', () => {
      console.error('Plyr error');
      onError?.();
    });

    player.on('playing', () => {
      console.log('Video playing');
    });

    // Cleanup
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [stream?.embedUrl, onError, onReady]);

  if (!stream?.embedUrl) {
    return null;
  }

  return (
    <div className="plyr-container w-full h-full">
      <video
        ref={videoRef}
        className="w-full h-full"
        playsInline
        crossOrigin="anonymous"
        poster={match?.poster || undefined}
      />

      {/* Custom Plyr Styles - DAMITV Brand Colors */}
      <style>{`
        .plyr-container {
          --plyr-color-main: #F54927;
          --plyr-video-background: #0d0d0d;
          --plyr-menu-background: #141414;
          --plyr-menu-color: #ffffff;
          --plyr-menu-border-color: #262626;
          --plyr-badge-background: #F54927;
          --plyr-badge-text-color: #ffffff;
          --plyr-badge-border-radius: 4px;
          --plyr-captions-background: rgba(0, 0, 0, 0.8);
          --plyr-captions-text-color: #ffffff;
          --plyr-control-icon-size: 18px;
          --plyr-control-spacing: 10px;
          --plyr-control-padding: 10px;
          --plyr-control-radius: 8px;
          --plyr-tooltip-background: #141414;
          --plyr-tooltip-color: #ffffff;
          --plyr-tooltip-padding: 6px 12px;
          --plyr-tooltip-arrow-size: 6px;
          --plyr-tooltip-radius: 6px;
          --plyr-progress-loading-size: 25px;
          --plyr-progress-loading-background: rgba(245, 73, 39, 0.3);
          --plyr-video-control-color: #ffffff;
          --plyr-video-control-color-hover: #F54927;
          --plyr-video-control-background-hover: rgba(245, 73, 39, 0.2);
          --plyr-audio-control-color: #ffffff;
          --plyr-audio-control-color-hover: #F54927;
          --plyr-font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          --plyr-font-size-base: 14px;
          --plyr-font-size-small: 12px;
          --plyr-font-size-large: 16px;
          --plyr-font-weight-regular: 500;
          --plyr-font-weight-bold: 600;
          --plyr-line-height: 1.5;
          --plyr-range-thumb-height: 14px;
          --plyr-range-thumb-background: #F54927;
          --plyr-range-thumb-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
          --plyr-range-track-height: 5px;
          --plyr-range-fill-background: #F54927;
          --plyr-video-range-track-background: rgba(255, 255, 255, 0.25);
          --plyr-video-progress-buffered-background: rgba(255, 255, 255, 0.35);
          --plyr-audio-range-track-background: rgba(193, 201, 209, 0.66);
          --plyr-audio-progress-buffered-background: rgba(193, 201, 209, 0.44);
          --plyr-tab-focus-color: rgba(245, 73, 39, 0.5);
        }

        .plyr-container .plyr {
          border-radius: 16px;
          overflow: hidden;
        }

        .plyr-container .plyr--video {
          background: #0d0d0d;
        }

        .plyr-container .plyr__controls {
          background: linear-gradient(transparent, rgba(0, 0, 0, 0.85));
          padding: 20px 16px 12px;
        }

        .plyr-container .plyr__control {
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .plyr-container .plyr__control:hover {
          background: rgba(245, 73, 39, 0.2);
        }

        .plyr-container .plyr__control--overlaid {
          background: rgba(245, 73, 39, 0.9);
          border-radius: 50%;
          padding: 20px;
          transition: all 0.3s ease;
        }

        .plyr-container .plyr__control--overlaid:hover {
          background: #F54927;
          transform: scale(1.1);
        }

        .plyr-container .plyr__control--overlaid svg {
          width: 24px;
          height: 24px;
        }

        .plyr-container .plyr__progress__buffer {
          background: rgba(255, 255, 255, 0.3);
        }

        .plyr-container .plyr__menu__container {
          background: #141414;
          border: 1px solid #262626;
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
        }

        .plyr-container .plyr__menu__container [role=menu] {
          padding: 8px;
        }

        .plyr-container .plyr__menu__container [role=menuitem],
        .plyr-container .plyr__menu__container [role=menuitemradio] {
          border-radius: 8px;
          padding: 8px 12px;
          margin: 2px 0;
        }

        .plyr-container .plyr__menu__container [role=menuitem]:hover,
        .plyr-container .plyr__menu__container [role=menuitemradio]:hover {
          background: rgba(245, 73, 39, 0.15);
        }

        .plyr-container .plyr__menu__container [role=menuitemradio][aria-checked=true]::before {
          background: #F54927;
        }

        .plyr-container .plyr__menu__container .plyr__menu__value {
          color: #F54927;
          font-weight: 600;
        }

        .plyr-container .plyr__tooltip {
          background: #1a1a1a;
          border: 1px solid #333;
          border-radius: 8px;
          font-weight: 500;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .plyr-container .plyr__volume {
          max-width: 100px;
        }

        .plyr-container .plyr__time {
          font-weight: 500;
          font-size: 13px;
        }

        .plyr-container .plyr--full-ui input[type=range] {
          color: #F54927;
        }

        .plyr-container .plyr__poster {
          background-size: cover;
        }

        /* Loading spinner */
        .plyr-container .plyr--loading .plyr__control--overlaid {
          animation: plyr-pulse 1.5s ease-in-out infinite;
        }

        @keyframes plyr-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(0.95); }
        }

        /* Quality badge */
        .plyr-container .plyr__badge {
          background: #F54927;
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 600;
          text-transform: uppercase;
        }

        /* Fullscreen improvements */
        .plyr-container .plyr:fullscreen .plyr__control--overlaid {
          padding: 28px;
        }

        .plyr-container .plyr:fullscreen .plyr__control--overlaid svg {
          width: 32px;
          height: 32px;
        }

        /* Mobile optimizations */
        @media (max-width: 768px) {
          .plyr-container .plyr__controls {
            padding: 12px 10px 8px;
          }

          .plyr-container .plyr__control {
            padding: 8px;
          }

          .plyr-container .plyr__control--overlaid {
            padding: 16px;
          }

          .plyr-container .plyr__volume {
            max-width: 60px;
          }
        }

        /* Hide YouTube/Vimeo branding if used */
        .plyr-container .plyr__video-embed__container {
          padding-bottom: 56.25%;
        }
      `}</style>
    </div>
  );
};

export default PlyrVideoPlayer;
