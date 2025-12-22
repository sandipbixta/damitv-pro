import React, { useState } from 'react';

interface TeamLogoDisplayProps {
  logo: string | null | undefined;
  teamName: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const TeamLogoDisplay: React.FC<TeamLogoDisplayProps> = ({
  logo,
  teamName,
  size = 'md',
  className = ''
}) => {
  const [imgError, setImgError] = useState(false);

  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const initial = teamName.charAt(0).toUpperCase();

  if (!logo || imgError) {
    return (
      <div 
        className={`${sizeClasses[size]} rounded-full bg-muted flex items-center justify-center text-muted-foreground font-bold ${className}`}
        style={{ fontSize: size === 'sm' ? '10px' : size === 'md' ? '14px' : '18px' }}
      >
        {initial}
      </div>
    );
  }

  return (
    <img
      src={logo}
      alt={`${teamName} logo`}
      className={`${sizeClasses[size]} object-contain rounded ${className}`}
      onError={() => setImgError(true)}
      loading="lazy"
    />
  );
};

export default TeamLogoDisplay;
