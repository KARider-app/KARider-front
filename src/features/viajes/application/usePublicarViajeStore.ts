import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { comoApiError, type ApiError } from '@/core/http/apiError'
import { aIsoUtc } from '@/core/utils/fechas'
import { viajesApi } from '../api/viajesApi'
import { paso1Esquema, type Paso2 } from '../domain/esquemas'
import type { Vehiculo, ViajeDetalle } from '../domain/tipos'

const CLAVE = 'karider.borrador-viaje'

/** Datos del asistente P9 → P10 tal como se capturan en los formularios. */
export interface BorradorViaje {
  puntoEncuentroId: number | ''
  destino: string
  /** HU-22: lugar exacto elegido en el mapa. */
  destinoLatitud: number | null
  destinoLongitud: number | null
  paradas: string[]
  fecha: string
  hora: string
  asientos: number
  gastoTotal: number | string
  notas: string
  vehiculoId: string
}

const vacio = (): BorradorViaje => ({
  puntoEncuentroId: '',
  destino: '',
  destinoLatitud: null,
  destinoLongitud: null,
  paradas: [],
  fecha: '',
  hora: '',
  asientos: 3,
  gastoTotal: '',
  notas: '',
  vehiculoId: '',
})

function leer(): BorradorViaje {
  try {
    const guardado = sessionStorage.getItem(CLAVE)
    return guardado ? { ...vacio(), ...(JSON.parse(guardado) as Partial<BorradorViaje>) } : vacio()
  } catch {
    return vacio()
  }
}

export const usePublicarViajeStore = defineStore('publicarViaje', () => {
  // Persistido en sessionStorage para no perder datos al recargar
  const borrador = ref<BorradorViaje>(leer())
  watch(borrador, (b) => sessionStorage.setItem(CLAVE, JSON.stringify(b)), { deep: true })

  const vehiculos = ref<Vehiculo[]>([])
  const vehiculosCargados = ref(false)
  const errorVehiculos = ref<ApiError | null>(null)

  const vehiculo = computed(
    () => vehiculos.value.find((v) => v.id === borrador.value.vehiculoId) ?? vehiculos.value[0],
  )
  /** Asientos que se pueden ofrecer: la capacidad del vehículo (máximo 4). */
  const capacidad = computed(() => Math.min(vehiculo.value?.capacidad ?? 4, 4))

  const paso1Completo = computed(() => paso1Esquema.safeParse(borrador.value).success)

  async function cargarVehiculos() {
    errorVehiculos.value = null
    try {
      vehiculos.value = await viajesApi.misVehiculos()
      vehiculosCargados.value = true
      if (!vehiculo.value || borrador.value.vehiculoId !== vehiculo.value.id) {
        borrador.value.vehiculoId = vehiculo.value?.id ?? ''
      }
      if (borrador.value.asientos > capacidad.value) borrador.value.asientos = capacidad.value
    } catch (e) {
      errorVehiculos.value = comoApiError(e)
    }
  }

  /** HU-05: publica (`publicar: true`) o guarda como borrador (`false`). */
  async function enviar(paso2: Paso2, publicar: boolean): Promise<ViajeDetalle> {
    const paso1 = paso1Esquema.parse(borrador.value)
    const viaje = await viajesApi.publicar({
      vehiculoId: paso2.vehiculoId || undefined,
      puntoEncuentroId: paso1.puntoEncuentroId,
      destino: paso1.destino,
      destinoLatitud: paso1.destinoLatitud,
      destinoLongitud: paso1.destinoLongitud,
      fechaSalida: aIsoUtc(paso1.fecha, paso1.hora),
      asientos: paso1.asientos,
      gastoTotal: paso2.gastoTotal,
      notas: paso2.notas || undefined,
      paradas: paso1.paradas,
      publicar,
    })
    reiniciar()
    return viaje
  }

  function reiniciar() {
    borrador.value = vacio()
    sessionStorage.removeItem(CLAVE)
  }

  return {
    borrador,
    vehiculos,
    vehiculosCargados,
    errorVehiculos,
    vehiculo,
    capacidad,
    paso1Completo,
    cargarVehiculos,
    enviar,
    reiniciar,
  }
})
