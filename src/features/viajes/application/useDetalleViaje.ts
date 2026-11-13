import { ref } from 'vue'
import { comoApiError, type ApiError } from '@/core/http/apiError'
import { viajesApi } from '../api/viajesApi'
import type { ViajeDetalle } from '../domain/tipos'

/** P11: detalle de un viaje con el aporte oficial que calculó la API. */
export function useDetalleViaje() {
  const viaje = ref<ViajeDetalle | null>(null)
  const cargando = ref(false)
  const error = ref<ApiError | null>(null)
  const publicando = ref(false)
  const iniciando = ref(false)
  const finalizando = ref(false)

  async function cargar(id: string) {
    cargando.value = true
    error.value = null
    try {
      viaje.value = await viajesApi.detalle(id)
    } catch (e) {
      error.value = comoApiError(e)
    } finally {
      cargando.value = false
    }
  }

  /** Publica un borrador (PATCH estado → Programado). */
  async function publicarBorrador() {
    if (!viaje.value || publicando.value) return
    publicando.value = true
    error.value = null
    try {
      viaje.value = await viajesApi.publicarBorrador(viaje.value.id)
    } catch (e) {
      error.value = comoApiError(e)
    } finally {
      publicando.value = false
    }
  }

  /** HU-11: el conductor marca que ya salió al recorrido (PATCH estado → EnCurso). */
  async function iniciarViaje() {
    if (!viaje.value || iniciando.value) return
    iniciando.value = true
    error.value = null
    try {
      viaje.value = await viajesApi.iniciar(viaje.value.id)
    } catch (e) {
      error.value = comoApiError(e)
    } finally {
      iniciando.value = false
    }
  }

  /** HU-11: el conductor marca el viaje como concluido (PATCH estado → Completado). */
  async function finalizarViaje() {
    if (!viaje.value || finalizando.value) return
    finalizando.value = true
    error.value = null
    try {
      viaje.value = await viajesApi.finalizar(viaje.value.id)
    } catch (e) {
      error.value = comoApiError(e)
    } finally {
      finalizando.value = false
    }
  }

  return {
    viaje,
    cargando,
    error,
    publicando,
    iniciando,
    finalizando,
    cargar,
    publicarBorrador,
    iniciarViaje,
    finalizarViaje,
  }
}
