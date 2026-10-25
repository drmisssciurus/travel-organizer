import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

const DAY = 24 * 60 * 60

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // PWA: the app opens without a network (all files are precached by a service worker)
    // and can be added to the home screen. Data is in localStorage anyway; the cloud syncs when online.
    VitePWA({
      registerType: 'autoUpdate', // a new deploy replaces the old version on the next launch
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'waypoint — travel organizer',
        short_name: 'waypoint',
        description: 'Day-by-day trip plan, map, expenses and checklist',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#efe6d8',
        theme_color: '#354024',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            // Anonymous Pro from Google Fonts
            urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
            handler: 'CacheFirst',
            options: { cacheName: 'fonts', expiration: { maxEntries: 20, maxAgeSeconds: 365 * DAY } },
          },
          {
            // Map tiles that were already seen stay available offline (no prefetching — OSM tile policy)
            urlPattern: ({ url }) => url.hostname === 'tile.openstreetmap.org',
            handler: 'CacheFirst',
            options: {
              cacheName: 'map-tiles',
              expiration: { maxEntries: 2000, maxAgeSeconds: 30 * DAY },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
