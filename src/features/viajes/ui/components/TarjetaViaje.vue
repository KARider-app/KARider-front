<script setup lang="ts">
import { computed } from 'vue'
import { fechaHora, mxn } from '@/core/utils/formato'
import type { ViajeResumen } from '../../domain/tipos'

const props = defineProps<{ viaje: ViajeResumen }>()

const calificacion = computed(() =>
  props.viaje.conductor.totalCalificaciones > 0
    ? props.viaje.conductor.calificacion.toFixed(1)
    : null,
)
</script>

<template>
  <RouterLink :to="{ name: 'viaje', params: { id: viaje.id } }" class="tarjeta viaje">
    <div class="viaje__ruta">
      <strong>{{ viaje.puntoEncuentro.nombre }} → {{ viaje.destino }}</strong>
      <span class="viaje__aporte">{{ mxn(viaje.aportePorAsiento) }}</span>
    </div>

    <span class="texto-suave">{{ fechaHora(viaje.fechaSalida) }}</span>

    <p v-if="viaje.paradas.length" class="texto-suave">Paradas: {{ viaje.paradas.join(' · ') }}</p>

    <div class="viaje__pie">
      <span class="viaje__conductor">
        {{ viaje.conductor.nombreCompleto }}
        <span class="texto-suave">· {{ viaje.conductor.carrera }}</span>
      </span>
      <span v-if="calificacion" class="viaje__estrellas" :title="`${calificacion} de 5`">
        ★ {{ calificacion }}
      </span>
      <span v-else class="texto-suave">Sin calificaciones</span>
    </div>

    <div class="viaje__pie texto-suave">
      <span>{{ viaje.vehiculo.modelo }} · {{ viaje.vehiculo.color }}</span>
      <span>
        {{ viaje.asientosDisponibles }}
        {{ viaje.asientosDisponibles === 1 ? 'asiento' : 'asientos' }}
      </span>
    </div>
  </RouterLink>
</template>

<style scoped>
.viaje {
  display: flex;
  flex-direction: column;
  gap: var(--espacio-1);
  color: inherit;
  text-decoration: none;
}

.viaje:hover {
  border-color: var(--color-acento);
}

.viaje__ruta,
.viaje__pie {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--espacio-3);
}

.viaje__aporte {
  flex-shrink: 0;
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--color-exito);
}

.viaje__conductor {
  font-weight: 600;
  overflow-wrap: anywhere;
}

.viaje__estrellas {
  flex-shrink: 0;
  font-weight: 700;
  color: var(--color-aviso);
}
</style>
