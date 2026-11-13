import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { errorApi, instalarApiFalsa } from '@/__tests__/apoyo/montaje'
import MapaRutaViaje from '../MapaRutaViaje.vue'

const ruta = {
  origen: { latitud: 20.0875, longitud: -99.348, nombre: 'Puerta Principal' },
  destino: { latitud: 20.0539, longitud: -99.3412, nombre: 'Tula Centro' },
  paradas: [],
  trazo: [
    [20.0875, -99.348],
    [20.0539, -99.3412],
  ],
  distanciaKm: 6.1,
  duracionMinutos: 8,
  porCalles: true,
}

async function abrir() {
  const wrapper = mount(MapaRutaViaje, {
    props: { viajeId: 'v1' },
    global: {
      stubs: {
        MapaRuta: {
          props: { trazo: Array, destino: Object, compacto: Boolean },
          template:
            '<div class="mapa-falso" :data-trazo="trazo.length" :data-destino="destino?.etiqueta" :data-compacto="compacto" />',
        },
      },
    },
  })
  await flushPromises()
  return wrapper
}

describe('MapaRutaViaje (HU-08 en el detalle del viaje)', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('muestra la ruta por calles con su distancia y tiempo', async () => {
    instalarApiFalsa([['/viajes/v1/ruta', ruta]])
    const wrapper = await abrir()
    const mapa = wrapper.get('.mapa-falso')
    expect(mapa.attributes('data-trazo')).toBe('2')
    expect(mapa.attributes('data-destino')).toBe('Tula Centro')
    expect(mapa.attributes('data-compacto')).toBe('true')
    expect(wrapper.text()).toContain('6.1 km · ~8 min')
    expect(wrapper.text()).toContain('Ruta por calles (OpenStreetMap).')
    expect(wrapper.get('a').attributes('href')).toContain('https://www.google.com/maps/dir/')
  })

  it.each([
    [{ ...ruta, destino: null, trazo: [] }, 'No pudimos ubicar el destino'],
    [{ ...ruta, porCalles: false }, 'Línea recta de referencia'],
  ])('explica cuando no hay ruta por calles (%#)', async (respuesta, mensaje) => {
    instalarApiFalsa([['/viajes/v1/ruta', respuesta]])
    const wrapper = await abrir()
    expect(wrapper.text()).toContain(mensaje)
  })

  it('si la ruta no carga, no ocupa espacio en la pantalla', async () => {
    instalarApiFalsa([['/viajes/v1/ruta', errorApi(500, 'ERROR_SERVIDOR')]])
    const wrapper = await abrir()
    expect(wrapper.find('section').exists()).toBe(false)
  })
})
