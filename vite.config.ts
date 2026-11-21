import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import vueDevTools from 'vite-plugin-vue-devtools'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    vueDevTools(),
    VitePWA({
      // HU-13: el service worker necesita manejar el evento "push", así que ya no se
      // autogenera (generateSW); se inyecta el precache sobre src/sw.ts.
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
      },
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
          {
            src: '/icons/maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      // El enrutamiento de Workbox (antes en `workbox.runtimeCaching`) ahora vive en src/sw.ts,
      // porque injectManifest no genera esas rutas automáticamente.
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
