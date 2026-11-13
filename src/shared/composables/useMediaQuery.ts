import { onBeforeUnmount, ref } from 'vue'

/** true mientras la consulta de medios se cumpla (ej. '(min-width: 1024px)'). */
export function useMediaQuery(consulta: string) {
  const mq = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(consulta) : null
  const coincide = ref(mq?.matches ?? false)
  const alCambiar = (e: MediaQueryListEvent) => (coincide.value = e.matches)
  mq?.addEventListener('change', alCambiar)
  onBeforeUnmount(() => mq?.removeEventListener('change', alCambiar))
  return coincide
}

/** Pantallas de computadora (breakpoint lg de Tailwind). */
export const useEsEscritorio = () => useMediaQuery('(min-width: 1024px)')
