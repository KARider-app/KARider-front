import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { env } from '@/core/config/env'
import { session } from '@/core/auth/session'
import { aApiError } from './apiError'

export const apiClient = axios.create({ baseURL: env.apiUrl, timeout: 20_000 })

apiClient.interceptors.request.use((config) => {
  const token = session.getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

interface RespuestaRefresh {
  accessToken: string
  refreshToken: string
  /** Datos de la sesión con el rol vigente (p. ej. si la cuenta ya se volvió conductor). */
  usuario?: unknown
}

/** Evento que avisa al store de sesión que la API devolvió datos de usuario más recientes. */
export const EVENTO_USUARIO_ACTUALIZADO = 'karider:usuario-actualizado'

// Un solo refresh a la vez aunque fallen varias peticiones simultáneas.
let refrescando: Promise<string | null> | null = null

export function refrescarSesion(): Promise<string | null> {
  refrescando ??= (async () => {
    const refreshToken = session.getRefreshToken()
    if (!refreshToken) return null
    try {
      // Axios "limpio": sin interceptores, para no entrar en un ciclo.
      const { data } = await axios.post<RespuestaRefresh>(`${env.apiUrl}/auth/refresh`, {
        refreshToken,
      })
      session.guardar(data.accessToken, data.refreshToken, session.recordarme())
      if (data.usuario) {
        window.dispatchEvent(new CustomEvent(EVENTO_USUARIO_ACTUALIZADO, { detail: data.usuario }))
      }
      return data.accessToken
    } catch (e) {
      // Sin conexión se conserva el refresh token para reintentar; si la API lo rechazó, se descarta.
      if (axios.isAxiosError(e) && e.response) session.cerrar()
      return null
    }
  })().finally(() => (refrescando = null))
  return refrescando
}

type ConfigReintento = InternalAxiosRequestConfig & { _reintento?: boolean }

apiClient.interceptors.response.use(
  (r) => r,
  async (error: AxiosError<{ code?: string }>) => {
    const original = error.config as ConfigReintento | undefined
    const code = error.response?.data?.code
    // REQUERIDO: la app arrancó sin conexión y aún no tiene access token, pero sí refresh token.
    const renovable =
      code === 'AUTH_TOKEN_EXPIRADO' ||
      (code === 'AUTH_TOKEN_REQUERIDO' && session.getRefreshToken() !== null)

    if (error.response?.status === 401 && renovable && original && !original._reintento) {
      original._reintento = true
      const nuevo = await refrescarSesion()
      if (nuevo) {
        original.headers.Authorization = `Bearer ${nuevo}`
        return apiClient(original)
      }
      window.dispatchEvent(new CustomEvent('karider:sesion-expirada'))
    }
    return Promise.reject(aApiError(error))
  },
)
