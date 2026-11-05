import { computed, ref } from 'vue'
import { comoApiError, type ApiError } from '@/core/http/apiError'
import { aFechaYHoraLocal, aIsoUtc } from '@/core/utils/fechas'
import { useFormulario } from '@/shared/composables/useFormulario'
import { viajesApi } from '../api/viajesApi'
import { esEditable } from '../domain/aporte'
import { crearEditarEsquema } from '../domain/esquemas'
import type { ViajeDetalle } from '../domain/tipos'

export interface FormularioEdicion {
  puntoEncuentroId: number | ''
  destino: string
  paradas: string[]
  fecha: string
  hora: string
  asientos: number
  gastoTotal: number | string
  notas: string
}

const vacio = (): FormularioEdicion => ({
  puntoEncuentroId: '',
  destino: '',
  paradas: [],
  fecha: '',
  hora: '',
  asientos: 1,
  gastoTotal: '',
  notas: '',
})

/** HU-09: carga un viaje propio, permite editarlo y lo guarda. */
export function useEditarViaje() {
  const viaje = ref<ViajeDetalle | null>(null)
  const cargando = ref(false)
  const errorCarga = ref<ApiError | null>(null)
  const reservados = ref(0)
  const original = ref<FormularioEdicion>(vacio())

  const formulario = useFormulario(
    crearEditarEsquema(() => reservados.value),
    vacio(),
  )
  const { valores } = formulario

  /** Solo el dueño puede editar, y solo borradores o viajes publicados. */
  const editable = computed(() => esEditable(viaje.value))

  /** Hay algo distinto a lo que se cargó: habilita «Guardar». */
  const hayCambios = computed(
    () => JSON.stringify(valores.value) !== JSON.stringify(original.value),
  )

  /** Cambios que afectan a los pasajeros: por eso se les notifica. */
  const cambiosRelevantes = computed(() => {
    const a = valores.value
    const b = original.value
    return (
      a.fecha !== b.fecha ||
      a.hora !== b.hora ||
      a.puntoEncuentroId !== b.puntoEncuentroId ||
      a.destino !== b.destino ||
      JSON.stringify(a.paradas) !== JSON.stringify(b.paradas)
    )
  })

  async function cargar(id: string) {
    cargando.value = true
    errorCarga.value = null
    try {
      const v = await viajesApi.detalle(id)
      viaje.value = v
      reservados.value = v.asientosOfrecidos - v.asientosDisponibles
      const { fecha, hora } = aFechaYHoraLocal(v.fechaSalida)
      valores.value = {
        puntoEncuentroId: v.puntoEncuentro.id,
        destino: v.destino,
        paradas: v.paradas.map((p) => p.nombre),
        fecha,
        hora,
        asientos: v.asientosOfrecidos,
        gastoTotal: v.gastoTotal,
        notas: v.notas ?? '',
      }
      original.value = JSON.parse(JSON.stringify(valores.value)) as FormularioEdicion
    } catch (e) {
      errorCarga.value = comoApiError(e)
    } finally {
      cargando.value = false
    }
  }

  /** Devuelve true si se guardó. Los errores quedan en `formulario.errores` / `errorGeneral`. */
  async function guardar(): Promise<boolean> {
    const actual = viaje.value
    if (!actual) return false
    let guardado = false
    await formulario.enviar(async (d) => {
      await viajesApi.editar(actual.id, {
        puntoEncuentroId: d.puntoEncuentroId,
        destino: d.destino,
        paradas: d.paradas,
        fechaSalida: aIsoUtc(d.fecha, d.hora),
        asientos: d.asientos,
        gastoTotal: d.gastoTotal,
        notas: d.notas || undefined,
      })
      guardado = true
    })
    return guardado
  }

  return {
    viaje,
    cargando,
    errorCarga,
    reservados,
    editable,
    hayCambios,
    cambiosRelevantes,
    formulario,
    cargar,
    guardar,
  }
}
