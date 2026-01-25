import React from 'react';
import { Tv, Users } from 'lucide-react';

interface ChannelCardProps {
  title: string;
  embedUrl: string;
  logo?: string;
  onClick?: () => void;
  isActive?: boolean;
  viewers?: number;
  nowPlaying?: string;
}

const ChannelCard: React.FC<ChannelCardProps> = ({
  title,
  embedUrl,
  logo,
  onClick,
  isActive = false,
  viewers,
  nowPlaying
}) => {
  // Generate initials from title
  const generateInitials = () => {
    return title
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

  return (
    <div
      onClick={onClick}
      className={`
        flex-shrink-0 w-[140px] sm:w-[160px] md:w-[180px]
        rounded-2xl overflow-hidden cursor-pointer
        transition-all duration-300 ease-out
        border-2 hover:scale-105 hover:shadow-xl
        ${isActive
          ? 'bg-primary/10 border-primary shadow-primary/20 shadow-lg'
          : 'bg-card/80 border-border/50 hover:border-primary/50 hover:bg-card'
        }
      `}
    >
      {/* Logo Section */}
      <div className="relative pt-4 pb-2 px-4 flex justify-center">
        <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
          {logo ? (
            <img
              src={logo}
              alt={title}
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                const fallback = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
                if (fallback) fallback.classList.remove('hidden');
              }}
            />
          ) : null}
          <div className={`w-full h-full flex items-center justify-center ${logo ? 'hidden' : ''}`}>
            <Tv className="w-10 h-10 text-muted-foreground" />
          </div>
        </div>

        {/* Live indicator */}
        {viewers !== undefined && viewers > 0 && (
          <div className="absolute top-2 right-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse inline-block" />
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="px-3 pb-4 text-center">
        {/* Channel Name */}
        <h3 className="font-semibold text-sm text-foreground truncate mb-1" title={title}>
          {title}
        </h3>

        {/* Now Playing / EPG */}
        {nowPlaying && (
          <p className="text-xs text-primary truncate mb-1.5" title={nowPlaying}>
            {nowPlaying}
          </p>
        )}

        {/* Viewers */}
        {viewers !== undefined && viewers > 0 && (
          <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
            <Users className="w-3 h-3" />
            <span>{viewers.toLocaleString()}</span>
          </div>
        )}

        {/* Fallback when no EPG and no viewers */}
        {!nowPlaying && (!viewers || viewers === 0) && (
          <p className="text-xs text-muted-foreground">Live TV</p>
        )}
      </div>
    </div>
  );
};

export default ChannelCard;
