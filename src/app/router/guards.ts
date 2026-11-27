import type { Router } from 'vue-router'
import { useAuthStore } from '@/features/auth/application/useAuthStore'

declare module 'vue-router' {
  interface RouteMeta {
    requiereSesion?: boolean
    soloConductor?: boolean
    soloInvitado?: boolean
  }
}

/** Solo mejoran la experiencia: la seguridad real la aplica la API (403/401). */
export function registrarGuards(router: Router) {
  router.beforeEach((to) => {
    const auth = useAuthStore()
    if (to.meta.requiereSesion && !auth.autenticado) {
      return { name: 'login', query: { volver: to.fullPath } }
    }
    if (to.meta.soloConductor) {
      // HU-17: sin vehículo registrado, el perfil explica cómo volverse conductor.
      if (!auth.esConductor) return { name: 'perfil' }
      // Un conductor en modo pasajero que entra a Publicar/Editar cambia a modo conductor.
      if (!auth.modoConductor) auth.cambiarModo('Conductor')
    }
    if (to.meta.soloInvitado && auth.autenticado) return { name: 'inicio' }
  })
}
