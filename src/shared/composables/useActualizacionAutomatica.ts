import { onBeforeUnmount, onMounted } from 'vue'

/** Cada cuánto se vuelve a consultar mientras la pantalla está visible. */
export const INTERVALO_ACTUALIZACION_MS = 20_000
/** Evita consultas dobles cuando «focus» y «visibilitychange» llegan juntos. */
const ESPERA_MINIMA_MS = 2_000

/**
 * HU-18: ejecuta `accion` periódicamente mientras la pantalla está visible y con conexión, y
 * en cuanto la persona regresa a la app (cambio de pestaña, foco o reconexión).
 */
export function useActualizacionAutomatica(
  accion: () => unknown,
  intervaloMs = INTERVALO_ACTUALIZACION_MS,
) {
  let temporizador: ReturnType<typeof setInterval> | undefined
  let ultima = 0

  function ejecutar() {
    if (document.visibilityState !== 'visible' || !navigator.onLine) return
    const ahora = Date.now()
    if (ahora - ultima < ESPERA_MINIMA_MS) return
    ultima = ahora
    void accion()
  }

  function alCambiarVisibilidad() {
    if (document.visibilityState === 'visible') ejecutar()
  }

  onMounted(() => {
    // La carga inicial la hace la vista; la primera actualización espera un intervalo.
    ultima = Date.now()
    temporizador = setInterval(ejecutar, intervaloMs)
    document.addEventListener('visibilitychange', alCambiarVisibilidad)
    window.addEventListener('focus', ejecutar)
    window.addEventListener('online', ejecutar)
  })

  onBeforeUnmount(() => {
    clearInterval(temporizador)
    document.removeEventListener('visibilitychange', alCambiarVisibilidad)
    window.removeEventListener('focus', ejecutar)
    window.removeEventListener('online', ejecutar)
  })
}
