import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { usuario } from '@/__tests__/apoyo/montaje'
import { useAuthStore } from '@/features/auth/application/useAuthStore'
import { registrarGuards } from '../guards'

const Vacia = { template: '<div />' }

function crearRouter() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'inicio', component: Vacia },
      { path: '/login', name: 'login', component: Vacia, meta: { soloInvitado: true } },
      { path: '/perfil', name: 'perfil', component: Vacia, meta: { requiereSesion: true } },
      {
        path: '/publicar',
        name: 'publicar-1',
        component: Vacia,
        meta: { requiereSesion: true, soloConductor: true },
      },
    ],
  })
  registrarGuards(router)
  return router
}

describe('guards de navegación', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('sin sesión manda al login y recuerda a dónde iba', async () => {
    const router = crearRouter()
    await router.push('/perfil')
    expect(router.currentRoute.value.name).toBe('login')
    expect(router.currentRoute.value.query.volver).toBe('/perfil')
  })

  it('con sesión no deja volver al login', async () => {
    useAuthStore().usuario = usuario('Pasajero')
    const router = crearRouter()
    await router.push('/login')
    expect(router.currentRoute.value.name).toBe('inicio')
  })

  it('HU-17: un pasajero sin vehículo que quiere publicar va a su perfil para registrarlo', async () => {
    useAuthStore().usuario = usuario('Pasajero')
    const router = crearRouter()
    await router.push('/publicar')
    expect(router.currentRoute.value.name).toBe('perfil')
  })

  it('HU-17: un conductor en modo pasajero que entra a publicar cambia a modo conductor', async () => {
    const auth = useAuthStore()
    auth.usuario = usuario('Conductor')
    auth.cambiarModo('Pasajero')
    const router = crearRouter()

    await router.push('/publicar')

    expect(router.currentRoute.value.name).toBe('publicar-1')
    expect(auth.modoConductor).toBe(true)
  })
})
