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

  const sizeConfig = {
    sm: { size: 20, fontSize: '10px' },
    md: { size: 32, fontSize: '14px' },
    lg: { size: 48, fontSize: '18px' }
  };

  const config = sizeConfig[size];
  const initial = teamName.charAt(0).toUpperCase();

  if (!logo || imgError) {
    return (
      <div
        className={`rounded-full bg-muted flex items-center justify-center text-muted-foreground font-bold flex-shrink-0 ${className}`}
        style={{ width: config.size, height: config.size, fontSize: config.fontSize }}
      >
        {initial}
      </div>
    );
  }

  return (
    <img
      src={logo}
      alt={`${teamName} logo`}
      style={{ width: 'auto', height: 'auto', maxWidth: config.size, maxHeight: config.size }}
      className={`object-contain flex-shrink-0 ${className}`}
      onError={() => setImgError(true)}
      loading="lazy"
    />
  );
};

export default TeamLogoDisplay;
