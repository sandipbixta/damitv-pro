
import React from 'react';

interface TeamDisplayProps {
  name: string;
  badge?: string;
  logo?: string;
  isHome?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const TeamDisplay: React.FC<TeamDisplayProps> = ({ name, badge, logo, isHome = false, size = 'medium' }) => {
  // Prioritize logo over badge, then fall back to badge URL format - now using BOHOSport API
  const imageUrl = logo || (badge ? (badge.startsWith('http') ? badge : `https://streamapi.cc/sport/images/badge/${badge}`) : '');
  
  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return {
          container: 'w-12 h-12 sm:w-16 sm:h-16',
          text: 'text-xs sm:text-sm',
          fallback: 'text-lg sm:text-xl'
        };
      case 'large':
        return {
          container: 'w-20 h-20 md:w-24 md:h-24',
          text: 'text-lg md:text-xl',
          fallback: 'text-2xl md:text-3xl'
        };
      default:
        return {
          container: 'w-16 h-16',
          text: 'text-sm',
          fallback: 'text-xl'
        };
    }
  };

  const classes = getSizeClasses();

  return (
    <div className="flex flex-col items-center text-center">
      {imageUrl ? (
        <img 
          src={imageUrl} 
          alt={name} 
          className={`${classes.container} mb-1 sm:mb-2 md:mb-3 object-contain rounded-lg bg-white p-1`}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
            const fallbackDiv = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
            if (fallbackDiv) {
              fallbackDiv.style.display = 'flex';
            }
          }}
        />
      ) : null}
      <div 
        className={`${classes.container} bg-[#343a4d] rounded-full flex items-center justify-center mb-1 sm:mb-2 md:mb-3 ${imageUrl ? 'hidden' : ''}`}
        style={{ display: imageUrl ? 'none' : 'flex' }}
      >
        <span className={`${classes.fallback} font-bold text-white`}>{name.charAt(0)}</span>
      </div>
      <h2 className={`${classes.text} font-bold text-white`}>{name}</h2>
    </div>
  );
};

export default TeamDisplay;
