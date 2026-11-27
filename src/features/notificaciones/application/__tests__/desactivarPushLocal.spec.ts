import { afterEach, describe, expect, it, vi } from 'vitest'
import { instalarNavegadorConPush, suscripcionFalsa } from '@/__tests__/apoyo/navegadorPush'
import { notificacionesApi } from '../../api/notificacionesApi'
import { desactivarPushLocal } from '../desactivarPushLocal'

vi.mock('../../api/notificacionesApi', () => ({
  notificacionesApi: { cancelarSuscripcion: vi.fn<(endpoint: string) => Promise<void>>() },
}))

const cancelarSuscripcion = vi.mocked(notificacionesApi.cancelarSuscripcion)

describe('desactivarPushLocal (HU-17: cerrar sesión no debe dejar la suscripción de otra cuenta)', () => {
  afterEach(() => {
    cancelarSuscripcion.mockReset()
    vi.restoreAllMocks()
  })

  it('sin navegador compatible, no hace nada', async () => {
    Object.defineProperty(window, 'PushManager', { configurable: true, value: undefined })
    await desactivarPushLocal()
    expect(cancelarSuscripcion).not.toHaveBeenCalled()
  })

  it('sin ninguna suscripción activa, no hace nada', async () => {
    instalarNavegadorConPush()
    await desactivarPushLocal()
    expect(cancelarSuscripcion).not.toHaveBeenCalled()
  })

  it('con una suscripción activa, la cancela en el backend y se desuscribe del navegador', async () => {
    const sub = suscripcionFalsa()
    instalarNavegadorConPush({ suscripcionInicial: sub })
    cancelarSuscripcion.mockResolvedValue(undefined)

    await desactivarPushLocal()

    expect(cancelarSuscripcion).toHaveBeenCalledWith('https://push.ejemplo/abc')
    expect(sub.unsubscribe).toHaveBeenCalledTimes(1)
  })

  it('si el backend falla, igual se desuscribe del navegador (no deja avisos de la cuenta anterior)', async () => {
    const sub = suscripcionFalsa()
    instalarNavegadorConPush({ suscripcionInicial: sub })
    cancelarSuscripcion.mockRejectedValue(new Error('sin conexión'))

    await desactivarPushLocal()

    expect(sub.unsubscribe).toHaveBeenCalledTimes(1)
  })
})
