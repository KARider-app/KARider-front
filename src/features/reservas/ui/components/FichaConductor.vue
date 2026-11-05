<script setup lang="ts">
import { computed } from 'vue'
import { enlaceLlamada, enlaceWhatsApp } from '@/core/utils/contacto'
import type { ViajeDetalle } from '@/features/viajes/domain/tipos'

const props = defineProps<{
  conductor: ViajeDetalle['conductor']
  /** Solo el pasajero con reserva confirmada recibe el teléfono (lo decide la API). */
  esPasajero: boolean
}>()

const calificacion = computed(() =>
  props.conductor.totalCalificaciones > 0 ? props.conductor.calificacion.toFixed(1) : null,
)
</script>

<template>
  <div class="ficha">
    <div>
      <strong>{{ conductor.nombreCompleto }}</strong>
      <span v-if="conductor.verificado" class="verificado">Verificado</span>
      <p class="texto-suave">{{ conductor.carrera }}</p>
      <p v-if="calificacion" class="estrellas">
        ★ {{ calificacion }}
        <span class="texto-suave">({{ conductor.totalCalificaciones }})</span>
      </p>
      <p v-else class="texto-suave">Sin calificaciones todavía</p>
    </div>

    <div v-if="conductor.telefono" class="contacto">
      <a :href="enlaceWhatsApp(conductor.telefono)" target="_blank" rel="noopener noreferrer">
        Enviar mensaje
      </a>
      <a :href="enlaceLlamada(conductor.telefono)">Llamar</a>
    </div>
    <p v-else-if="esPasajero" class="texto-suave">
      El contacto del conductor se habilita cuando tu reserva esté confirmada.
    </p>
  </div>
</template>

<style scoped>
.ficha {
  display: flex;
  flex-direction: column;
  gap: var(--espacio-3);
}

.verificado {
  margin-left: var(--espacio-2);
  padding: 2px var(--espacio-2);
  border-radius: var(--radio-pill);
  background: var(--color-exito-claro);
  color: var(--color-exito);
  font-size: 0.75rem;
  font-weight: 700;
}

.estrellas {
  font-weight: 700;
  color: var(--color-aviso);
}

.contacto {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--espacio-2);
}

.contacto a {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  border: 2px solid var(--color-primario);
  border-radius: var(--radio-md);
  font-weight: 700;
  text-decoration: none;
  color: var(--color-primario);
}
</style>
