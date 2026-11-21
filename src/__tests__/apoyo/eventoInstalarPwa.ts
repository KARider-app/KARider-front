import { vi } from 'vitest'

/** HU-14: simula el evento `beforeinstallprompt` que dispara el navegador. */
export function eventoInstalacion() {
  const evento = new Event('beforeinstallprompt', { cancelable: true }) as Event & {
    prompt: () => Promise<void>
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
  }
  evento.prompt = vi.fn<() => Promise<void>>().mockResolvedValue(undefined)
  evento.userChoice = Promise.resolve({ outcome: 'accepted' })
  return evento
}
