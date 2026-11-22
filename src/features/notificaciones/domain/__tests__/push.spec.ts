import { describe, expect, it } from 'vitest'
import { pestanaParaEnfocar, urlDestino } from '../push'

describe('urlDestino (HU-13)', () => {
  it('con reservaId, lleva al mapa de la reserva', () => {
    expect(urlDestino({ titulo: '', mensaje: '', tipo: 'x', reservaId: 'r1' })).toBe(
      '/reservas/r1/mapa',
    )
  })

  it('sin reservaId pero con viajeId, lleva al detalle del viaje', () => {
    expect(urlDestino({ titulo: '', mensaje: '', tipo: 'x', viajeId: 'v1' })).toBe('/viajes/v1')
  })

  it('sin ids, lleva al inicio', () => {
    expect(urlDestino({ titulo: '', mensaje: '', tipo: 'x' })).toBe('/')
  })
})

describe('pestanaParaEnfocar (HU-13)', () => {
  it('encuentra la pestaña cuya ruta coincide', () => {
    const pestanas = [
      { url: 'https://karider.app/viajes/v1' },
      { url: 'https://karider.app/reservas/r1/mapa' },
    ]
    expect(pestanaParaEnfocar(pestanas, '/reservas/r1/mapa')).toBe(pestanas[1])
  })

  it('sin coincidencia exacta, reutiliza cualquier pestaña abierta (se navega ahí)', () => {
    const pestanas = [{ url: 'https://karider.app/perfil' }]
    expect(pestanaParaEnfocar(pestanas, '/reservas/r1/mapa')).toBe(pestanas[0])
  })

  it('sin ninguna pestaña abierta, devuelve null (hay que abrir una ventana nueva)', () => {
    expect(pestanaParaEnfocar([], '/reservas/r1/mapa')).toBeNull()
  })
})
