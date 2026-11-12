import { createRouter, createWebHistory } from 'vue-router'
import { registrarGuards } from './guards'

// Rutas de los Sprints 1 y 2
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
      path: '/viajes',
      name: 'buscar',
      meta: { requiereSesion: true },
      component: () => import('@/features/viajes/ui/views/BuscarViajesView.vue'),
    },
    {
      path: '/viajes/:id',
      name: 'viaje',
      meta: { requiereSesion: true },
      component: () => import('@/features/viajes/ui/views/DetalleViajeView.vue'),
    },
    {
      path: '/reservas',
      name: 'mis-reservas',
      meta: { requiereSesion: true },
      component: () => import('@/features/reservas/ui/views/MisReservasView.vue'),
    },
    {
      path: '/reservas/:id/mapa',
      name: 'mapa-reserva',
      meta: { requiereSesion: true },
      component: () => import('@/features/reservas/ui/views/MapaReservaView.vue'),
    },
    {
      path: '/perfil',
      name: 'perfil',
      meta: { requiereSesion: true },
      component: () => import('@/features/perfil/ui/views/PerfilView.vue'),
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
