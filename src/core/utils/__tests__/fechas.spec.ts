import { describe, expect, it } from 'vitest'
import { aFechaYHoraLocal } from '../fechas'

describe('aFechaYHoraLocal (HU-09)', () => {
  it('separa un ISO en fecha y hora locales para los inputs del formulario', () => {
    const iso = new Date(2026, 11, 1, 20, 30).toISOString()

    const { fecha, hora } = aFechaYHoraLocal(iso)

    expect(fecha).toBe('2026-12-01')
    expect(hora).toBe('20:30')
  })

  it('rellena con ceros horas y minutos de un solo dígito', () => {
    const iso = new Date(2026, 0, 5, 7, 5).toISOString()

    const { fecha, hora } = aFechaYHoraLocal(iso)

    expect(fecha).toBe('2026-01-05')
    expect(hora).toBe('07:05')
  })
})
