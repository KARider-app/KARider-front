import { ref } from 'vue'
import { ApiError, comoApiError } from '@/core/http/apiError'
import { reservasApi } from '../api/reservasApi'
import { validarAsientos } from '../domain/asientos'
import type { Reserva } from '../domain/tipos'

/** HU-07: apartar 1 o 2 asientos de un viaje. */
export function useReservar() {
  const asientos = ref(1)
  const reservando = ref(false)
  const error = ref<ApiError | null>(null)

  /** Devuelve la reserva creada, o `null` si hubo un error (queda en `error`). */
  async function reservar(viajeId: string, disponibles: number): Promise<Reserva | null> {
    if (reservando.value) return null
    error.value = null

    // Se rechaza en el cliente antes de llamar a la API (la API vuelve a validar).
    const invalido = validarAsientos(asientos.value, disponibles)
    if (invalido) {
      error.value = new ApiError(422, 'RESERVA_ASIENTOS_INVALIDOS', invalido)
      return null
    }

    reservando.value = true
    try {
      return await reservasApi.crear(viajeId, asientos.value)
    } catch (e) {
      error.value = comoApiError(e)
      return null
    } finally {
      reservando.value = false
    }
  }

  return { asientos, reservando, error, reservar }
}
