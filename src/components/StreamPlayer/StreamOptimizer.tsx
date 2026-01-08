
import React, { useEffect } from 'react';
import { Stream } from '../../types/sports';

interface StreamOptimizerProps {
  stream: Stream | null;
}

const StreamOptimizer: React.FC<StreamOptimizerProps> = ({ stream }) => {
  useEffect(() => {
    if (!stream?.embedUrl) return;

    try {
      const url = new URL(stream.embedUrl);
      const domain = url.hostname;

      // Add DNS prefetch and preconnect for the stream domain
      const existingPrefetch = document.querySelector(`link[rel="dns-prefetch"][href="//${domain}"]`);
      const existingPreconnect = document.querySelector(`link[rel="preconnect"][href="${url.origin}"]`);

      if (!existingPrefetch) {
        const prefetchLink = document.createElement('link');
        prefetchLink.rel = 'dns-prefetch';
        prefetchLink.href = `//${domain}`;
        document.head.appendChild(prefetchLink);
      }

      if (!existingPreconnect) {
        const preconnectLink = document.createElement('link');
        preconnectLink.rel = 'preconnect';
        preconnectLink.href = url.origin;
        preconnectLink.crossOrigin = 'anonymous';
        document.head.appendChild(preconnectLink);
      }

      // Cleanup function to remove the links when component unmounts
      return () => {
        const prefetchToRemove = document.querySelector(`link[rel="dns-prefetch"][href="//${domain}"]`);
        const preconnectToRemove = document.querySelector(`link[rel="preconnect"][href="${url.origin}"]`);
        
        if (prefetchToRemove) document.head.removeChild(prefetchToRemove);
        if (preconnectToRemove) document.head.removeChild(preconnectToRemove);
      };
    } catch (error) {
      console.warn('Failed to optimize stream loading:', error);
    }
  }, [stream]);

  return null; // This component doesn't render anything
};

export default StreamOptimizer;
