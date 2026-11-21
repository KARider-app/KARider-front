import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { ApiError } from '@/core/http/apiError'
import { notificacionesApi } from '../../api/notificacionesApi'
import type { ClaveVapid, SuscripcionPushRequest } from '../../domain/tipos'
import { useNotificacionesPush } from '../useNotificacionesPush'

vi.mock('../../api/notificacionesApi', () => ({
  notificacionesApi: {
    clavePublica: vi.fn<() => Promise<ClaveVapid>>(),
    suscribir: vi.fn<(p: SuscripcionPushRequest) => Promise<void>>(),
    cancelarSuscripcion: vi.fn<(endpoint: string) => Promise<void>>(),
  },
}))

const clavePublica = vi.mocked(notificacionesApi.clavePublica)
const suscribir = vi.mocked(notificacionesApi.suscribir)
const cancelarSuscripcion = vi.mocked(notificacionesApi.cancelarSuscripcion)

const Anfitrion = defineComponent({
  setup() {
    return useNotificacionesPush()
  },
  template: '<div />',
})

function suscripcionFalsa(endpoint = 'https://push.ejemplo/abc') {
  return {
    endpoint,
    unsubscribe: vi.fn<() => Promise<boolean>>().mockResolvedValue(true),
    toJSON: () => ({ endpoint, keys: { p256dh: 'clave-p256dh', auth: 'clave-auth' } }),
  }
}

type Suscripcion = ReturnType<typeof suscripcionFalsa>

function instalarNavegadorConPush(opciones: { suscripcionInicial?: Suscripcion | null } = {}) {
  let suscripcionActual = opciones.suscripcionInicial ?? null
  const registro = {
    pushManager: {
      getSubscription: vi.fn<() => Promise<Suscripcion | null>>(async () => suscripcionActual),
      subscribe: vi.fn<() => Promise<Suscripcion>>(async () => {
        suscripcionActual = suscripcionFalsa()
        return suscripcionActual
      }),
    },
  }
  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: { ready: Promise.resolve(registro) },
  })
  Object.defineProperty(window, 'PushManager', { configurable: true, value: class {} })
  Object.defineProperty(window, 'Notification', {
    configurable: true,
    writable: true,
    value: Object.assign(vi.fn(), {
      permission: 'default' as NotificationPermission,
      requestPermission: vi
        .fn<() => Promise<NotificationPermission>>()
        .mockResolvedValue('granted'),
    }),
  })
  return registro
}

describe('useNotificacionesPush (HU-13)', () => {
  beforeEach(() => {
    clavePublica.mockReset()
    suscribir.mockReset()
    cancelarSuscripcion.mockReset()
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('sin soporte del navegador, no permite activar', () => {
    Object.defineProperty(window, 'PushManager', { configurable: true, value: undefined })
    const wrapper = mount(Anfitrion)
    expect(wrapper.vm.soportado).toBe(false)
  })

  it('activar(): pide permiso, se suscribe y manda la suscripción al backend', async () => {
    instalarNavegadorConPush()
    clavePublica.mockResolvedValue({ publicKey: 'QVZQSUQtUFVCTElDLUtFWQ', habilitado: true })
    suscribir.mockResolvedValue(undefined)

    const wrapper = mount(Anfitrion)
    await wrapper.vm.activar()

    expect(wrapper.vm.permiso).toBe('granted')
    expect(suscribir).toHaveBeenCalledWith({
      endpoint: 'https://push.ejemplo/abc',
      p256dh: 'clave-p256dh',
      auth: 'clave-auth',
    })
    expect(wrapper.vm.suscrito).toBe(true)
  })

  it('si el servidor no tiene VAPID configurada, muestra error sin suscribirse', async () => {
    instalarNavegadorConPush()
    clavePublica.mockResolvedValue({ publicKey: null, habilitado: false })

    const wrapper = mount(Anfitrion)
    await wrapper.vm.activar()

    expect(suscribir).not.toHaveBeenCalled()
    expect(wrapper.vm.error).not.toBeNull()
    expect(wrapper.vm.suscrito).toBe(false)
  })

  it('desactivar(): cancela en el backend y se desuscribe del navegador', async () => {
    const sub = suscripcionFalsa()
    instalarNavegadorConPush({ suscripcionInicial: sub })
    cancelarSuscripcion.mockResolvedValue(undefined)

    const wrapper = mount(Anfitrion)
    await wrapper.vm.$nextTick()
    await Promise.resolve()

    await wrapper.vm.desactivar()

    expect(cancelarSuscripcion).toHaveBeenCalledWith('https://push.ejemplo/abc')
    expect(sub.unsubscribe).toHaveBeenCalledTimes(1)
    expect(wrapper.vm.suscrito).toBe(false)
  })

  it('un error del backend al suscribir se expone como ApiError', async () => {
    instalarNavegadorConPush()
    clavePublica.mockResolvedValue({ publicKey: 'QVZQSUQtUFVCTElDLUtFWQ', habilitado: true })
    suscribir.mockRejectedValue(new ApiError(500, 'ERROR_SERVIDOR', 'Error interno.'))

    const wrapper = mount(Anfitrion)
    await wrapper.vm.activar()

    expect(wrapper.vm.error?.code).toBe('ERROR_SERVIDOR')
    expect(wrapper.vm.suscrito).toBe(false)
  })
})
