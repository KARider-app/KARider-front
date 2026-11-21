import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import InstalarAppBanner from '../InstalarAppBanner.vue'

function eventoInstalacion() {
  const evento = new Event('beforeinstallprompt', { cancelable: true }) as Event & {
    prompt: () => Promise<void>
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
  }
  evento.prompt = vi.fn<() => Promise<void>>().mockResolvedValue(undefined)
  evento.userChoice = Promise.resolve({ outcome: 'accepted' })
  return evento
}

describe('InstalarAppBanner (HU-14)', () => {
  beforeEach(() => {
    localStorage.clear()
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('no se muestra mientras el navegador no ofrezca instalar', () => {
    const wrapper = mount(InstalarAppBanner)
    expect(wrapper.find('[role="region"]').exists()).toBe(false)
  })

  it('se muestra y el botón Instalar dispara el prompt nativo', async () => {
    const wrapper = mount(InstalarAppBanner)
    const evento = eventoInstalacion()
    window.dispatchEvent(evento)
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Instala KARider en tu celular')
    await wrapper.get('button[type="button"]').trigger('click')
    expect(evento.prompt).toHaveBeenCalledOnce()
  })

  it('el botón de cerrar oculta el banner y recuerda la preferencia', async () => {
    const wrapper = mount(InstalarAppBanner)
    window.dispatchEvent(eventoInstalacion())
    await wrapper.vm.$nextTick()

    await wrapper.get('button[aria-label="Cerrar aviso de instalación"]').trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[role="region"]').exists()).toBe(false)
    expect(localStorage.getItem('karider.instalar.descartado')).toBe('1')
  })
})
