import '@/shared/styles/base.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { useAuthStore } from '@/features/auth/application/useAuthStore'
import { limpiarCachesObsoletas } from '@/core/pwa/limpiarCaches'

async function iniciar() {
  const app = createApp(App)
  app.use(createPinia())

  // Recupera la sesión ANTES de montar el router, para que los guards la vean
  await useAuthStore().restaurar()

  app.use(router)
  app.mount('#app')
}

void iniciar()
void limpiarCachesObsoletas()
