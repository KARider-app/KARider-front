/** Máximo de asientos por reserva (regla de negocio HU-07; igual que `Reserva.MaximoAsientosPorReserva` en la API). */
export const MAX_ASIENTOS_POR_RESERVA = 2

/** Cuántos asientos puede apartar el pasajero en esta operación según el cupo restante. */
export function maximoReservable(disponibles: number): number {
  if (!Number.isFinite(disponibles) || disponibles <= 0) return 0
  return Math.min(MAX_ASIENTOS_POR_RESERVA, Math.floor(disponibles))
}

/** Mensaje para el caso «pide más asientos de los que quedan»; se valida antes de llamar a la API. */
export function mensajeSinCupo(disponibles: number): string {
  if (disponibles <= 0) return 'Ya no hay asientos disponibles'
  if (disponibles === 1) return 'Solo queda 1 asiento disponible'
  return `Solo quedan ${disponibles} asientos disponibles`
}

/** `null` si la solicitud es válida; si no, el mensaje que se muestra al pasajero. */
export function validarAsientos(solicitados: number, disponibles: number): string | null {
  if (!Number.isInteger(solicitados) || solicitados < 1 || solicitados > MAX_ASIENTOS_POR_RESERVA) {
    return `Puedes apartar entre 1 y ${MAX_ASIENTOS_POR_RESERVA} asientos por reserva.`
  }
  if (solicitados > disponibles) return mensajeSinCupo(disponibles)
  return null
}

/** Monto estimado que se muestra en pantalla; el monto real lo calcula siempre la API. */
export function montoEstimado(aportePorAsiento: number, asientos: number): number {
  return Math.round(aportePorAsiento * asientos * 100) / 100
}
