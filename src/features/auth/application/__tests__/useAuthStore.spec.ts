import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { usuario } from '@/__tests__/apoyo/montaje'
import { EVENTO_USUARIO_ACTUALIZADO } from '@/core/http/apiClient'
import { authApi } from '../../api/authApi'
import type { AuthResponse } from '../../domain/tipos'
import { useAuthStore } from '../useAuthStore'

const { refrescarSesion, desactivarPushLocal } = vi.hoisted(() => ({
  refrescarSesion: vi.fn<() => Promise<string | null>>(),
  desactivarPushLocal: vi.fn<() => Promise<void>>(),
}))
vi.mock('@/core/http/apiClient', async (original) => ({
  ...(await original<typeof import('@/core/http/apiClient')>()),
  refrescarSesion,
}))
vi.mock('@/features/notificaciones/application/desactivarPushLocal', () => ({
  desactivarPushLocal,
}))

function respuestaLogin(rol: 'Pasajero' | 'Conductor'): AuthResponse {
  return {
    accessToken: 'a',
    accessTokenExpiraEn: '',
    refreshToken: 'r',
    refreshTokenExpiraEn: '',
    tokenType: 'Bearer',
    usuario: usuario(rol),
  }
}

const datosLogin = (rol: 'Pasajero' | 'Conductor') => ({
  correoInstitucional: 'carlos.mendoza@uttt.edu.mx',
  password: 'Segura#2026',
  rol,
  recordarme: false,
})

describe('useAuthStore · modo de uso (HU-17)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    sessionStorage.clear()
    refrescarSesion.mockReset()
    desactivarPushLocal.mockReset().mockResolvedValue(undefined)
  })
  afterEach(() => vi.restoreAllMocks())

  it('un conductor que entra como pasajero usa la app como pasajero', async () => {
    vi.spyOn(authApi, 'login').mockResolvedValue(respuestaLogin('Conductor'))
    const auth = useAuthStore()
    await auth.login(datosLogin('Pasajero'))

    expect(auth.esConductor).toBe(true)
    expect(auth.modoActivo).toBe('Pasajero')
    expect(auth.modoConductor).toBe(false)
  })

  it('un conductor cambia de modo y el modo se recuerda', async () => {
    vi.spyOn(authApi, 'login').mockResolvedValue(respuestaLogin('Conductor'))
    const auth = useAuthStore()
    await auth.login(datosLogin('Conductor'))
    expect(auth.modoConductor).toBe(true)

    auth.cambiarModo('Pasajero')

    expect(auth.modoActivo).toBe('Pasajero')
    expect(localStorage.getItem('karider.modo')).toBe('Pasajero')
  })

  it('una cuenta sin vehículo no puede pasar a modo conductor', () => {
    const auth = useAuthStore()
    auth.usuario = usuario('Pasajero')

    auth.cambiarModo('Conductor')

    expect(auth.modoActivo).toBe('Pasajero')
  })

  it('al registrar su vehículo renueva la sesión y queda en modo conductor', async () => {
    refrescarSesion.mockResolvedValue('nuevo-token')
    const auth = useAuthStore()
    auth.usuario = usuario('Pasajero')

    await auth.convertirEnConductor()

    expect(refrescarSesion).toHaveBeenCalledOnce()
    expect(auth.usuario?.rol).toBe('Conductor')
    expect(auth.modoConductor).toBe(true)
    expect(JSON.parse(localStorage.getItem('karider.usuario') ?? '{}').rol).toBe('Conductor')
  })

  it('toma el rol vigente que devuelve la API al renovar la sesión', () => {
    const auth = useAuthStore()
    auth.usuario = usuario('Pasajero')

    window.dispatchEvent(
      new CustomEvent(EVENTO_USUARIO_ACTUALIZADO, { detail: usuario('Conductor') }),
    )
    expect(auth.esConductor).toBe(true)

    // Datos de otra cuenta, o que no son un usuario, se ignoran.
    window.dispatchEvent(
      new CustomEvent(EVENTO_USUARIO_ACTUALIZADO, {
        detail: { ...usuario('Pasajero'), id: 'otra-cuenta' },
      }),
    )
    window.dispatchEvent(new CustomEvent(EVENTO_USUARIO_ACTUALIZADO, { detail: 'basura' }))
    expect(auth.usuario?.rol).toBe('Conductor')
  })

  it('al abrir la app recupera la sesión con el modo guardado', async () => {
    refrescarSesion.mockResolvedValue('token')
    localStorage.setItem('karider.usuario', JSON.stringify(usuario('Conductor')))
    localStorage.setItem('karider.modo', 'Pasajero')
    localStorage.setItem('karider.rt', 'refresh')

    const auth = useAuthStore()
    await auth.restaurar()

    expect(auth.autenticado).toBe(true)
    expect(auth.modoActivo).toBe('Pasajero')
  })

  it('sin refresh token no restaura la sesión', async () => {
    localStorage.setItem('karider.usuario', JSON.stringify(usuario('Conductor')))

    const auth = useAuthStore()
    await auth.restaurar()

    expect(auth.autenticado).toBe(false)
    expect(refrescarSesion).not.toHaveBeenCalled()
  })

  it('al cerrar sesión olvida el modo', () => {
    const auth = useAuthStore()
    auth.usuario = usuario('Conductor')
    auth.cambiarModo('Conductor')

    auth.cerrarLocal()

    expect(auth.modoActivo).toBe('Pasajero')
    expect(localStorage.getItem('karider.modo')).toBeNull()
  })

  it('al cerrar sesión cancela la suscripción push de este dispositivo (otra cuenta podría usarlo después)', async () => {
    vi.spyOn(authApi, 'logout').mockResolvedValue(undefined as never)
    const auth = useAuthStore()
    auth.usuario = usuario('Conductor')

    await auth.logout()

    expect(desactivarPushLocal).toHaveBeenCalledOnce()
    expect(auth.autenticado).toBe(false)
  })

  it('si falla la cancelación push, de todas formas cierra la sesión', async () => {
    desactivarPushLocal.mockRejectedValue(new Error('sin conexión'))
    vi.spyOn(authApi, 'logout').mockResolvedValue(undefined as never)
    const auth = useAuthStore()
    auth.usuario = usuario('Conductor')

    await auth.logout()

    expect(auth.autenticado).toBe(false)
  })
})
