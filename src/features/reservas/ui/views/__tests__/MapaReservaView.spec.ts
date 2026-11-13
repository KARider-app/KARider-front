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

/** Ruta real por calles (HU-08). */
const ruta = {
  origen: { latitud: punto.latitud, longitud: punto.longitud, nombre: punto.nombre },
  destino: { latitud: 20.1, longitud: -98.75, nombre: 'Pachuca de Soto (Plaza Galerías)' },
  paradas: [{ latitud: 20.08, longitud: -99.1, nombre: 'Tepatepec' }],
  trazo: [
    [punto.latitud, punto.longitud],
    [20.08, -99.1],
    [20.1, -98.75],
  ],
  distanciaKm: 64.3,
  duracionMinutos: 58,
  porCalles: true,
}

const llegada = {
  objetivo: 'Destino',
  trazo: [
    [20.05, -99.2],
    [20.1, -98.75],
  ],
  distanciaKm: 12.4,
  duracionMinutos: 17,
  porCalles: true,
}

const base = (extra: MapaApi = []): MapaApi => [
  ...extra,
  ['/reservas/r1', reserva()],
  ['/viajes/v1/ubicacion', ubicacion],
  ['/viajes/v1/ruta', ruta],
  ['/viajes/v1/llegada', llegada],
]

let actual: VueWrapper | null = null
async function abrir() {
  const r = await montar(MapaReservaView, {
    ruta: '/reservas/r1/mapa',
    nombre: 'mapa-reserva',
    rol: 'Pasajero',
    stubs: {
      MapaRuta: {
        props: ['trazo', 'trazoConductor', 'paradas', 'destino'],
        template:
          '<div class="mapa-falso" :data-trazo="trazo?.length" :data-conductor="trazoConductor?.length" :data-paradas="paradas?.length" :data-destino="destino?.etiqueta" />',
      },
    },
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

  it('criterio 1: dibuja la ruta por calles y la llegada calculada por calles', async () => {
    instalarApiFalsa(base())
    const { wrapper } = await abrir()
    const mapa = wrapper.get('.mapa-falso')
    expect(mapa.attributes('data-trazo')).toBe('3')
    expect(mapa.attributes('data-conductor')).toBe('2')
    expect(mapa.attributes('data-paradas')).toBe('1')
    expect(mapa.attributes('data-destino')).toBe('Pachuca de Soto (Plaza Galerías)')
    const texto = wrapper.text()
    expect(texto).toContain('Llega al destino en ~17 min (12.4 km)')
    expect(texto).toContain('Tiempo y distancia calculados por calles')
    expect(texto).toContain('64.3 km · ~58 min')
    expect(texto).toContain('pasando por Tepatepec')
  })

  it('ofrece abrir la ruta en Google Maps y llegar al punto con Waze', async () => {
    instalarApiFalsa(base())
    const { wrapper } = await abrir()
    const google = wrapper.get('a[href^="https://www.google.com/maps/dir/"]')
    expect(google.text()).toContain('Abrir en Google Maps')
    expect(google.attributes('href')).toContain('waypoints=20.080000%2C-99.100000')
    expect(google.attributes('target')).toBe('_blank')
    expect(wrapper.get('a[href^="https://waze.com/ul"]').text()).toContain('Ir al punto con Waze')
  })

  it('con el viaje programado, la llegada es al punto de encuentro', async () => {
    instalarApiFalsa(base([['/viajes/v1/llegada', { ...llegada, objetivo: 'PuntoEncuentro' }]]))
    const { wrapper } = await abrir()
    expect(wrapper.text()).toContain('Llega al punto en ~17 min')
  })

  it('si el cálculo por calles falla, estima en línea recta', async () => {
    instalarApiFalsa(base([['/viajes/v1/llegada', errorApi(503, 'SIN_SERVICIO')]]))
    const { wrapper } = await abrir()
    expect(wrapper.text()).toContain('Estimación en línea recta a velocidad urbana.')
    expect(wrapper.get('.mapa-falso').attributes('data-conductor')).toBe('0')
  })

  it.each([
    [{ ...ruta, destino: null, trazo: [], distanciaKm: null }, 'No pudimos ubicar'],
    [{ ...ruta, porCalles: false, paradas: [] }, 'El servicio de rutas no respondió'],
  ])('explica cuando la ruta no es por calles (%#)', async (respuesta, mensaje) => {
    instalarApiFalsa(base([['/viajes/v1/ruta', respuesta]]))
    const { wrapper } = await abrir()
    expect(wrapper.text()).toContain(mensaje)
  })

  it('si la ruta no carga, el mapa sigue mostrando el punto de encuentro', async () => {
    instalarApiFalsa(base([['/viajes/v1/ruta', errorApi(500, 'ERROR_SERVIDOR')]]))
    const { wrapper } = await abrir()
    expect(wrapper.get('.mapa-falso').attributes('data-trazo')).toBe('0')
    expect(wrapper.text()).toContain('No pudimos cargar la ruta en este momento')
  })
})
