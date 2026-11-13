import { computed, onBeforeUnmount, ref } from 'vue'
import { comoApiError, type ApiError } from '@/core/http/apiError'
import { viajesApi } from '@/features/viajes/api/viajesApi'
import type {
  LlegadaConductor,
  RutaViaje,
  UbicacionConductor,
} from '@/features/viajes/domain/tipos'
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
  /** Ruta real por calles del viaje (punto de encuentro → paradas → destino). */
  const ruta = ref<RutaViaje | null>(null)
  /** La consulta de la ruta ya terminó (con o sin éxito). */
  const rutaConsultada = ref(false)
  /** Llegada del conductor calculada por calles (si el servicio de rutas respondió). */
  const llegada = ref<LlegadaConductor | null>(null)
  const destino = computed<(Coordenada & { nombre: string }) | null>(
    () => ruta.value?.destino ?? null,
  )
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

  /** Criterio 1: distancia restante por calles; en línea recta solo si el servicio de rutas no respondió. */
  const distancia = computed(() => {
    if (!reserva.value || !ubicacion.value) return null
    if (llegada.value) return llegada.value.distanciaKm
    return distanciaKm(ubicacion.value, reserva.value.viaje.puntoEncuentro)
  })

  const minutos = computed(() => {
    if (llegada.value) return Math.round(llegada.value.duracionMinutos)
    return distancia.value === null ? null : minutosEstimados(distancia.value)
  })

  /** La estimación es real (por calles) o de respaldo (línea recta a velocidad urbana). */
  const estimacionPorCalles = computed(() => llegada.value?.porCalles ?? false)

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
      await consultarLlegada(actual.viaje.id)
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

  /** Si el cálculo por calles falla, se conserva el anterior o se usa la línea recta. */
  async function consultarLlegada(viajeId: string) {
    try {
      llegada.value = await viajesApi.llegada(viajeId)
    } catch {
      /* respaldo: distancia en línea recta */
    }
  }

  /** La ruta se dibuja aparte: si falla, el mapa sigue mostrando el punto de encuentro. */
  async function cargarRuta(viajeId: string) {
    try {
      ruta.value = await viajesApi.ruta(viajeId)
    } catch {
      /* opcional: no bloquea la pantalla */
    } finally {
      rutaConsultada.value = true
    }
  }

  async function cargar(reservaId: string) {
    cargando.value = true
    error.value = null
    try {
      reserva.value = await reservasApi.obtener(reservaId)
      void cargarRuta(reserva.value.viaje.id)
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
    ruta,
    rutaConsultada,
    llegada,
    destino,
    estimacionPorCalles,
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
