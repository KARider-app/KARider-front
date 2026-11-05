<script setup lang="ts">
import { computed } from 'vue'
import AlertMessage from '@/shared/components/AlertMessage.vue'
import BaseButton from '@/shared/components/BaseButton.vue'
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
  <section class="tarjeta compartir" aria-label="Compartir ubicación">
    <h2 class="seccion-titulo">Ubicación en tiempo real</h2>
    <p class="texto-suave">
      Tus pasajeros confirmados verán dónde vas mientras esta pantalla esté abierta. Si cierras la
      app, se deja de compartir.
    </p>
    <AlertMessage v-if="error" tipo="error">{{ error }}</AlertMessage>
    <p v-if="compartiendo" class="estado" role="status">
      Compartiendo tu ubicación<span v-if="hora"> · última actualización {{ hora }}</span>
    </p>
    <BaseButton v-if="!compartiendo" variante="acento" bloque @click="iniciar">
      COMPARTIR MI UBICACIÓN
    </BaseButton>
    <BaseButton v-else variante="secundario" bloque @click="detener">DEJAR DE COMPARTIR</BaseButton>
  </section>
</template>

<style scoped>
.compartir {
  display: flex;
  flex-direction: column;
  gap: var(--espacio-3);
}

.estado {
  font-weight: 600;
  color: var(--color-exito);
}
</style>
