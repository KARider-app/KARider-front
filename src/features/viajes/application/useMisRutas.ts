import { ref } from 'vue'
import { comoApiError, type ApiError } from '@/core/http/apiError'
import { viajesApi } from '../api/viajesApi'
import type { ViajeResumen } from '../domain/tipos'

/** Viajes publicados por el conductor (sin borradores), para seguir el mapa de su ruta (HU-08). */
export function useMisRutas() {
  const rutas = ref<ViajeResumen[]>([])
  const cargando = ref(false)
  const error = ref<ApiError | null>(null)

  async function cargar() {
    cargando.value = true
    error.value = null
    try {
      const { items } = await viajesApi.misPublicados()
      rutas.value = items.filter((v) => v.estado !== 'Borrador')
    } catch (e) {
      error.value = comoApiError(e)
    } finally {
      cargando.value = false
    }
  }

  return { rutas, cargando, error, cargar }
}
