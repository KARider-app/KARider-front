import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import {
  INTERVALO_ACTUALIZACION_MS,
  useActualizacionAutomatica,
} from '../useActualizacionAutomatica'

function montarCon(accion: () => unknown) {
  return mount(
    defineComponent({
      setup() {
        useActualizacionAutomatica(accion)
        return () => h('div')
      },
    }),
  )
}

let visibilidad: DocumentVisibilityState = 'visible'
let enLinea = true

describe('useActualizacionAutomatica (HU-18)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    visibilidad = 'visible'
    enLinea = true
    vi.spyOn(document, 'visibilityState', 'get').mockImplementation(() => visibilidad)
    vi.spyOn(navigator, 'onLine', 'get').mockImplementation(() => enLinea)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('vuelve a consultar cada intervalo mientras la pantalla está visible', () => {
    const accion = vi.fn<() => void>()
    montarCon(accion)
    expect(accion).not.toHaveBeenCalled()

    vi.advanceTimersByTime(INTERVALO_ACTUALIZACION_MS)
    expect(accion).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(INTERVALO_ACTUALIZACION_MS)
    expect(accion).toHaveBeenCalledTimes(2)
  })

  it('no consulta con la pantalla oculta ni sin conexión', () => {
    const accion = vi.fn<() => void>()
    montarCon(accion)

    visibilidad = 'hidden'
    vi.advanceTimersByTime(INTERVALO_ACTUALIZACION_MS)
    visibilidad = 'visible'
    enLinea = false
    vi.advanceTimersByTime(INTERVALO_ACTUALIZACION_MS)

    expect(accion).not.toHaveBeenCalled()
  })

  it('consulta en cuanto la persona regresa a la app o recupera la conexión', () => {
    const accion = vi.fn<() => void>()
    montarCon(accion)
    vi.advanceTimersByTime(3_000)

    document.dispatchEvent(new Event('visibilitychange'))
    expect(accion).toHaveBeenCalledTimes(1)

    // «focus» justo después no repite la consulta.
    window.dispatchEvent(new Event('focus'))
    expect(accion).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(3_000)
    window.dispatchEvent(new Event('online'))
    expect(accion).toHaveBeenCalledTimes(2)
  })

  it('al ocultar la pantalla no consulta', () => {
    const accion = vi.fn<() => void>()
    montarCon(accion)
    vi.advanceTimersByTime(3_000)

    visibilidad = 'hidden'
    document.dispatchEvent(new Event('visibilitychange'))

    expect(accion).not.toHaveBeenCalled()
  })

  it('deja de consultar al salir de la pantalla', () => {
    const accion = vi.fn<() => void>()
    const wrapper = montarCon(accion)

    wrapper.unmount()
    vi.advanceTimersByTime(INTERVALO_ACTUALIZACION_MS * 3)
    window.dispatchEvent(new Event('focus'))

    expect(accion).not.toHaveBeenCalled()
  })
})
