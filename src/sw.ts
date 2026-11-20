/// <reference lib="webworker" />
import { CacheableResponsePlugin } from 'workbox-cacheable-response'
import { ExpirationPlugin } from 'workbox-expiration'
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { CacheFirst, NetworkOnly, StaleWhileRevalidate } from 'workbox-strategies'

declare const self: ServiceWorkerGlobalScope

self.skipWaiting()
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
registerRoute(
  /\/api\/v1\/catalogos\//,
  new StaleWhileRevalidate({ cacheName: 'catalogos' }),
)

// Autenticación y datos personales: NUNCA en caché.
registerRoute(
  /\/api\/v1\/(auth|perfil|vehiculos|viajes|reservas)(\/|$|\?)/,
  new NetworkOnly(),
)

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
interface PayloadPush {
  titulo: string
  mensaje: string
  tipo: string
  viajeId?: string | null
  reservaId?: string | null
}

self.addEventListener('push', (event) => {
  if (!event.data) return
  let payload: PayloadPush
  try {
    payload = event.data.json() as PayloadPush
  } catch {
    return
  }

  const url = payload.reservaId
    ? `/reservas/${payload.reservaId}/mapa`
    : payload.viajeId
      ? `/viajes/${payload.viajeId}`
      : '/'

  event.waitUntil(
    self.registration.showNotification(payload.titulo, {
      body: payload.mensaje,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: payload.tipo,
      data: { url },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data as { url?: string } | undefined)?.url ?? '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((lista) => {
      const existente = lista.find((c) => new URL(c.url).pathname === url)
      if (existente) return existente.focus()
      return self.clients.openWindow(url)
    }),
  )
})
