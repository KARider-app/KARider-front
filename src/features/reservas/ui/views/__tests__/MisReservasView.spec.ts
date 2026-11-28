import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  errorApi,
  instalarApiFalsa,
  montar,
  pagina,
  reserva,
  viajeResumen,
} from '@/__tests__/apoyo/montaje'
import { flushPromises } from '@vue/test-utils'
import { useAuthStore } from '@/features/auth/application/useAuthStore'
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

  it('HU-15: sin conexión, muestra las reservas guardadas de una carga anterior', async () => {
    instalarApiFalsa([['/reservas', pagina([reserva()])]])
    await abrir('Pasajero')

    instalarApiFalsa([['/reservas', errorApi(0, 'SIN_CONEXION')]])
    const { wrapper } = await abrir('Pasajero')
    expect(wrapper.text()).toContain(
      'Sin conexión. Mostrando tus reservas confirmadas guardadas en este dispositivo.',
    )
    expect(wrapper.text()).toContain('KAR-UTTT-2026-9874')
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

  it('HU-24: solo muestra rutas activas agrupadas por día; las pasadas van al historial', async () => {
    const haceDosDias = new Date(Date.now() - 2 * 86_400_000).toISOString()
    const haceUnaHora = new Date(Date.now() - 3_600_000).toISOString()
    instalarApiFalsa([
      [
        '/viajes/publicados',
        pagina([
          viajeResumen('v1', { destino: 'Mañana a Pachuca' }),
          viajeResumen('v2', { estado: 'EnCurso', destino: 'En curso a Tula' }),
          viajeResumen('v3', { fechaSalida: haceUnaHora, destino: 'Sin iniciar' }),
          viajeResumen('v4', { fechaSalida: haceDosDias, destino: 'Vencida' }),
          viajeResumen('v5', { estado: 'Completado', destino: 'Completada' }),
          viajeResumen('v6', { estado: 'Cancelado', destino: 'Cancelada' }),
        ]),
      ],
    ])
    const { wrapper } = await abrir('Conductor')

    const titulos = wrapper.findAll('section h2').map((h) => h.text())
    expect(titulos[0]).toBe('En curso')
    expect(titulos.some((t) => t.startsWith('Mañana'))).toBe(true)
    const texto = wrapper.text()
    expect(texto).toContain('En curso a Tula')
    expect(texto).toContain('Mañana a Pachuca')
    expect(texto).toContain('Sin iniciar')
    expect(texto).toContain('Ya es hora de salir: entra para iniciar el viaje.')
    expect(texto).not.toContain('Vencida')
    expect(texto).not.toContain('Completada')
    expect(texto).not.toContain('Cancelada')
    const historial = wrapper.findAll('a').find((a) => a.text().includes('Historial de viajes'))!
    expect(historial.text()).toContain('Tus 3 rutas pasadas están en Perfil › Historial de viajes')
    expect(historial.attributes('href')).toBe('/perfil')
  })

  it('HU-24: si todas sus rutas ya pasaron, invita a publicar y enlaza al historial', async () => {
    instalarApiFalsa([
      ['/viajes/publicados', pagina([viajeResumen('v1', { estado: 'Completado' })])],
    ])
    const { wrapper } = await abrir('Conductor')

    expect(wrapper.text()).toContain('No tienes rutas por salir')
    expect(wrapper.text()).toContain('Publicar una ruta')
    expect(wrapper.text()).toContain('Tu ruta pasada está en Perfil › Historial de viajes')
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

  it('HU-17: un conductor en modo pasajero ve sus reservas y al cambiar de modo ve sus rutas', async () => {
    instalarApiFalsa([
      ['/reservas', pagina([reserva()])],
      ['/viajes/publicados', pagina([])],
    ])
    const { wrapper } = await montar(MisReservasView, {
      ruta: '/reservas',
      nombre: 'mis-reservas',
      rol: 'Conductor',
      modo: 'Pasajero',
    })
    expect(wrapper.text()).toContain('Mis reservas')
    expect(wrapper.text()).toContain('KAR-UTTT-2026-9874')

    useAuthStore().cambiarModo('Conductor')
    await flushPromises()

    expect(wrapper.text()).toContain('Mapa de mis rutas')
  })
})
