import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { session } from '@/core/auth/session'
import { EVENTO_USUARIO_ACTUALIZADO, refrescarSesion } from '@/core/http/apiClient'
import { authApi } from '../api/authApi'
import type { LoginRequest, RolIngreso, UsuarioSesion } from '../domain/tipos'

const CLAVE_USUARIO = 'karider.usuario'
const CLAVE_MODO = 'karider.modo'

/** Cómo está usando la app la persona en este momento (HU-17). */
export type ModoUso = RolIngreso

function leerUsuarioGuardado(): UsuarioSesion | null {
  try {
    const guardado = localStorage.getItem(CLAVE_USUARIO)
    return guardado ? (JSON.parse(guardado) as UsuarioSesion) : null
  } catch {
    return null
  }
}

function leerModoGuardado(): ModoUso {
  return localStorage.getItem(CLAVE_MODO) === 'Conductor' ? 'Conductor' : 'Pasajero'
}

function esUsuarioSesion(v: unknown): v is UsuarioSesion {
  return typeof v === 'object' && v !== null && 'id' in v && 'rol' in v
}

export const useAuthStore = defineStore('auth', () => {
  const usuario = ref<UsuarioSesion | null>(null)
  const autenticado = computed(() => usuario.value !== null)

  /** La cuenta PUEDE conducir: tiene vehículo registrado (rol Conductor o Administrador en la API). */
  const esConductor = computed(
    () => usuario.value?.rol === 'Conductor' || usuario.value?.rol === 'Administrador',
  )

  /**
   * HU-17: un conductor también puede viajar como pasajero. El modo decide qué ve en la app
   * (Publicar, Mapa de mis rutas o Mis reservas). Una cuenta sin vehículo siempre es Pasajero.
   */
  const modo = ref<ModoUso>('Pasajero')
  const modoActivo = computed<ModoUso>(() =>
    esConductor.value && modo.value === 'Conductor' ? 'Conductor' : 'Pasajero',
  )
  const modoConductor = computed(() => modoActivo.value === 'Conductor')

  function cambiarModo(nuevo: ModoUso) {
    modo.value = nuevo === 'Conductor' && !esConductor.value ? 'Pasajero' : nuevo
    localStorage.setItem(CLAVE_MODO, modo.value)
  }

  function guardarUsuario(u: UsuarioSesion) {
    usuario.value = u
    // Solo datos de perfil, nunca tokens
    localStorage.setItem(CLAVE_USUARIO, JSON.stringify(u))
  }

  async function login(datos: LoginRequest) {
    const r = await authApi.login(datos)
    session.guardar(r.accessToken, r.refreshToken, datos.recordarme)
    guardarUsuario(r.usuario)
    // Se entra con el rol elegido en el login (la API ya rechazó «Conductor» si no tiene vehículo).
    cambiarModo(datos.rol ?? 'Pasajero')
  }

  /** Al abrir la app: si hay refresh token, recupera la sesión. */
  async function restaurar() {
    const guardado = leerUsuarioGuardado()
    if (!guardado || !session.getRefreshToken()) return cerrarLocal()
    // El refresh puede traer un rol más reciente (evento EVENTO_USUARIO_ACTUALIZADO).
    usuario.value = guardado
    if (!(await refrescarSesion()) && !session.getRefreshToken()) return cerrarLocal()
    // Sin conexión el refresh token se conserva: se renueva en la siguiente petición.
    cambiarModo(leerModoGuardado())
  }

  /**
   * HU-17: después de registrar su primer vehículo la cuenta ya es conductor en la API, pero el
   * token vigente aún dice «Pasajero». Se renueva la sesión para que la API acepte publicar rutas.
   */
  async function convertirEnConductor() {
    await refrescarSesion()
    if (usuario.value && !esConductor.value) guardarUsuario({ ...usuario.value, rol: 'Conductor' })
    cambiarModo('Conductor')
  }

  async function logout() {
    const refreshToken = session.getRefreshToken()
    if (refreshToken) await authApi.logout(refreshToken).catch(() => {})
    cerrarLocal()
  }

  function cerrarLocal() {
    session.cerrar()
    usuario.value = null
    modo.value = 'Pasajero'
    localStorage.removeItem(CLAVE_USUARIO)
    localStorage.removeItem(CLAVE_MODO)
  }

  window.addEventListener(EVENTO_USUARIO_ACTUALIZADO, (e) => {
    const nuevo = (e as CustomEvent<unknown>).detail
    if (usuario.value && esUsuarioSesion(nuevo) && nuevo.id === usuario.value.id) {
      guardarUsuario(nuevo)
    }
  })

  return {
    usuario,
    autenticado,
    esConductor,
    modoActivo,
    modoConductor,
    cambiarModo,
    login,
    restaurar,
    convertirEnConductor,
    logout,
    cerrarLocal,
  }
})
