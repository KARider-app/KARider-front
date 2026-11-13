import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, type VueWrapper } from '@vue/test-utils'
import {
  errorApi,
  instalarApiFalsa,
  montar,
  punto,
  reserva,
  type MapaApi,
} from '@/__tests__/apoyo/montaje'
import MapaReservaView from '../MapaReservaView.vue'

const ubicacion = {
  latitud: 20.05,
  longitud: -99.2,
  actualizadaEn: new Date().toISOString(),
  estadoViaje: 'EnCurso',
  puntoEncuentro: punto,
}

const base = (extra: MapaApi = []): MapaApi => [
  ...extra,
  ['/reservas/r1', reserva()],
  ['/viajes/v1/ubicacion', ubicacion],
  ['/viajes/v1', { destino: 'Pachuca', destinoLatitud: 20.1, destinoLongitud: -98.75 }],
]

let actual: VueWrapper | null = null
async function abrir() {
  const r = await montar(MapaReservaView, {
    ruta: '/reservas/r1/mapa',
    nombre: 'mapa-reserva',
    rol: 'Pasajero',
    stubs: { MapaRuta: { template: '<div class="mapa-falso" />' } },
  })
  actual = r.wrapper
  return r
}

describe('MapaReservaView (HU-08)', () => {
  afterEach(() => {
    actual?.unmount()
    actual = null
    vi.restoreAllMocks()
    document.body.innerHTML = ''
  })

  it('muestra la reserva confirmada, el mapa y la llegada estimada', async () => {
    instalarApiFalsa(base())
    const { wrapper } = await abrir()
    const texto = wrapper.text()
    expect(wrapper.find('.mapa-falso').exists()).toBe(true)
    expect(texto).toContain('¡Reserva Confirmada!')
    expect(texto).toContain('KAR-UTTT-2026-9874')
    expect(texto).toContain('GPS En Vivo')
    expect(texto).toContain('Conductor en camino:')
    expect(texto).toContain('Puerta Principal (Torniquetes A)')
    expect(texto).toContain('HNX-421-C')
    expect(texto).toContain('Enviar Mensaje')
  })

  it('copia el folio y avisa con un toast', async () => {
    const writeText = vi.fn<(texto: string) => Promise<void>>(() => Promise.resolve())
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    instalarApiFalsa(base())
    const { wrapper } = await abrir()
    await wrapper.get('button[aria-label^="Copiar folio"]').trigger('click')
    await flushPromises()
    expect(writeText).toHaveBeenCalledWith('KAR-UTTT-2026-9874')
    expect(wrapper.text()).toContain('Folio copiado')
  })

  it('avisa si no pudo copiar el folio', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: () => Promise.reject(new Error('sin permiso')) },
      configurable: true,
    })
    instalarApiFalsa(base())
    const { wrapper } = await abrir()
    await wrapper.get('button[aria-label^="Copiar folio"]').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('No pudimos copiarlo')
  })

  it('espera la ubicación cuando el conductor aún no la comparte', async () => {
    instalarApiFalsa(
      base([['/viajes/v1/ubicacion', errorApi(404, 'VIAJE_UBICACION_NO_DISPONIBLE')]]),
    )
    const { wrapper } = await abrir()
    expect(wrapper.text()).toContain('Esperando la ubicación del conductor.')
  })

  it('explica el estado de una reserva pendiente', async () => {
    instalarApiFalsa(base([['/reservas/r1', reserva({ estado: 'Pendiente' })]]))
    const { wrapper } = await abrir()
    expect(wrapper.text()).toContain('Tu solicitud está pendiente')
    expect(wrapper.text()).toContain('Reserva Pendiente')
  })

  it('avisa cuando el viaje ya terminó', async () => {
    const terminada = reserva()
    ;(terminada.viaje as { estado: string }).estado = 'Completado'
    instalarApiFalsa(base([['/reservas/r1', terminada]]))
    const { wrapper } = await abrir()
    expect(wrapper.text()).toContain('El viaje ya terminó o fue cancelado')
  })

  it.each([
    ['Rechazada', 'El conductor no aceptó tu solicitud.'],
    ['Cancelada', 'Esta reserva fue cancelada.'],
    ['Completada', 'Este viaje ya se completó.'],
  ])('describe la reserva %s', async (estado, mensaje) => {
    instalarApiFalsa(base([['/reservas/r1', reserva({ estado })]]))
    const { wrapper } = await abrir()
    expect(wrapper.text()).toContain(mensaje)
  })

  it('muestra el error si la reserva no existe', async () => {
    instalarApiFalsa([['/reservas/r1', errorApi(404, 'RESERVA_NO_ENCONTRADA')]])
    const { wrapper } = await abrir()
    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
  })
})
