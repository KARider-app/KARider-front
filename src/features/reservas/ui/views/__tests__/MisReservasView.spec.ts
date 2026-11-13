import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  errorApi,
  instalarApiFalsa,
  montar,
  pagina,
  reserva,
  viajeResumen,
} from '@/__tests__/apoyo/montaje'
import MisReservasView from '../MisReservasView.vue'

const abrir = (rol: 'Pasajero' | 'Conductor') =>
  montar(MisReservasView, { ruta: '/reservas', nombre: 'mis-reservas', rol })

describe('MisReservasView', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    document.body.innerHTML = ''
  })

  it('el pasajero ve sus reservas con folio y estado', async () => {
    instalarApiFalsa([
      [
        '/reservas',
        pagina([reserva(), reserva({ id: 'r2', folio: 'KAR-2', estado: 'Pendiente' })]),
      ],
    ])
    const { wrapper } = await abrir('Pasajero')
    const texto = wrapper.text()
    expect(texto).toContain('Mis reservas')
    expect(texto).toContain('KAR-UTTT-2026-9874')
    expect(texto).toContain('Confirmada')
    expect(texto).toContain('Pendiente')
    expect(wrapper.find('a[href="/reservas/r1/mapa"]').exists()).toBe(true)
  })

  it('el pasajero sin reservas ve la invitación a buscar', async () => {
    instalarApiFalsa([['/reservas', pagina([])]])
    const { wrapper } = await abrir('Pasajero')
    expect(wrapper.text()).toContain('Aún no tienes reservas')
    expect(wrapper.text()).toContain('Buscar un viaje')
  })

  it('el pasajero ve el error de carga', async () => {
    instalarApiFalsa([['/reservas', errorApi(500, 'ERROR_SERVIDOR')]])
    const { wrapper } = await abrir('Pasajero')
    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
  })

  it('el conductor ve sus rutas publicadas (sin borradores)', async () => {
    instalarApiFalsa([
      [
        '/viajes/publicados',
        pagina([
          viajeResumen('v1'),
          viajeResumen('v2', { estado: 'EnCurso', destino: 'Tula Centro' }),
          viajeResumen('v3', { estado: 'Borrador', destino: 'Borrador oculto' }),
        ]),
      ],
    ])
    const { wrapper } = await abrir('Conductor')
    const texto = wrapper.text()
    expect(texto).toContain('Mapa de mis rutas')
    expect(texto).toContain('Programado')
    expect(texto).toContain('En curso')
    expect(texto).not.toContain('Borrador oculto')
  })

  it('el conductor sin rutas ve la invitación a publicar', async () => {
    instalarApiFalsa([['/viajes/publicados', pagina([])]])
    const { wrapper } = await abrir('Conductor')
    expect(wrapper.text()).toContain('Aún no tienes rutas publicadas')
  })

  it('el conductor ve el error de carga', async () => {
    instalarApiFalsa([['/viajes/publicados', errorApi(500, 'ERROR_SERVIDOR')]])
    const { wrapper } = await abrir('Conductor')
    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
  })
})
