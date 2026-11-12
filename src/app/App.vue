<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BottomNav from '@/shared/components/BottomNav.vue'
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
  <div class="min-h-dvh bg-[#F0F4F8] text-[#1D2D44] flex justify-center font-sans">
    <div
      class="w-full max-w-[400px] min-h-dvh bg-[#F8FAFC] flex flex-col relative shadow-2xl pb-(--alto-nav)"
    >
      <RouterView />
    </div>
    <BottomNav :autenticado="auth.autenticado" :es-conductor="auth.esConductor" @salir="salir" />
  </div>
</template>
