import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Makes the site installable ("Add to Home Screen") and lets it open offline.
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Study Buddy',
        short_name: 'Study Buddy',
        description: 'Plans your homework around your school schedule, with a cat that grows as you get things done.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'any', // portrait for the app, sideways for focus mode
        background_color: '#f3eadc',
        theme_color: '#f3eadc',
        icons: [
          { src: '/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // app shell is cached; every route falls back to it so deep links work offline
        navigateFallback: '/index.html',
        // notification handlers live in public/push-sw.js
        importScripts: ['push-sw.js'],
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // the analytics library is only fetched when analytics is on; don't make every user download it
        globIgnores: ['**/module-*.js', '**/posthog*.js'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts', expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
          // Supabase (your data) is never cached, so you always see fresh tasks.
        ],
      },
    }),
  ],
})
