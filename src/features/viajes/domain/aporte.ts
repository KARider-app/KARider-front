import type { ViajeDetalle } from './tipos'

/**
 * Misma regla que la API (HU-21): el gasto se divide SOLO entre los asientos ofrecidos a
 * pasajeros; el conductor no se cuenta. Ej. $150 con 3 asientos → 150 / 3 = $50 por asiento.
 * Es solo una vista previa: el valor oficial es el `aportePorAsiento` que devuelve la API.
 */
export function calcularAporte(gastoTotal: number, asientos: number): number {
  if (!Number.isFinite(gastoTotal) || asientos < 1 || gastoTotal <= 0) return 0
  return Math.round((gastoTotal / asientos + Number.EPSILON) * 100) / 100
}

/** P11/HU-09: solo el dueño puede editar, y solo mientras no haya arrancado el viaje. */
export function esEditable(viaje: Pick<ViajeDetalle, 'esPropietario' | 'estado'> | null): boolean {
  return !!viaje?.esPropietario && ['Borrador', 'Programado'].includes(viaje.estado)
}
