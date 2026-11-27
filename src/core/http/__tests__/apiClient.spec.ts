import axios, {
  AxiosError,
  AxiosHeaders,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { session } from '@/core/auth/session'
import { apiClient, EVENTO_USUARIO_ACTUALIZADO, refrescarSesion } from '../apiClient'
import { ApiError } from '../apiError'

/** Responde 401 AUTH_TOKEN_EXPIRADO con el token viejo y 200 con el nuevo. */
function adaptadorSimulado(tokenValido: string) {
  return vi.fn<(config: InternalAxiosRequestConfig) => Promise<AxiosResponse>>(async (config) => {
    const auth = config.headers.Authorization
    if (auth === `Bearer ${tokenValido}`) {
      return { data: { ok: config.url }, status: 200, statusText: 'OK', headers: {}, config }
    }
    const response = {
      data: { status: 401, code: 'AUTH_TOKEN_EXPIRADO', detail: 'Tu sesión expiró.' },
      status: 401,
      statusText: 'Unauthorized',
      headers: new AxiosHeaders(),
      config,
    }
    throw new AxiosError('401', 'ERR_BAD_REQUEST', config, null, response)
  })
}

describe('apiClient: renovación automática (HU-03)', () => {
  beforeEach(() => {
    session.guardar('viejo', 'refresh-1', true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    session.cerrar()
  })

  it('ante 401 AUTH_TOKEN_EXPIRADO refresca UNA sola vez y reintenta todas las peticiones', async () => {
    const refresh = vi.spyOn(axios, 'post').mockResolvedValue({
      data: { accessToken: 'nuevo', refreshToken: 'refresh-2' },
    })
    const adaptador = adaptadorSimulado('nuevo')
    apiClient.defaults.adapter = adaptador

    const [a, b] = await Promise.all([apiClient.get('/vehiculos'), apiClient.get('/viajes/1')])

    expect(refresh).toHaveBeenCalledTimes(1)
    expect(refresh).toHaveBeenCalledWith(expect.stringContaining('/auth/refresh'), {
      refreshToken: 'refresh-1',
    })
    expect(a.data).toEqual({ ok: '/vehiculos' })
    expect(b.data).toEqual({ ok: '/viajes/1' })
    // Se guarda el refresh token NUEVO (rotación) en el mismo almacenamiento
    expect(session.getRefreshToken()).toBe('refresh-2')
    expect(localStorage.getItem('karider.rt')).toBe('refresh-2')
    expect(adaptador).toHaveBeenCalledTimes(4)
  })

  it('HU-17: avisa a la app del usuario con su rol vigente que devuelve el refresh', async () => {
    const usuario = { id: 'u1', rol: 'Conductor' }
    vi.spyOn(axios, 'post').mockResolvedValue({
      data: { accessToken: 'nuevo', refreshToken: 'refresh-2', usuario },
    })
    const escucha = vi.fn<(e: Event) => void>()
    window.addEventListener(EVENTO_USUARIO_ACTUALIZADO, escucha)

    await refrescarSesion()

    window.removeEventListener(EVENTO_USUARIO_ACTUALIZADO, escucha)
    expect(escucha).toHaveBeenCalledOnce()
    expect((escucha.mock.calls[0]![0] as CustomEvent).detail).toEqual(usuario)
  })

  it('si el refresh falla, cierra la sesión y avisa a la app', async () => {
    const config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig
    vi.spyOn(axios, 'post').mockRejectedValue(
      new AxiosError('401', 'ERR_BAD_REQUEST', config, null, {
        data: { code: 'AUTH_REFRESH_TOKEN_INVALIDO' },
        status: 401,
        statusText: 'Unauthorized',
        headers: {},
        config,
      }),
    )
    apiClient.defaults.adapter = adaptadorSimulado('nuevo')
    const expirada = vi.fn<() => void>()
    window.addEventListener('karider:sesion-expirada', expirada)

    const error = await apiClient.get('/vehiculos').catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).code).toBe('AUTH_TOKEN_EXPIRADO')
    expect(expirada).toHaveBeenCalledTimes(1)
    expect(session.getRefreshToken()).toBeNull()
    window.removeEventListener('karider:sesion-expirada', expirada)
  })
})
