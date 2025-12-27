import React from 'react';

interface PlayerContainerProps {
  children: React.ReactNode;
}

const PlayerContainer: React.FC<PlayerContainerProps> = ({ children }) => (
  <div className="relative w-full" data-player-wrapper>
    {/* Outer glow effect */}
    <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 rounded-xl blur-sm opacity-75 sm:block hidden" />
    
    {/* Main player container */}
    <div 
      className="relative w-full bg-gradient-to-b from-[#0a0a0a] to-[#0f0f0f] rounded-none sm:rounded-xl overflow-hidden shadow-2xl group border border-white/5"
      data-player-container
    >
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/60 to-transparent z-10" />
      
      {/* Inner content */}
      <div className="relative">
        {children}
      </div>
      
      {/* Bottom subtle gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/40 to-transparent pointer-events-none z-10" />
    </div>
  </div>
);

export default PlayerContainer;