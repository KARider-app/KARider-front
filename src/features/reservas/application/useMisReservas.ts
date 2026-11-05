import { ref } from 'vue'
import { comoApiError, type ApiError } from '@/core/http/apiError'
import { reservasApi } from '../api/reservasApi'
import type { Reserva } from '../domain/tipos'

/** Reservas del usuario: de aquí se entra al mapa (P8) de las confirmadas. */
export function useMisReservas() {
  const reservas = ref<Reserva[]>([])
  const cargando = ref(false)
  const error = ref<ApiError | null>(null)

  async function cargar() {
    cargando.value = true
    error.value = null
    try {
      reservas.value = (await reservasApi.misReservas()).items
    } catch (e) {
      error.value = comoApiError(e)
    } finally {
      cargando.value = false
    }
  }

  return { reservas, cargando, error, cargar }
}
