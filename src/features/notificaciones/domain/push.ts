/** HU-13: datos que manda el backend en cada notificación push (ver PushMessage en KARider-back). */
export interface PayloadPush {
  titulo: string
  mensaje: string
  tipo: string
  viajeId?: string | null
  reservaId?: string | null
}

/** A qué pantalla llevar al usuario si toca la notificación. */
export function urlDestino(payload: PayloadPush): string {
  if (payload.reservaId) return `/reservas/${payload.reservaId}/mapa`
  if (payload.viajeId) return `/viajes/${payload.viajeId}`
  return '/'
}

/** De las pestañas abiertas, la que ya muestra `url` (o null si hay que abrir una nueva). */
export function pestanaParaEnfocar<T extends { url: string }>(
  pestanas: readonly T[],
  url: string,
): T | null {
  return pestanas.find((p) => new URL(p.url).pathname === url) ?? null
}
