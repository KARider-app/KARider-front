import { computed, ref } from 'vue'
import { comoApiError, type ApiError } from '@/core/http/apiError'
import { viajesApi } from '../api/viajesApi'
import { agruparRutasActivas } from '../domain/rutasActivas'
import type { ViajeResumen } from '../domain/tipos'

/**
 * Viajes publicados por el conductor (sin borradores), para seguir el mapa de su ruta (HU-08).
 * HU-24: solo se muestran las rutas activas (en curso o por salir), agrupadas por día; las
 * pasadas desaparecen de aquí y siguen en Perfil › Historial.
 */
export function useMisRutas() {
  const rutas = ref<ViajeResumen[]>([])
  const cargando = ref(false)
  const error = ref<ApiError | null>(null)

  const grupos = computed(() => agruparRutasActivas(rutas.value))
  const totalActivas = computed(() => grupos.value.reduce((n, g) => n + g.rutas.length, 0))
  /** Rutas completadas, canceladas o vencidas que ya no se muestran aquí. */
  const pasadas = computed(() => rutas.value.length - totalActivas.value)

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

  return { rutas, grupos, totalActivas, pasadas, cargando, error, cargar }
}
