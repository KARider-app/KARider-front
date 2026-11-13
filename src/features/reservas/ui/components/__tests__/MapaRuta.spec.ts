import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

/** Registro de lo que el componente pide dibujar a Leaflet. */
const dibujo = vi.hoisted(() => ({
  lineas: [] as { puntos: unknown; opciones: Record<string, unknown> }[],
  marcadores: [] as { titulo: string; html: string }[],
  vistas: [] as unknown[],
  encuadres: 0,
  invalidaciones: 0,
  eliminado: false,
}))

vi.mock('leaflet', () => {
  const capa = { clearLayers: vi.fn<() => void>(), addTo: () => capa }
  const conAddTo = <T extends object>(o: T) => Object.assign(o, { addTo: () => o })
  return {
    map: () => ({
      setView: (centro: unknown) => dibujo.vistas.push(centro),
      fitBounds: () => dibujo.encuadres++,
      invalidateSize: () => dibujo.invalidaciones++,
      remove: () => (dibujo.eliminado = true),
    }),
    control: { zoom: () => conAddTo({}) },
    tileLayer: () => conAddTo({}),
    layerGroup: () => capa,
    divIcon: (o: { html: string }) => o,
    latLngBounds: (p: unknown) => p,
    polyline: (puntos: unknown, opciones: Record<string, unknown>) => {
      dibujo.lineas.push({ puntos, opciones })
      return conAddTo({})
    },
    marker: (_: unknown, o: { title: string; icon: { html: string } }) => {
      dibujo.marcadores.push({ titulo: o.title, html: o.icon.html })
      return conAddTo({ bindTooltip: vi.fn<() => void>() })
    },
  }
})

import MapaRuta from '../MapaRuta.vue'

const encuentro = { latitud: 20.0875, longitud: -99.348, etiqueta: 'Puerta Principal' }
const destino = { latitud: 20.0539, longitud: -99.3412, etiqueta: 'Tula Centro' }
const trazo: [number, number][] = [
  [20.0875, -99.348],
  [20.07, -99.345],
  [20.0539, -99.3412],
]

function reiniciar() {
  dibujo.lineas = []
  dibujo.marcadores = []
  dibujo.vistas = []
  dibujo.encuadres = 0
  dibujo.invalidaciones = 0
  dibujo.eliminado = false
}

describe('MapaRuta (HU-08)', () => {
  let observadores: { callback: () => void; desconectado: boolean }[]

  beforeEach(() => {
    reiniciar()
    observadores = []
    vi.stubGlobal(
      'ResizeObserver',
      class {
        private registro: { callback: () => void; desconectado: boolean }
        constructor(callback: () => void) {
          this.registro = { callback, desconectado: false }
          observadores.push(this.registro)
        }
        observe() {}
        disconnect() {
          this.registro.desconectado = true
        }
      },
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('dibuja la ruta por calles con borde y relleno, y los marcadores del itinerario', () => {
    mount(MapaRuta, {
      props: {
        puntoEncuentro: encuentro,
        destino,
        paradas: [{ latitud: 20.07, longitud: -99.345, etiqueta: 'Parada 1' }],
        trazo,
      },
    })

    expect(dibujo.lineas).toHaveLength(2)
    expect(dibujo.lineas[0]!.opciones.color).toBe('#1e3a8a')
    expect(dibujo.lineas[1]!.opciones.color).toBe('#2563eb')
    expect(dibujo.lineas[1]!.puntos).toEqual(trazo)
    expect(dibujo.marcadores.map((m) => m.titulo)).toEqual([
      'Parada 1',
      'Puerta Principal',
      'Tula Centro',
    ])
    expect(dibujo.marcadores[0]!.html).toContain('kar-marcador__punto--parada')
    expect(dibujo.encuadres).toBe(1)
  })

  it('sin ruta por calles traza una línea punteada de referencia', () => {
    mount(MapaRuta, { props: { puntoEncuentro: encuentro, destino } })

    const linea = dibujo.lineas[0]!
    expect(dibujo.lineas).toHaveLength(1)
    expect(linea.opciones.dashArray).toBe('8 8')
  })

  it('con solo el punto de encuentro centra el mapa en él', () => {
    mount(MapaRuta, { props: { puntoEncuentro: encuentro } })

    expect(dibujo.lineas).toHaveLength(0)
    expect(dibujo.vistas).toEqual([[20.0875, -99.348]])
  })

  it('muestra al conductor con su camino y reencuadra solo cuando aparece', async () => {
    const wrapper = mount(MapaRuta, { props: { puntoEncuentro: encuentro, destino, trazo } })
    expect(dibujo.encuadres).toBe(1)

    const conductor = { latitud: 20.06, longitud: -99.34, etiqueta: 'Conductor' }
    const camino: [number, number][] = [
      [20.06, -99.34],
      [20.0875, -99.348],
    ]
    await wrapper.setProps({ conductor, trazoConductor: camino })
    await nextTick()

    const linea = dibujo.lineas.find((l) => l.opciones.color === '#059669')
    expect(linea?.puntos).toEqual(camino)
    expect(dibujo.marcadores.some((m) => m.html.includes('conductor'))).toBe(true)
    expect(dibujo.encuadres).toBe(2)

    // Si el conductor solo se mueve, se respeta el zoom elegido por el usuario.
    await wrapper.setProps({ conductor: { ...conductor, latitud: 20.065 } })
    await nextTick()
    expect(dibujo.encuadres).toBe(2)
  })

  it('recalcula el tamaño al redimensionarse y libera el mapa al desmontarse', () => {
    const wrapper = mount(MapaRuta, { props: { puntoEncuentro: encuentro, compacto: true } })
    expect(wrapper.classes()).toContain('h-[240px]')

    observadores[0]!.callback()
    expect(dibujo.invalidaciones).toBe(1)

    wrapper.unmount()
    expect(observadores[0]!.desconectado).toBe(true)
    expect(dibujo.eliminado).toBe(true)
  })
})
