
import React from 'react';

interface TeamDisplayProps {
  name: string;
  badge?: string;
  logo?: string;
  isHome?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const TeamDisplay: React.FC<TeamDisplayProps> = ({ name, badge, logo, isHome = false, size = 'medium' }) => {
  // Prioritize logo over badge, construct URL if badge is a hash
  const getBadgeUrl = (badgeStr: string | undefined): string => {
    if (!badgeStr) return '';
    if (badgeStr.startsWith('http')) return badgeStr;
    // Badge is likely a hash from streamed.pk API
    if (badgeStr.length > 20 && !badgeStr.includes('/')) {
      return `https://streamed.pk/api/images/proxy/${badgeStr}.webp`;
    }
    return '';
  };

  const imageUrl = logo || getBadgeUrl(badge);

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return {
          imgSize: '48px',
          imgSizeSm: '64px',
          text: 'text-xs sm:text-sm',
          fallbackSize: 'w-12 h-12 sm:w-16 sm:h-16',
          fallback: 'text-lg sm:text-xl'
        };
      case 'large':
        return {
          imgSize: '80px',
          imgSizeSm: '96px',
          text: 'text-lg md:text-xl',
          fallbackSize: 'w-20 h-20 md:w-24 md:h-24',
          fallback: 'text-2xl md:text-3xl'
        };
      default:
        return {
          imgSize: '64px',
          imgSizeSm: '64px',
          text: 'text-sm',
          fallbackSize: 'w-16 h-16',
          fallback: 'text-xl'
        };
    }
  };

  const classes = getSizeClasses();

  return (
    <div className="flex flex-col items-center text-center">
      {imageUrl ? (
        <div className="mb-1 sm:mb-2 md:mb-3">
          <img
            src={imageUrl}
            alt={name}
            style={{
              width: 'auto',
              height: 'auto',
              maxWidth: classes.imgSize,
              maxHeight: classes.imgSize
            }}
            className="object-contain sm:max-w-none sm:max-h-none"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              const fallbackDiv = (e.target as HTMLImageElement).parentElement?.nextElementSibling as HTMLElement;
              if (fallbackDiv) {
                fallbackDiv.style.display = 'flex';
              }
            }}
          />
        </div>
      ) : null}
      <div
        className={`${classes.fallbackSize} bg-[#343a4d] rounded-full flex items-center justify-center mb-1 sm:mb-2 md:mb-3 ${imageUrl ? 'hidden' : ''}`}
        style={{ display: imageUrl ? 'none' : 'flex' }}
      >
        <span className={`${classes.fallback} font-bold text-white`}>{name.charAt(0)}</span>
      </div>
      <h2 className={`${classes.text} font-bold text-white`}>{name}</h2>
    </div>
  );
};

export default TeamDisplay;
