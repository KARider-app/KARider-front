import { ref } from 'vue'
import { comoApiError, type ApiError } from '@/core/http/apiError'
import { reservasApi } from '../api/reservasApi'
import type { Reserva } from '../domain/tipos'

const CLAVE_CACHE = 'karider.misReservas'

function leerCache(): Reserva[] | null {
  try {
    const guardado = localStorage.getItem(CLAVE_CACHE)
    return guardado ? (JSON.parse(guardado) as Reserva[]) : null
  } catch {
    return null
  }
}

function guardarCache(r: Reserva[]) {
  try {
    localStorage.setItem(CLAVE_CACHE, JSON.stringify(r))
  } catch {
    /* sin almacenamiento disponible: no es crítico */
  }
}

/** Reservas del usuario: de aquí se entra al mapa (P8) de las confirmadas. */
export function useMisReservas() {
  const reservas = ref<Reserva[]>([])
  const cargando = ref(false)
  const error = ref<ApiError | null>(null)
  /** HU-15: se están mostrando datos guardados localmente, sin conexión al servidor. */
  const sinConexion = ref(false)

  async function cargar() {
    cargando.value = true
    error.value = null
    sinConexion.value = false
    try {
      reservas.value = (await reservasApi.misReservas()).items
      guardarCache(reservas.value)
    } catch (e) {
      const err = comoApiError(e)
      const cache = err.code === 'SIN_CONEXION' ? leerCache() : null
      if (cache) {
        reservas.value = cache
        sinConexion.value = true
      } else {
        error.value = err
      }
    } finally {
      cargando.value = false
    }
  }

  return { reservas, cargando, error, sinConexion, cargar }
}
