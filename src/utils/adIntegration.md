
# Advertisement Integration Guide

This document explains the safe approach to integrating third-party advertisements in your application.

## Security Considerations

1. **Never directly paste ad scripts into your React components**:
   - Doing so can lead to XSS vulnerabilities
   - Prevents proper management of ad lifecycles
   - Makes it difficult to debug and maintain

2. **Use a dedicated ad component**:
   - Safely manages the lifecycle of ads
   - Provides consistent styling and user experience
   - Makes it easy to swap ad providers or disable ads in certain environments

## Implementation Guide

To properly integrate the ad scripts provided, follow these steps:

1. **Create a production configuration file**:

```javascript
// src/config/adConfig.js
export const adScripts = {
  banner: {
    key: '7c589340b2a1155dcea92f44cc468438',
    format: 'iframe',
    height: 250,
    width: 300,
    scriptSrc: '//monkeyhundredsarmed.com/7c589340b2a1155dcea92f44cc468438/invoke.js'
  },
  sidebar: {
    scriptSrc: '//monkeyhundredsarmed.com/2d/10/9c/2d109cea62316aeb5d20389246c3d8a9.js'
  },
  video: {
    scriptSrc: '//monkeyhundredsarmed.com/ae/f7/eb/aef7eba12c46ca91518228f813db6ce5.js'
  }
};
```

2. **Update the Advertisement component to load scripts properly**:

```jsx
import { useEffect, useRef } from 'react';
import { adScripts } from '../config/adConfig';

const Advertisement = ({ type }) => {
  const adRef = useRef(null);
  
  useEffect(() => {
    if (!adRef.current) return;
    
    // Clean previous content
    adRef.current.innerHTML = '';
    
    const config = adScripts[type];
    if (!config) return;
    
    // Create script element
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = config.scriptSrc;
    script.async = true;
    
    // Add script to container
    adRef.current.appendChild(script);
    
    return () => {
      // Clean up when component unmounts
      if (adRef.current) {
        adRef.current.innerHTML = '';
      }
    };
  }, [type]);
  
  return <div ref={adRef} className="ad-container" data-ad-type={type} />;
};
```

3. **Consider using an ad management library**:
   - [React-Adsense](https://github.com/hustcc/react-adsense) for Google AdSense
   - [React-Dfp](https://github.com/jaanauati/react-dfp) for DoubleClick for Publishers

## Testing

Always test ads in a safe development environment before deploying to production.

## Compliance

Ensure you comply with:
1. GDPR and other privacy regulations
2. Ad network terms of service
3. User consent requirements for tracking

## Alternative Solutions

Consider server-side ad integration or using a dedicated ad management platform for better security and performance.
