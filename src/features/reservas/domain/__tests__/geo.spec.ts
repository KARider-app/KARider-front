import { describe, expect, it } from 'vitest'
import {
  distanciaKm,
  enlaceGoogleMaps,
  enlaceWaze,
  minutosEstimados,
  textoDistancia,
  textoTiempo,
} from '../geo'

describe('geo (HU-08)', () => {
  it('la distancia entre el mismo punto es 0', () => {
    const p = { latitud: 20.05, longitud: -99.34 }
    expect(distanciaKm(p, p)).toBeCloseTo(0, 6)
  })

  it('un grado de latitud mide ~111 km', () => {
    const d = distanciaKm({ latitud: 20, longitud: -99 }, { latitud: 21, longitud: -99 })
    expect(d).toBeGreaterThan(110)
    expect(d).toBeLessThan(112)
  })

  it('estima minutos a 30 km/h y nunca baja de 1 si hay distancia', () => {
    expect(minutosEstimados(15)).toBe(30)
    expect(minutosEstimados(0.01)).toBe(1)
    expect(minutosEstimados(0)).toBe(0)
  })

  it('formatea distancia y tiempo', () => {
    expect(textoDistancia(0.45)).toBe('450 m')
    expect(textoDistancia(3.26)).toBe('3.3 km')
    expect(textoTiempo(0)).toBe('Llegando')
    expect(textoTiempo(25)).toBe('25 min')
    expect(textoTiempo(90)).toBe('1 h 30 min')
    expect(textoTiempo(120)).toBe('2 h')
  })

  it('arma el enlace de Google Maps con origen, paradas y destino', () => {
    const url = new URL(
      enlaceGoogleMaps(
        { latitud: 20.0875, longitud: -99.348 },
        { latitud: 20.0539, longitud: -99.3412 },
        [{ latitud: 20.07, longitud: -99.345 }],
      ),
    )
    expect(url.origin + url.pathname).toBe('https://www.google.com/maps/dir/')
    expect(url.searchParams.get('origin')).toBe('20.087500,-99.348000')
    expect(url.searchParams.get('destination')).toBe('20.053900,-99.341200')
    expect(url.searchParams.get('waypoints')).toBe('20.070000,-99.345000')
    expect(url.searchParams.get('travelmode')).toBe('driving')
  })

  it('sin destino, Google Maps lleva al punto de encuentro', () => {
    const url = new URL(enlaceGoogleMaps({ latitud: 20.0875, longitud: -99.348 }))
    expect(url.searchParams.get('destination')).toBe('20.087500,-99.348000')
    expect(url.searchParams.has('origin')).toBe(false)
    expect(url.searchParams.has('waypoints')).toBe(false)
  })

  it('arma el enlace de navegación de Waze', () => {
    expect(enlaceWaze({ latitud: 20.0875, longitud: -99.348 })).toBe(
      'https://waze.com/ul?ll=20.087500%2C-99.348000&navigate=yes',
    )
  })
})
