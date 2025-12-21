import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';
import vitePrerender from 'vite-plugin-prerender';

// All routes to pre-render with their SEO data
const prerenderRoutes = [
  '/',
  '/live',
  '/channels',
  '/schedule',
  '/dmca',
  '/install',
  '/ufc-streaming-free',
  '/nba-streaming-free',
  '/watch-premier-league-free',
  '/hesgoal-alternatives',
  '/batmanstream-alternatives',
  '/daddylivehd-alternatives',
  '/streameast-alternatives',
  '/crackstreams-alternative',
  '/hesgoal',
  '/hesgoal-live-stream',
  '/hesgoal-tv',
  '/vipleague',
  '/myp2p',
  '/sport365-live',
  '/freestreams-live-1',
  '/totalsportek-formula1',
  '/totalsportek-tennis',
  '/blog',
  // League pages
  '/premier-league-streaming',
  '/champions-league-streaming',
  '/europa-league-streaming',
  '/la-liga-streaming',
  '/bundesliga-streaming',
  '/serie-a-streaming',
  '/ligue-1-streaming',
  // Sports pages
  '/nfl-streaming',
  '/mlb-streaming',
  '/nhl-streaming',
  '/mls-streaming',
  '/boxing-streaming',
  '/wwe-streaming',
  '/motogp-streaming',
];

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React core - essential for all pages
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          
          // Radix UI components - loaded on demand
          'ui-radix': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-popover',
            '@radix-ui/react-select',
            '@radix-ui/react-accordion',
            '@radix-ui/react-scroll-area',
          ],
          
          // Query/State management
          'query': ['@tanstack/react-query'],
          
          // Date utilities
          'date-utils': ['date-fns'],
          
          // Charts - only loaded on analytics pages
          'charts': ['recharts'],
          
          // Video player
          'video': ['hls.js'],
        },
      },
    },
    chunkSizeWarningLimit: 500,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'robots.txt', 'sitemap.xml'],
      manifest: {
        name: 'DamiTV - Free Live Sports Streaming',
        short_name: 'DamiTV',
        description: 'Watch free live football streaming, Premier League, Champions League, and all sports TV online',
        theme_color: '#9b87f5',
        background_color: '#1A1F2C',
        display: 'standalone',
        orientation: 'any',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/favicon.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/favicon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff,woff2}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'images-cache-v1',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
              }
            }
          },
          {
            urlPattern: /^https:\/\/.*\.(?:js|css)$/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'assets-cache-v1',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 // 1 day
              },
              networkTimeoutSeconds: 3
            }
          }
        ]
      }
    }),
    // Pre-render static pages for SEO - only in production build
    mode === 'production' && vitePrerender({
      staticDir: path.resolve(__dirname, 'dist'),
      routes: prerenderRoutes,
      renderer: new vitePrerender.PuppeteerRenderer({
        headless: true,
        renderAfterTime: 5000,
      }),
      postProcess(renderedRoute) {
        // Inject critical inline styles and cleanup
        renderedRoute.html = renderedRoute.html
          .replace(/<script\s+type="module"\s+crossorigin/gi, '<script type="module" defer crossorigin')
          .replace(/data-server-rendered="true"/gi, '');
        return renderedRoute;
      }
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
