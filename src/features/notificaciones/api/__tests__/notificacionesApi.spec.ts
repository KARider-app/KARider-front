import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/core/http/apiClient'
import { notificacionesApi } from '../notificacionesApi'

describe('notificacionesApi (HU-13)', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('clavePublica consulta la clave VAPID del backend', async () => {
    const get = vi
      .spyOn(apiClient, 'get')
      .mockResolvedValue({ data: { publicKey: 'clave-vapid', habilitado: true } } as never)

    const r = await notificacionesApi.clavePublica()

    expect(get).toHaveBeenCalledWith('/notificaciones/push/clave-publica')
    expect(r).toEqual({ publicKey: 'clave-vapid', habilitado: true })
  })

  it('suscribir manda endpoint, p256dh y auth', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({ data: undefined } as never)

    await notificacionesApi.suscribir({
      endpoint: 'https://push.ejemplo/abc',
      p256dh: 'clave-p256dh',
      auth: 'clave-auth',
    })

    expect(post).toHaveBeenCalledWith('/notificaciones/push/suscripciones', {
      endpoint: 'https://push.ejemplo/abc',
      p256dh: 'clave-p256dh',
      auth: 'clave-auth',
    })
  })

  it('cancelarSuscripcion manda el endpoint a dar de baja', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({ data: undefined } as never)

    await notificacionesApi.cancelarSuscripcion('https://push.ejemplo/abc')

    expect(post).toHaveBeenCalledWith('/notificaciones/push/suscripciones/cancelar', {
      endpoint: 'https://push.ejemplo/abc',
    })
  })
})
