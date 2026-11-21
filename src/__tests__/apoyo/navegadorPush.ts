import { vi } from 'vitest'

/** HU-13: suscripción Web Push simulada, como la devuelve PushManager en el navegador. */
export function suscripcionFalsa(endpoint = 'https://push.ejemplo/abc') {
  return {
    endpoint,
    unsubscribe: vi.fn<() => Promise<boolean>>().mockResolvedValue(true),
    toJSON: () => ({ endpoint, keys: { p256dh: 'clave-p256dh', auth: 'clave-auth' } }),
  }
}

export type SuscripcionFalsa = ReturnType<typeof suscripcionFalsa>

/** HU-13: simula un navegador con soporte de Web Push (Notification + PushManager + service worker). */
export function instalarNavegadorConPush(
  opciones: { suscripcionInicial?: SuscripcionFalsa | null } = {},
) {
  let suscripcionActual = opciones.suscripcionInicial ?? null
  const registro = {
    pushManager: {
      getSubscription: vi.fn<() => Promise<SuscripcionFalsa | null>>(async () => suscripcionActual),
      subscribe: vi.fn<() => Promise<SuscripcionFalsa>>(async () => {
        suscripcionActual = suscripcionFalsa()
        return suscripcionActual
      }),
    },
  }
  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: { ready: Promise.resolve(registro) },
  })
  Object.defineProperty(window, 'PushManager', { configurable: true, value: class {} })
  Object.defineProperty(window, 'Notification', {
    configurable: true,
    writable: true,
    value: Object.assign(vi.fn(), {
      permission: 'default' as NotificationPermission,
      requestPermission: vi
        .fn<() => Promise<NotificationPermission>>()
        .mockResolvedValue('granted'),
    }),
  })
  return registro
}
