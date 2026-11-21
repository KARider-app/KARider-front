import { onBeforeUnmount, onMounted, ref } from 'vue'

interface EventoInstalacion extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const CLAVE_DESCARTADA = 'karider.instalar.descartado'

function esIos(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

function enModoStandalone(): boolean {
  const comoApp =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(display-mode: standalone)').matches
  return comoApp || (navigator as Navigator & { standalone?: boolean }).standalone === true
}

/** HU-14: captura el prompt nativo de instalación (Add to Home Screen) y expone un botón propio. */
export function useInstalarApp() {
  const puedeInstalar = ref(false)
  const instalada = ref(enModoStandalone())
  const esIosSinPrompt = ref(esIos() && !enModoStandalone())
  const instalando = ref(false)

  let evento: EventoInstalacion | null = null

  function alAntesDeInstalar(e: Event) {
    e.preventDefault()
    if (localStorage.getItem(CLAVE_DESCARTADA)) return
    evento = e as EventoInstalacion
    puedeInstalar.value = true
  }

  function alInstalar() {
    instalada.value = true
    puedeInstalar.value = false
    evento = null
  }

  async function instalar() {
    if (!evento) return
    instalando.value = true
    try {
      await evento.prompt()
      const { outcome } = await evento.userChoice
      if (outcome === 'dismissed') descartar()
    } finally {
      instalando.value = false
      puedeInstalar.value = false
      evento = null
    }
  }

  function descartar() {
    puedeInstalar.value = false
    esIosSinPrompt.value = false
    localStorage.setItem(CLAVE_DESCARTADA, '1')
  }

  onMounted(() => {
    window.addEventListener('beforeinstallprompt', alAntesDeInstalar)
    window.addEventListener('appinstalled', alInstalar)
  })
  onBeforeUnmount(() => {
    window.removeEventListener('beforeinstallprompt', alAntesDeInstalar)
    window.removeEventListener('appinstalled', alInstalar)
  })

  return { puedeInstalar, instalada, esIosSinPrompt, instalando, instalar, descartar }
}
