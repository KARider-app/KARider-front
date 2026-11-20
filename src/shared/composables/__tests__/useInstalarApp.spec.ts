import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { useInstalarApp } from '../useInstalarApp'

const Anfitrion = defineComponent({
  setup() {
    return useInstalarApp()
  },
  template: '<div />',
})

function eventoInstalacion() {
  const evento = new Event('beforeinstallprompt', { cancelable: true }) as Event & {
    prompt: () => Promise<void>
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
  }
  evento.prompt = vi.fn<() => Promise<void>>().mockResolvedValue(undefined)
  evento.userChoice = Promise.resolve({ outcome: 'accepted' })
  return evento
}

describe('useInstalarApp (HU-14)', () => {
  beforeEach(() => {
    localStorage.clear()
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('captura beforeinstallprompt y expone el botón de instalar', async () => {
    const wrapper = mount(Anfitrion)
    expect(wrapper.vm.puedeInstalar).toBe(false)

    window.dispatchEvent(eventoInstalacion())
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.puedeInstalar).toBe(true)
  })

  it('al instalar, llama prompt() y oculta el banner', async () => {
    const wrapper = mount(Anfitrion)
    const evento = eventoInstalacion()
    window.dispatchEvent(evento)
    await wrapper.vm.$nextTick()

    await wrapper.vm.instalar()

    expect(evento.prompt).toHaveBeenCalledTimes(1)
    expect(wrapper.vm.puedeInstalar).toBe(false)
  })

  it('appinstalled marca la app como instalada', async () => {
    const wrapper = mount(Anfitrion)
    window.dispatchEvent(eventoInstalacion())
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.puedeInstalar).toBe(true)

    window.dispatchEvent(new Event('appinstalled'))
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.instalada).toBe(true)
    expect(wrapper.vm.puedeInstalar).toBe(false)
  })

  it('descartar() guarda la preferencia y ya no vuelve a mostrar el prompt capturado después', async () => {
    const wrapper = mount(Anfitrion)
    window.dispatchEvent(eventoInstalacion())
    await wrapper.vm.$nextTick()

    wrapper.vm.descartar()
    expect(wrapper.vm.puedeInstalar).toBe(false)
    expect(localStorage.getItem('karider.instalar.descartado')).toBe('1')

    const otro = mount(Anfitrion)
    window.dispatchEvent(eventoInstalacion())
    await otro.vm.$nextTick()
    expect(otro.vm.puedeInstalar).toBe(false)
  })
})
