import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, nextTick, ref } from 'vue'

type Manejador = (e?: unknown) => void

/** Registro de lo que el componente pide a Leaflet. */
const leaflet = vi.hoisted(() => ({
  vistas: [] as { centro: unknown; zoom: number }[],
  clicMapa: null as Manejador | null,
  pines: [] as {
    posicion: unknown
    opciones: Record<string, unknown>
    arrastrar: Manejador | null
    quitado: boolean
  }[],
  eliminado: false,
}))

vi.mock('leaflet', () => {
  const conAddTo = <T extends object>(o: T) => Object.assign(o, { addTo: () => o })
  return {
    map: () =>
      conAddTo({
        setView: (centro: unknown, zoom: number) => leaflet.vistas.push({ centro, zoom }),
        getZoom: () => 13,
        on: (evento: string, fn: Manejador) => {
          if (evento === 'click') leaflet.clicMapa = fn
        },
        invalidateSize: vi.fn<() => void>(),
        remove: () => (leaflet.eliminado = true),
      }),
    tileLayer: () => conAddTo({}),
    divIcon: (o: unknown) => o,
    marker: (posicion: unknown, opciones: Record<string, unknown>) => {
      const registro = {
        posicion,
        opciones,
        arrastrar: null as Manejador | null,
        quitado: false,
      }
      leaflet.pines.push(registro)
      const pin = {
        on: (evento: string, fn: Manejador) => {
          if (evento === 'dragend') registro.arrastrar = fn
        },
        setLatLng: (p: unknown) => (registro.posicion = p),
        getLatLng: () => ({ lat: 20.111111111, lng: -99.222222222 }),
        remove: () => (registro.quitado = true),
      }
      return conAddTo(pin)
    },
  }
})

import SelectorPuntoMapa from '../SelectorPuntoMapa.vue'

function montar(inicial: { latitud: number | null; longitud: number | null }) {
  const marcado = vi.fn<() => void>()
  const Contenedor = defineComponent({
    components: { SelectorPuntoMapa },
    setup() {
      const latitud = ref(inicial.latitud)
      const longitud = ref(inicial.longitud)
      return { latitud, longitud, marcado }
    },
    template: `<SelectorPuntoMapa v-model:latitud="latitud" v-model:longitud="longitud" @marcado="marcado" />`,
  })
  const wrapper = mount(Contenedor)
  const estado = wrapper.vm as unknown as { latitud: number | null; longitud: number | null }
  return { wrapper, estado, marcado }
}

describe('SelectorPuntoMapa (HU-22)', () => {
  beforeEach(() => {
    leaflet.vistas = []
    leaflet.clicMapa = null
    leaflet.pines = []
    leaflet.eliminado = false
  })

  it('sin punto abre centrado en la UTTT y sin pin', () => {
    montar({ latitud: null, longitud: null })

    expect(leaflet.vistas[0]).toEqual({ centro: [20.00997, -99.3425], zoom: 13 })
    expect(leaflet.pines).toHaveLength(0)
  })

  it('tocar el mapa marca el destino ahí, redondeado a 6 decimales', async () => {
    const { estado, marcado } = montar({ latitud: null, longitud: null })

    leaflet.clicMapa!({ latlng: { lat: 20.0201234567, lng: -99.3301234567 } })
    await nextTick()

    expect(estado.latitud).toBe(20.020123)
    expect(estado.longitud).toBe(-99.330123)
    expect(marcado).toHaveBeenCalledTimes(1)
    expect(leaflet.pines).toHaveLength(1)
    expect(leaflet.pines[0]!.opciones.draggable).toBe(true)
  })

  it('con un punto abre ahí, y arrastrar el pin lo mueve', async () => {
    const { estado, marcado } = montar({ latitud: 20.05, longitud: -99.34 })
    expect(leaflet.vistas[0]).toEqual({ centro: [20.05, -99.34], zoom: 16 })

    leaflet.pines[0]!.arrastrar!()
    await nextTick()

    expect(estado.latitud).toBe(20.111111)
    expect(estado.longitud).toBe(-99.222222)
    expect(marcado).toHaveBeenCalledTimes(1)
    expect(leaflet.pines).toHaveLength(1)
    expect(leaflet.pines[0]!.posicion).toEqual([20.111111, -99.222222])
  })

  it('si el punto cambia desde fuera, mueve el pin y centra el mapa; si se quita, quita el pin', async () => {
    const { estado } = montar({ latitud: 20.05, longitud: -99.34 })

    estado.latitud = 20.1
    estado.longitud = -98.75
    await nextTick()
    expect(leaflet.pines[0]!.posicion).toEqual([20.1, -98.75])
    expect(leaflet.vistas[leaflet.vistas.length - 1]).toEqual({ centro: [20.1, -98.75], zoom: 16 })

    estado.latitud = null
    estado.longitud = null
    await nextTick()
    expect(leaflet.pines[0]!.quitado).toBe(true)
  })

  it('libera el mapa al salir de la pantalla', () => {
    const { wrapper } = montar({ latitud: null, longitud: null })

    wrapper.unmount()

    expect(leaflet.eliminado).toBe(true)
  })
})
