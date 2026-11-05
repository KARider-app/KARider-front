import { describe, expect, it } from 'vitest'
import { calcularAporte, esEditable } from '../aporte'
import type { ViajeDetalle } from '../tipos'

describe('calcularAporte (HU-05)', () => {
  it('divide el gasto entre los asientos más el conductor', () => {
    expect(calcularAporte(160, 3)).toBe(40)
  })

  it('redondea a 2 decimales como la API', () => {
    expect(calcularAporte(100, 2)).toBe(33.33)
    expect(calcularAporte(0.05, 1)).toBe(0.03) // AwayFromZero
  })

  it('devuelve 0 si aún no hay datos válidos', () => {
    expect(calcularAporte(0, 3)).toBe(0)
    expect(calcularAporte(160, 0)).toBe(0)
    expect(calcularAporte(Number.NaN, 3)).toBe(0)
  })
})

describe('esEditable (HU-09)', () => {
  const viaje = (p: Partial<Pick<ViajeDetalle, 'esPropietario' | 'estado'>>) =>
    ({ esPropietario: true, estado: 'Programado', ...p }) as Pick<
      ViajeDetalle,
      'esPropietario' | 'estado'
    >

  it('permite editar un borrador o un viaje programado propio', () => {
    expect(esEditable(viaje({ estado: 'Borrador' }))).toBe(true)
    expect(esEditable(viaje({ estado: 'Programado' }))).toBe(true)
  })

  it('rechaza viajes que ya no se pueden modificar', () => {
    expect(esEditable(viaje({ estado: 'EnCurso' }))).toBe(false)
    expect(esEditable(viaje({ estado: 'Completado' }))).toBe(false)
    expect(esEditable(viaje({ estado: 'Cancelado' }))).toBe(false)
  })

  it('rechaza si el usuario no es el dueño del viaje', () => {
    expect(esEditable(viaje({ esPropietario: false }))).toBe(false)
  })

  it('rechaza cuando aún no hay viaje cargado', () => {
    expect(esEditable(null)).toBe(false)
  })
})
