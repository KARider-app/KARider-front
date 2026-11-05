import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icons/*.png'],
      manifest: {
        name: 'KARider · Viajes compartidos UTTT',
        short_name: 'KARider',
        description: 'Viajes compartidos entre miembros de la comunidad UTTT.',
        lang: 'es-MX',
        theme_color: '#1D2D44',
        background_color: '#FFFFFF',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        navigateFallback: '/index.html',
        runtimeCaching: [
          // Catálogos: se pueden usar sin conexión
          {
            urlPattern: /\/api\/v1\/catalogos\//,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'catalogos' },
          },
          // Autenticación y datos personales: NUNCA en caché
          {
            urlPattern: /\/api\/v1\/(auth|perfil|vehiculos|viajes|reservas)(\/|$|\?)/,
            handler: 'NetworkOnly',
          },
          // Teselas del mapa (HU-08): las ya vistas se muestran sin conexión
          {
            urlPattern: /^https:\/\/tile\.openstreetmap\.org\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'mapa-osm',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 7 },
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
