import { createRouter, createWebHistory } from 'vue-router'
import { registrarGuards } from './guards'

// Rutas del Sprint 1
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    {
      path: '/',
      name: 'inicio',
      component: () => import('@/features/auth/ui/views/InicioView.vue'),
    },
    {
      path: '/login',
      name: 'login',
      meta: { soloInvitado: true },
      component: () => import('@/features/auth/ui/views/LoginView.vue'),
    },
    {
      path: '/registro',
      name: 'registro',
      meta: { soloInvitado: true },
      component: () => import('@/features/auth/ui/views/RegistroView.vue'),
    },
    {
      path: '/verificar-correo',
      name: 'verificar',
      component: () => import('@/features/auth/ui/views/VerificarCorreoView.vue'),
    },
    {
      path: '/recuperar-contrasena',
      name: 'recuperar',
      meta: { soloInvitado: true },
      component: () => import('@/features/auth/ui/views/RecuperarContrasenaView.vue'),
    },
    {
      path: '/publicar',
      name: 'publicar-1',
      meta: { requiereSesion: true, soloConductor: true },
      component: () => import('@/features/viajes/ui/views/PublicarRutaPaso1View.vue'),
    },
    {
      path: '/publicar/gastos',
      name: 'publicar-2',
      meta: { requiereSesion: true, soloConductor: true },
      component: () => import('@/features/viajes/ui/views/PublicarRutaPaso2View.vue'),
    },
    {
      path: '/publicar/borradores',
      name: 'borradores',
      meta: { requiereSesion: true, soloConductor: true },
      component: () => import('@/features/viajes/ui/views/MisBorradoresView.vue'),
    },
    {
      path: '/viajes/:id',
      name: 'viaje',
      meta: { requiereSesion: true },
      component: () => import('@/features/viajes/ui/views/DetalleViajeView.vue'),
    },
    { path: '/:ruta(.*)*', redirect: { name: 'inicio' } },
    {
      path: '/viajes/:id/editar',
      name: 'viaje-editar',
      meta: { requiereSesion: true, soloConductor: true },
      component: () => import('@/features/viajes/ui/views/EditarViajeView.vue'),
    },
  ],
})

registrarGuards(router)

export default router
