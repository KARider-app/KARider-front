import { onBeforeUnmount, ref } from 'vue'
import { comoApiError } from '@/core/http/apiError'
import { mensajeDeError } from '@/shared/composables/useApiError'
import { viajesApi } from '@/features/viajes/api/viajesApi'

/** Mínimo entre envíos: la API recibe una posición cada ~10 s aunque el GPS emita más seguido. */
const INTERVALO_MIN_MS = 10_000

/** HU-08 (conductor): comparte su geolocalización mientras la pantalla está abierta. */
export function useCompartirUbicacion(viajeId: () => string) {
  const compartiendo = ref(false)
  const error = ref<string | null>(null)
  const ultimoEnvio = ref<Date | null>(null)

  let watchId: number | null = null
  let ultimoEnvioMs = 0

  async function alRecibirPosicion(pos: GeolocationPosition) {
    const ahora = Date.now()
    if (ahora - ultimoEnvioMs < INTERVALO_MIN_MS) return
    ultimoEnvioMs = ahora
    try {
      await viajesApi.compartirUbicacion(viajeId(), pos.coords.latitude, pos.coords.longitude)
      ultimoEnvio.value = new Date()
      error.value = null
    } catch (e) {
      error.value = mensajeDeError(comoApiError(e))
    }
  }

  function alFallar(e: GeolocationPositionError) {
    error.value =
      e.code === e.PERMISSION_DENIED
        ? 'No diste permiso de ubicación. Actívalo en la configuración de tu navegador.'
        : 'No pudimos obtener tu ubicación. Revisa que el GPS esté activo.'
    detener()
  }

  function iniciar() {
    if (compartiendo.value) return
    if (!('geolocation' in navigator)) {
      error.value = 'Tu dispositivo no permite compartir la ubicación.'
      return
    }
    error.value = null
    ultimoEnvioMs = 0
    watchId = navigator.geolocation.watchPosition(alRecibirPosicion, alFallar, {
      enableHighAccuracy: true,
      maximumAge: 5_000,
      timeout: 20_000,
    })
    compartiendo.value = true
  }

  function detener() {
    if (watchId !== null) navigator.geolocation.clearWatch(watchId)
    watchId = null
    compartiendo.value = false
  }

  onBeforeUnmount(detener)

  return { compartiendo, error, ultimoEnvio, iniciar, detener }
}
