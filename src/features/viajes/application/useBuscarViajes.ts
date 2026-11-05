import { ref } from 'vue'
import { comoApiError, type ApiError } from '@/core/http/apiError'
import { viajesApi } from '../api/viajesApi'
import type { BuscarViajesParams, ViajeResumen } from '../domain/tipos'

export type FiltrosViajes = Omit<BuscarViajesParams, 'pagina' | 'tamanoPagina'>

const TAMANO_PAGINA = 20

/** P5/P6: búsqueda y filtrado de viajes disponibles (el orden lo aplica la API, sin recargar la página). */
export function useBuscarViajes() {
  const viajes = ref<ViajeResumen[]>([])
  const total = ref(0)
  const pagina = ref(1)
  const tieneSiguiente = ref(false)
  const cargando = ref(false)
  const cargandoMas = ref(false)
  const buscado = ref(false)
  const error = ref<ApiError | null>(null)

  // Si el usuario cambia el filtro mientras viaja una respuesta, esa respuesta se descarta.
  let consulta = 0

  async function buscar(filtros: FiltrosViajes) {
    const id = ++consulta
    cargando.value = true
    error.value = null
    try {
      const r = await viajesApi.buscar({ ...filtros, pagina: 1, tamanoPagina: TAMANO_PAGINA })
      if (id !== consulta) return
      viajes.value = r.items
      total.value = r.total
      pagina.value = r.pagina
      tieneSiguiente.value = r.tieneSiguiente
      buscado.value = true
    } catch (e) {
      if (id === consulta) error.value = comoApiError(e)
    } finally {
      if (id === consulta) cargando.value = false
    }
  }

  async function cargarMas(filtros: FiltrosViajes) {
    if (!tieneSiguiente.value || cargandoMas.value || cargando.value) return
    const id = consulta
    cargandoMas.value = true
    error.value = null
    try {
      const r = await viajesApi.buscar({
        ...filtros,
        pagina: pagina.value + 1,
        tamanoPagina: TAMANO_PAGINA,
      })
      if (id !== consulta) return
      viajes.value = [...viajes.value, ...r.items]
      total.value = r.total
      pagina.value = r.pagina
      tieneSiguiente.value = r.tieneSiguiente
    } catch (e) {
      if (id === consulta) error.value = comoApiError(e)
    } finally {
      cargandoMas.value = false
    }
  }

  return { viajes, total, tieneSiguiente, cargando, cargandoMas, buscado, error, buscar, cargarMas }
}
