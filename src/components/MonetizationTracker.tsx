import React from 'react';

interface MonetizationTrackerProps {
  children: React.ReactNode;
}

const MonetizationTracker: React.FC<MonetizationTrackerProps> = ({ children }) => {
  // Analytics tracking removed
  return <>{children}</>;
};

export default MonetizationTracker;
