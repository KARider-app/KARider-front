import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, ref } from 'vue'
import { errorApi, instalarApiFalsa } from '@/__tests__/apoyo/montaje'
import { apiClient } from '@/core/http/apiClient'
import DestinoEnMapa from '../DestinoEnMapa.vue'

const tulaCentro = {
  nombre: 'Centro',
  direccion: 'Centro, Tula, Tula de Allende, Hidalgo, 42800',
  latitud: 20.0539,
  longitud: -99.3412,
}
const plazaTula = {
  nombre: 'Plaza Jardines de Tula',
  direccion: 'Plaza Jardines de Tula, Tula de Allende, Hidalgo',
  latitud: 20.06,
  longitud: -99.33,
}

/** Monta el buscador dentro de un formulario, con sus tres v-model como en las vistas. */
function montar(
  inicial: { destino?: string; latitud?: number | null; longitud?: number | null } = {},
) {
  const enviado = vi.fn<() => void>()
  const Contenedor = defineComponent({
    components: { DestinoEnMapa },
    setup() {
      const destino = ref(inicial.destino ?? '')
      const latitud = ref<number | null>(inicial.latitud ?? null)
      const longitud = ref<number | null>(inicial.longitud ?? null)
      return { destino, latitud, longitud, enviado }
    },
    template: `
      <form @submit.prevent="enviado">
        <DestinoEnMapa
          v-model:destino="destino"
          v-model:latitud="latitud"
          v-model:longitud="longitud"
          etiqueta="Destino Final *"
        />
      </form>`,
  })
  const wrapper = mount(Contenedor, {
    global: {
      stubs: {
        // El mapa real (Leaflet) se prueba en SelectorPuntoMapa.spec; aquí basta simular un toque.
        SelectorPuntoMapa: {
          props: ['latitud', 'longitud'],
          emits: ['update:latitud', 'update:longitud', 'marcado'],
          template: `<button type="button" class="mapa-falso" :data-lat="latitud"
            @click="$emit('update:latitud', 20.0201); $emit('update:longitud', -99.3301); $emit('marcado')">mapa</button>`,
        },
      },
    },
  })
  const estado = wrapper.vm as unknown as {
    destino: string
    latitud: number | null
    longitud: number | null
  }
  const botonUbicar = () => wrapper.findAll('button').find((b) => b.text().includes('Buscar lugar'))
  return { wrapper, estado, enviado, botonUbicar }
}

