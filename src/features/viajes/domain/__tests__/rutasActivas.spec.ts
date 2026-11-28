import { describe, expect, it } from 'vitest'
import {
  HORAS_GRACIA_SALIDA,
  agruparRutasActivas,
  esRutaActiva,
  tituloDelDia,
  yaEsHoraDeSalir,
} from '../rutasActivas'
import type { EstadoViaje, ViajeResumen } from '../tipos'

// Sábado 28 nov 2026, 12:00 en Ciudad de México (UTC-6).
const AHORA = new Date('2026-11-28T18:00:00Z')

function ruta(id: string, fechaSalida: string, estado: EstadoViaje = 'Programado') {
  return { id, fechaSalida, estado } as ViajeResumen
}

describe('esRutaActiva (HU-24)', () => {
  it('una ruta en curso siempre está activa', () => {
    expect(esRutaActiva(ruta('a', '2026-11-20T10:00:00Z', 'EnCurso'), AHORA)).toBe(true)
  })

  it(`una programada sigue activa hasta ${HORAS_GRACIA_SALIDA} h después de su salida`, () => {
    expect(esRutaActiva(ruta('a', '2026-11-29T13:00:00Z'), AHORA)).toBe(true) // mañana
    expect(esRutaActiva(ruta('b', '2026-11-28T16:00:00Z'), AHORA)).toBe(true) // hace 2 h
    expect(esRutaActiva(ruta('c', '2026-11-28T15:00:00Z'), AHORA)).toBe(true) // justo 3 h
    expect(esRutaActiva(ruta('d', '2026-11-28T14:00:00Z'), AHORA)).toBe(false) // hace 4 h
  })

  it.each<EstadoViaje>(['Completado', 'Cancelado', 'Borrador'])(
    'una ruta %s no está activa',
    (estado) => {
      expect(esRutaActiva(ruta('a', '2026-11-29T13:00:00Z', estado), AHORA)).toBe(false)
    },
  )
})

describe('yaEsHoraDeSalir (HU-24)', () => {
  it('solo cuando una programada ya pasó su hora', () => {
    expect(yaEsHoraDeSalir(ruta('a', '2026-11-28T16:00:00Z'), AHORA)).toBe(true)
    expect(yaEsHoraDeSalir(ruta('b', '2026-11-28T20:00:00Z'), AHORA)).toBe(false)
    expect(yaEsHoraDeSalir(ruta('c', '2026-11-28T16:00:00Z', 'EnCurso'), AHORA)).toBe(false)
  })
})

describe('tituloDelDia (HU-24)', () => {
  it('usa Hoy, Mañana, Ayer o el día corto en la zona horaria de la app', () => {
    expect(tituloDelDia('2026-11-28T20:00:00Z', AHORA)).toBe('Hoy')
    expect(tituloDelDia('2026-11-29T13:00:00Z', AHORA)).toBe('Mañana · dom 29 nov')
    expect(tituloDelDia('2026-12-01T15:00:00Z', AHORA)).toBe('mar 1 dic')
    // 23:30 del viernes en CDMX, consultado a la 1:00 del sábado.
    expect(tituloDelDia('2026-11-28T05:30:00Z', new Date('2026-11-28T07:00:00Z'))).toBe('Ayer')
  })
})

describe('agruparRutasActivas (HU-24)', () => {
  it('en curso primero, luego por día de la más próxima a la más lejana, sin las pasadas', () => {
    const grupos = agruparRutasActivas(
      [
        ruta('dic', '2026-12-01T15:00:00Z'),
        ruta('hoy-tarde', '2026-11-28T23:00:00Z'),
        ruta('completada', '2026-11-27T15:00:00Z', 'Completado'),
        ruta('vencida', '2026-11-26T15:00:00Z'),
        ruta('manana', '2026-11-29T13:00:00Z'),
        ruta('hoy-temprano', '2026-11-28T16:00:00Z'),
        ruta('en-curso', '2026-11-28T17:30:00Z', 'EnCurso'),
        ruta('cancelada', '2026-11-30T15:00:00Z', 'Cancelado'),
      ],
      AHORA,
    )

    expect(grupos.map((g) => g.titulo)).toEqual([
      'En curso',
      'Hoy',
      'Mañana · dom 29 nov',
      'mar 1 dic',
    ])
    expect(grupos.map((g) => g.rutas.map((r) => r.id))).toEqual([
      ['en-curso'],
      ['hoy-temprano', 'hoy-tarde'],
      ['manana'],
      ['dic'],
    ])
  })

  it('sin rutas activas no hay grupos', () => {
    expect(agruparRutasActivas([ruta('x', '2026-11-20T10:00:00Z', 'Completado')], AHORA)).toEqual(
      [],
    )
  })
})
