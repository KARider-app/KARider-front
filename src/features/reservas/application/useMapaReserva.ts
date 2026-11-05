import { computed, onBeforeUnmount, ref } from 'vue'
import { comoApiError, type ApiError } from '@/core/http/apiError'
import { viajesApi } from '@/features/viajes/api/viajesApi'
import type { UbicacionConductor } from '@/features/viajes/domain/tipos'
import { reservasApi } from '../api/reservasApi'
import { distanciaKm, minutosEstimados, type Coordenada } from '../domain/geo'
import type { Reserva } from '../domain/tipos'

/** Polling de la ubicación del conductor (HU-08: cada 10-15 s). */
const INTERVALO_MS = 12_000

const claveCache = (viajeId: string) => `karider.ubicacion.${viajeId}`

function leerCache(viajeId: string): UbicacionConductor | null {
  try {
    const guardado = localStorage.getItem(claveCache(viajeId))
    return guardado ? (JSON.parse(guardado) as UbicacionConductor) : null
  } catch {
    return null
  }
}

function guardarCache(viajeId: string, u: UbicacionConductor) {
  try {
    localStorage.setItem(claveCache(viajeId), JSON.stringify(u))
  } catch {
    /* sin almacenamiento disponible: no es crítico */
  }
}

/** P8: reserva confirmada, ubicación del conductor y estimaciones de llegada. */
export function useMapaReserva() {
  const reserva = ref<Reserva | null>(null)
  const ubicacion = ref<UbicacionConductor | null>(null)
  /** Coordenadas del destino (si el conductor las capturó al publicar). */
  const destino = ref<(Coordenada & { nombre: string }) | null>(null)
  const cargando = ref(false)
  const error = ref<ApiError | null>(null)
  /** El conductor aún no comparte su ubicación (404 VIAJE_UBICACION_NO_DISPONIBLE). */
  const esperandoConductor = ref(false)
  const sinConexion = ref(false)

  let temporizador: ReturnType<typeof setTimeout> | null = null
  let activo = true

  const confirmada = computed(() => reserva.value?.estado === 'Confirmada')

  /** Regla 1: solo se consulta la ubicación mientras el viaje está programado o en curso. */
  const viajeActivo = computed(() => {
    const estado = reserva.value?.viaje.estado
    return estado === 'Programado' || estado === 'EnCurso'
  })

  const distancia = computed(() => {
    if (!reserva.value || !ubicacion.value) return null
    return distanciaKm(ubicacion.value, reserva.value.viaje.puntoEncuentro)
  })

  const minutos = computed(() =>
    distancia.value === null ? null : minutosEstimados(distancia.value),
  )

  async function consultarUbicacion() {
    const actual = reserva.value
    if (!actual) return
    try {
      const u = await viajesApi.ubicacion(actual.viaje.id)
      ubicacion.value = u
      guardarCache(actual.viaje.id, u)
      esperandoConductor.value = false
      sinConexion.value = false
      error.value = null
    } catch (e) {
      const err = comoApiError(e)
      if (err.code === 'VIAJE_UBICACION_NO_DISPONIBLE') {
        esperandoConductor.value = true
        sinConexion.value = false
      } else if (err.code === 'SIN_CONEXION') {
        // Criterio 4: se conserva la última ubicación conocida y se avisa.
        sinConexion.value = true
        ubicacion.value ??= leerCache(actual.viaje.id)
      } else {
        error.value = err
      }
    }
  }

  function programar() {
    detener()
    if (!activo || !confirmada.value || !viajeActivo.value) return
    temporizador = setTimeout(async () => {
      if (!document.hidden) await consultarUbicacion()
      programar()
    }, INTERVALO_MS)
  }

  function detener() {
    if (temporizador !== null) clearTimeout(temporizador)
    temporizador = null
  }

  /** El destino viene en el detalle del viaje; si falla, el mapa se dibuja sin él. */
  async function cargarDestino(viajeId: string) {
    try {
      const d = await viajesApi.detalle(viajeId)
      if (typeof d.destinoLatitud === 'number' && typeof d.destinoLongitud === 'number') {
        destino.value = {
          latitud: d.destinoLatitud,
          longitud: d.destinoLongitud,
          nombre: d.destino,
        }
      }
    } catch {
      /* opcional: no bloquea la pantalla */
    }
  }

  async function cargar(reservaId: string) {
    cargando.value = true
    error.value = null
    try {
      reserva.value = await reservasApi.obtener(reservaId)
      void cargarDestino(reserva.value.viaje.id)
      if (confirmada.value && viajeActivo.value) {
        await consultarUbicacion()
        programar()
      }
    } catch (e) {
      error.value = comoApiError(e)
    } finally {
      cargando.value = false
    }
  }

  onBeforeUnmount(() => {
    activo = false
    detener()
  })

  return {
    reserva,
    ubicacion,
    destino,
    cargando,
    error,
    esperandoConductor,
    sinConexion,
    confirmada,
    viajeActivo,
    distancia,
    minutos,
    cargar,
  }
}
