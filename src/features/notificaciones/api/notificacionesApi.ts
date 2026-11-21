import { apiClient } from '@/core/http/apiClient'
import type { ClaveVapid, SuscripcionPushRequest } from '../domain/tipos'

export const notificacionesApi = {
  /** HU-13: clave pública VAPID para suscribirse al push (null si el servidor no la tiene configurada). */
  clavePublica: () =>
    apiClient.get<ClaveVapid>('/notificaciones/push/clave-publica').then((r) => r.data),
  suscribir: (p: SuscripcionPushRequest) =>
    apiClient.post('/notificaciones/push/suscripciones', p).then(() => undefined),
  cancelarSuscripcion: (endpoint: string) =>
    apiClient
      .post('/notificaciones/push/suscripciones/cancelar', { endpoint })
      .then(() => undefined),
}
