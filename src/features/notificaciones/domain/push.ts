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

/**
 * De las pestañas abiertas, cuál reutilizar: la que ya muestra `url` si existe, si no
 * cualquier otra (se navega ahí). Null solo si no hay ninguna pestaña abierta.
 *
 * Abrir una ventana nueva en vez de reutilizar una ya abierta pierde la sesión en memoria
 * (el access token y, si no se marcó «Recuérdame», también el refresh token de sessionStorage),
 * así que manda a la pantalla de login aunque el usuario ya estuviera autenticado.
 */
export function pestanaParaEnfocar<T extends { url: string }>(
  pestanas: readonly T[],
  url: string,
): T | null {
  return pestanas.find((p) => new URL(p.url).pathname === url) ?? pestanas[0] ?? null
}
