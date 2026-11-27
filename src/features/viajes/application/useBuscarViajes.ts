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
  /** HU-18: viajes que aparecieron en la última actualización automática. */
  const nuevos = ref(0)

  // Si el usuario cambia el filtro mientras viaja una respuesta, esa respuesta se descarta.
  let consulta = 0

  async function buscar(filtros: FiltrosViajes) {
    const id = ++consulta
    cargando.value = true
    error.value = null
    nuevos.value = 0
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

  /**
   * HU-18: vuelve a consultar en segundo plano (sin indicador de carga) para que los viajes
   * recién publicados aparezcan sin recargar la página. Si falla (p. ej. sin conexión) se
   * conserva la lista actual sin mostrar error.
   */
  async function actualizar(filtros: FiltrosViajes) {
    if (cargando.value || cargandoMas.value) return
    if (!buscado.value) return buscar(filtros)
    const id = consulta
    try {
      const r = await viajesApi.buscar({ ...filtros, pagina: 1, tamanoPagina: TAMANO_PAGINA })
      if (id !== consulta || cargandoMas.value) return
      const frescos = new Set(r.items.map((v) => v.id))
      const anteriores = new Set(viajes.value.map((v) => v.id))
      // Si ya se cargaron más páginas, se conservan (sin repetir los que ahora están arriba).
      const resto = viajes.value.slice(TAMANO_PAGINA).filter((v) => !frescos.has(v.id))
      nuevos.value = r.items.filter((v) => !anteriores.has(v.id)).length
      viajes.value = [...r.items, ...resto]
      total.value = r.total
      if (pagina.value === 1) tieneSiguiente.value = r.tieneSiguiente
      error.value = null
    } catch {
      // Silencioso: la siguiente actualización lo vuelve a intentar.
    }
  }

  return {
    viajes,
    total,
    tieneSiguiente,
    cargando,
    cargandoMas,
    buscado,
    error,
    nuevos,
    buscar,
    cargarMas,
    actualizar,
  }
}
