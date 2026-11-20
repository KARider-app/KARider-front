import { onMounted, ref } from 'vue'
import { comoApiError, type ApiError } from '@/core/http/apiError'
import { notificacionesApi } from '../api/notificacionesApi'

/** Convierte la clave VAPID (base64url) al formato que pide PushManager.subscribe. */
function aUint8Array(base64Url: string): Uint8Array {
  const base64 = (base64Url + '='.repeat((4 - (base64Url.length % 4)) % 4))
    .replace(/-/g, '+')
    .replace(/_/g, '/')
  const binario = atob(base64)
  return Uint8Array.from(binario, (c) => c.charCodeAt(0))
}

/** HU-13: pedir permiso y suscribirse/desuscribirse a notificaciones push de eventos del viaje. */
export function useNotificacionesPush() {
  const soportado =
    typeof navigator !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window
  const permiso = ref<NotificationPermission>(soportado ? Notification.permission : 'denied')
  const suscrito = ref(false)
  const cargando = ref(false)
  const error = ref<ApiError | null>(null)

  async function comprobarSuscripcion() {
    if (!soportado) return
    const registro = await navigator.serviceWorker.ready
    const sub = await registro.pushManager.getSubscription()
    suscrito.value = sub !== null
  }

  async function activar() {
    if (!soportado) return
    cargando.value = true
    error.value = null
    try {
      permiso.value = await Notification.requestPermission()
      if (permiso.value !== 'granted') return

      const { publicKey, habilitado } = await notificacionesApi.clavePublica()
      if (!habilitado || !publicKey) {
        error.value = comoApiError(
          new Error('El servidor aún no tiene configuradas las notificaciones push.'),
        )
        return
      }

      const registro = await navigator.serviceWorker.ready
      const sub =
        (await registro.pushManager.getSubscription()) ??
        (await registro.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: aUint8Array(publicKey) as BufferSource,
        }))

      const json = sub.toJSON()
      await notificacionesApi.suscribir({
        endpoint: sub.endpoint,
        p256dh: json.keys?.p256dh ?? '',
        auth: json.keys?.auth ?? '',
      })
      suscrito.value = true
    } catch (e) {
      error.value = comoApiError(e)
    } finally {
      cargando.value = false
    }
  }

  async function desactivar() {
    if (!soportado) return
    cargando.value = true
    error.value = null
    try {
      const registro = await navigator.serviceWorker.ready
      const sub = await registro.pushManager.getSubscription()
      if (sub) {
        await notificacionesApi.cancelarSuscripcion(sub.endpoint)
        await sub.unsubscribe()
      }
      suscrito.value = false
    } catch (e) {
      error.value = comoApiError(e)
    } finally {
      cargando.value = false
    }
  }

  onMounted(() => {
    void comprobarSuscripcion()
  })

  return { soportado, permiso, suscrito, cargando, error, activar, desactivar }
}
