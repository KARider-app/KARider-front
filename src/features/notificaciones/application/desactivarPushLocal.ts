import { notificacionesApi } from '../api/notificacionesApi'

/**
 * Cancela la suscripción push de este navegador, sin depender de un componente montado
 * (a diferencia de `useNotificacionesPush`, se puede llamar desde el cierre de sesión).
 *
 * Importante: el mismo navegador puede quedar «suscrito» a cuentas distintas si varias
 * personas prueban la app ahí (el backend reasigna la suscripción a quien la activa por
 * última vez). Por eso se cancela al cerrar sesión: evita que a la siguiente persona que
 * use este dispositivo le lleguen notificaciones de la cuenta anterior.
 */
export async function desactivarPushLocal(): Promise<void> {
  if (
    typeof navigator === 'undefined' ||
    !('serviceWorker' in navigator) ||
    !('PushManager' in window)
  ) {
    return
  }
  const registro = await navigator.serviceWorker.ready
  const sub = await registro.pushManager.getSubscription()
  if (!sub) return
  await notificacionesApi.cancelarSuscripcion(sub.endpoint).catch(() => {})
  await sub.unsubscribe()
}