describe('DestinoEnMapa (HU-22)', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('busca el texto, muestra las sugerencias y guarda las coordenadas del lugar elegido', async () => {
    instalarApiFalsa([['/mapas/lugares', [tulaCentro, plazaTula]]])
    const { wrapper, estado, botonUbicar } = montar()

    await wrapper.get('input').setValue('  Tula Centro ')
    await botonUbicar()!.trigger('click')
    await flushPromises()

    expect(apiClient.get).toHaveBeenCalledWith('/mapas/lugares', {
      params: { texto: 'Tula Centro' },
    })
    expect(wrapper.text()).toContain('Elige el lugar exacto de «Tula Centro»')
    const opciones = wrapper.findAll('button.lugar')
    expect(opciones).toHaveLength(2)
    expect(opciones[1]!.text()).toContain('Plaza Jardines de Tula')

    await opciones[1]!.trigger('click')

    expect(estado.latitud).toBe(20.06)
    expect(estado.longitud).toBe(-99.33)
    // El texto que verán los pasajeros es el que escribió el conductor.
    expect(estado.destino).toBe('  Tula Centro ')
    expect(wrapper.text()).toContain('Ubicado en el mapa')
    expect(wrapper.text()).toContain(plazaTula.direccion)
    expect(wrapper.findAll('button.lugar')).toHaveLength(0)
  })

  it('Enter busca en el mapa en lugar de enviar el formulario', async () => {
    instalarApiFalsa([['/mapas/lugares', [tulaCentro]]])
    const { wrapper, enviado } = montar({ destino: 'Tula Centro' })

    await wrapper.get('input').trigger('keydown', { key: 'Enter' })
    await flushPromises()

    expect(apiClient.get).toHaveBeenCalledTimes(1)
    expect(enviado).not.toHaveBeenCalled()
    expect(wrapper.findAll('button.lugar')).toHaveLength(1)
  })

  it('con menos de 3 letras no busca', async () => {
    instalarApiFalsa([['/mapas/lugares', [tulaCentro]]])
    const { wrapper, botonUbicar } = montar({ destino: 'Tu' })

    expect(botonUbicar()!.attributes('disabled')).toBeDefined()
    await wrapper.get('input').trigger('keydown', { key: 'Enter' })
    await flushPromises()

    expect(apiClient.get).not.toHaveBeenCalled()
  })

  it('cambiar el texto después de elegir quita la ubicación, porque ya no corresponde', async () => {
    instalarApiFalsa([['/mapas/lugares', [tulaCentro]]])
    const { wrapper, estado, botonUbicar } = montar({ destino: 'Tula Centro' })
    await botonUbicar()!.trigger('click')
    await flushPromises()
    await wrapper.get('button.lugar').trigger('click')
    expect(estado.latitud).toBe(20.0539)

    await wrapper.get('input').setValue('Tepeji del Río')

    expect(estado.latitud).toBeNull()
    expect(estado.longitud).toBeNull()
    expect(wrapper.text()).not.toContain('Ubicado en el mapa')
    expect(botonUbicar()).toBeDefined()
  })

  it('al editar un viaje ya ubicado lo muestra así y «Buscar otro» busca de nuevo', async () => {
    instalarApiFalsa([['/mapas/lugares', [tulaCentro, plazaTula]]])
    const { wrapper, estado } = montar({ destino: 'Tula Centro', latitud: 20.05, longitud: -99.34 })

    expect(wrapper.text()).toContain('Ubicado en el mapa')
    expect(wrapper.text()).toContain('La ruta se dibuja con este lugar.')

    const cambiar = wrapper.findAll('button').find((b) => b.text() === 'Buscar otro')!
    await cambiar.trigger('click')
    await flushPromises()

    expect(estado.latitud).toBeNull()
    expect(wrapper.findAll('button.lugar')).toHaveLength(2)
  })

  it('avisa cuando el lugar no existe en el mapa', async () => {
    instalarApiFalsa([['/mapas/lugares', []]])
    const { wrapper, botonUbicar } = montar({ destino: 'Pachuca / Tula' })

    await botonUbicar()!.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('No encontramos «Pachuca / Tula» cerca del campus')
  })

  it('si el mapa no responde deja continuar sin ubicar', async () => {
    instalarApiFalsa([['/mapas/lugares', errorApi(503, 'SERVICIO_NO_DISPONIBLE')]])
    const { wrapper, estado, botonUbicar } = montar({ destino: 'Tula Centro' })

    await botonUbicar()!.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('No pudimos consultar la búsqueda.')
    expect(estado.latitud).toBeNull()
  })

  it('descarta la respuesta si el texto cambió mientras se buscaba', async () => {
    let responder: (v: unknown) => void = () => {}
    vi.spyOn(apiClient, 'get').mockImplementation(
      () => new Promise((r) => (responder = (v) => r({ data: v }))) as never,
    )
    const { wrapper, botonUbicar } = montar({ destino: 'Tula Centro' })

    await botonUbicar()!.trigger('click')
    expect(wrapper.text()).toContain('Buscando…')
    await wrapper.get('input').setValue('Tepeji del Río')
    responder([tulaCentro])
    await flushPromises()

    expect(wrapper.findAll('button.lugar')).toHaveLength(0)
    expect(wrapper.text()).not.toContain('Buscando…')
    expect(wrapper.text()).toContain('Buscar lugar')
  })

  it('«Marcar en el mapa» abre el mapa y el punto tocado queda como destino', async () => {
    const { wrapper, estado } = montar({ destino: 'Infonavit El Cerrito' })
    expect(wrapper.find('.mapa-falso').exists()).toBe(false)

    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Marcar en el mapa')!
      .trigger('click')
    await wrapper.get('.mapa-falso').trigger('click')

    expect(estado.latitud).toBe(20.0201)
    expect(estado.longitud).toBe(-99.3301)
    expect(wrapper.text()).toContain('Punto que marcaste en el mapa.')
    expect(wrapper.text()).not.toContain('Marcar en el mapa')
  })

  it('un punto marcado a mano se conserva aunque se corrija el texto', async () => {
    const { wrapper, estado } = montar({ destino: 'Infonavit El Cerito' })
    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Marcar en el mapa')!
      .trigger('click')
    await wrapper.get('.mapa-falso').trigger('click')

    await wrapper.get('input').setValue('Infonavit El Cerrito')

    expect(estado.latitud).toBe(20.0201)
    expect(wrapper.text()).toContain('Ubicado en el mapa')
  })

  it('al elegir una sugerencia muestra el pin para confirmarla o ajustarla', async () => {
    instalarApiFalsa([['/mapas/lugares', [tulaCentro]]])
    const { wrapper, botonUbicar } = montar({ destino: 'Tula Centro' })
    await botonUbicar()!.trigger('click')
    await flushPromises()

    await wrapper.get('button.lugar').trigger('click')

    expect(wrapper.get('.mapa-falso').attributes('data-lat')).toBe('20.0539')
  })

  it.each([
    [[] as unknown, 'No encontramos'],
    [errorApi(503, 'SERVICIO_NO_DISPONIBLE'), 'No pudimos consultar'],
    [[tulaCentro], '¿No está tu lugar?'],
  ])('si la búsqueda no sirve, ofrece marcarlo en el mapa (%#)', async (respuesta, mensaje) => {
    instalarApiFalsa([['/mapas/lugares', respuesta]])
    const { wrapper, botonUbicar } = montar({ destino: 'Infonavit El Cerrito' })
    await botonUbicar()!.trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain(mensaje)

    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Márcalo en el mapa')!
      .trigger('click')

    expect(wrapper.find('.mapa-falso').exists()).toBe(true)
  })

  it('«Ver en el mapa» muestra la ubicación guardada de un viaje', async () => {
    const { wrapper } = montar({ destino: 'Tula Centro', latitud: 20.05, longitud: -99.34 })

    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Ver en el mapa')!
      .trigger('click')

    expect(wrapper.get('.mapa-falso').attributes('data-lat')).toBe('20.05')
  })
})
