<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BottomNav from '@/shared/components/BottomNav.vue'
import TopNav from '@/shared/components/TopNav.vue'
import { useAuthStore } from '@/features/auth/application/useAuthStore'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

/** El refresh token venció o fue revocado: limpiar y volver al login. */
function alExpirarSesion() {
  auth.cerrarLocal()
  void router.push({ name: 'login', query: { volver: route.fullPath } })
}

async function salir() {
  await auth.logout()
  await router.push({ name: 'inicio' })
}

onMounted(() => window.addEventListener('karider:sesion-expirada', alExpirarSesion))
onBeforeUnmount(() => window.removeEventListener('karider:sesion-expirada', alExpirarSesion))
</script>

<template>
  <!--
    Celular: columna de 400 px con barra inferior (diseño de los mockups).
    Tablet (md) y PC (lg): barra superior y contenido a todo lo ancho.
  -->
  <div class="min-h-dvh bg-[#F0F4F8] text-[#1D2D44] flex flex-col items-center font-sans">
    <TopNav
      :autenticado="auth.autenticado"
      :es-conductor="auth.esConductor"
      :usuario="auth.usuario"
      @salir="salir"
    />
    <div
      class="w-full max-w-[400px] md:max-w-none min-h-dvh md:min-h-0 md:flex-1 bg-[#F8FAFC] md:bg-[#F3F7FA] flex flex-col relative shadow-2xl md:shadow-none pb-(--alto-nav) md:pb-0"
    >
      <RouterView />
    </div>
    <BottomNav :autenticado="auth.autenticado" :es-conductor="auth.esConductor" @salir="salir" />
  </div>
</template>
