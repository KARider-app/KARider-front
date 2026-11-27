/// <reference lib="webworker" />
import { CacheableResponsePlugin } from 'workbox-cacheable-response'
import { ExpirationPlugin } from 'workbox-expiration'
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { CacheFirst, NetworkOnly, StaleWhileRevalidate } from 'workbox-strategies'
import {
  pestanaParaEnfocar,
  urlDestino,
  type PayloadPush,
} from './features/notificaciones/domain/push'

declare const self: ServiceWorkerGlobalScope

void self.skipWaiting()
self.addEventListener('activate', () => self.clients.claim())

// --- Precache de la app (equivalente a lo que generaba generateSW) ---
cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

// SPA: cualquier navegación no manejada cae a index.html, salvo llamadas a la API.
registerRoute(
  new NavigationRoute(createHandlerBoundToURL('/index.html'), {
    denylist: [/^\/api\//],
  }),
)

// Catálogos: se pueden usar sin conexión.
registerRoute(/\/api\/v1\/catalogos\//, new StaleWhileRevalidate({ cacheName: 'catalogos' }))

// Autenticación y datos personales: NUNCA en caché.
registerRoute(/\/api\/v1\/(auth|perfil|vehiculos|viajes|reservas)(\/|$|\?)/, new NetworkOnly())

// Teselas del mapa (HU-08): las ya vistas se muestran sin conexión.
registerRoute(
  /^https:\/\/tile\.openstreetmap\.org\//,
  new CacheFirst({
    // v2: la caché anterior pudo guardar mosaicos bloqueados (respuestas opacas); se descarta.
    cacheName: 'mapa-osm-v2',
    plugins: [
      new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 7 }),
      new CacheableResponsePlugin({ statuses: [200] }),
    ],
  }),
)

// --- HU-13: notificaciones push de eventos del viaje ---
self.addEventListener('push', (event) => {
  if (!event.data) return
  let payload: PayloadPush
  try {
    payload = event.data.json() as PayloadPush
  } catch {
    return
  }

  event.waitUntil(
    self.registration.showNotification(payload.titulo, {
      body: payload.mensaje,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: payload.tipo,
      data: { url: urlDestino(payload) },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data as { url?: string } | undefined)?.url ?? '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (lista) => {
      const existente = pestanaParaEnfocar(lista, url)
      if (!existente) return self.clients.openWindow(url)
      // Reutilizar la pestaña (en vez de abrir una ventana nueva) conserva la sesión en memoria.
      if (new URL(existente.url).pathname !== url) await existente.navigate(url)
      return existente.focus()
    }),
  )
})
