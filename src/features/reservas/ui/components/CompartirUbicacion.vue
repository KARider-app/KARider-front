<script setup lang="ts">
import { computed } from 'vue'
import AlertMessage from '@/shared/components/AlertMessage.vue'
import BaseButton from '@/shared/components/BaseButton.vue'
import TarjetaSeccion from '@/shared/components/TarjetaSeccion.vue'
import { Navigation } from 'lucide-vue-next'
import { useCompartirUbicacion } from '../../application/useCompartirUbicacion'

const props = defineProps<{ viajeId: string }>()
const { compartiendo, error, ultimoEnvio, iniciar, detener } = useCompartirUbicacion(
  () => props.viajeId,
)

const hora = computed(() =>
  ultimoEnvio.value
    ? new Intl.DateTimeFormat('es-MX', { timeStyle: 'medium' }).format(ultimoEnvio.value)
    : null,
)
</script>

<template>
  <TarjetaSeccion
    titulo="Ubicación en Tiempo Real"
    :icono="Navigation"
    color-icono="text-[#0284C7]"
  >
    <p class="text-[11px] text-[#3E5C76] leading-relaxed">
      Tus pasajeros confirmados verán dónde vas mientras esta pantalla esté abierta. Si cierras la
      app, se deja de compartir.
    </p>
    <AlertMessage v-if="error" tipo="error">{{ error }}</AlertMessage>
    <p
      v-if="compartiendo"
      class="flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-xl"
      role="status"
    >
      <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" aria-hidden="true" />
      <span>
        Compartiendo tu ubicación<template v-if="hora"> · última actualización {{ hora }}</template>
      </span>
    </p>
    <BaseButton v-if="!compartiendo" variante="acento" bloque @click="iniciar">
      <Navigation class="w-4 h-4" aria-hidden="true" />
      <span>Compartir mi ubicación</span>
    </BaseButton>
    <BaseButton v-else variante="secundario" bloque @click="detener">Dejar de compartir</BaseButton>
  </TarjetaSeccion>
</template>
