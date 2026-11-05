<script setup lang="ts">
import { onMounted } from 'vue'
import { fechaHora, mxn } from '@/core/utils/formato'
import AlertMessage from '@/shared/components/AlertMessage.vue'
import { mensajeDeError } from '@/shared/composables/useApiError'
import { useMisReservas } from '../../application/useMisReservas'
import type { EstadoReserva } from '../../domain/tipos'

const { reservas, cargando, error, cargar } = useMisReservas()

const textoEstado: Record<EstadoReserva, string> = {
  Pendiente: 'Pendiente',
  Confirmada: 'Confirmada',
  Rechazada: 'Rechazada',
  Cancelada: 'Cancelada',
  Completada: 'Completada',
}

onMounted(cargar)
</script>

<template>
  <main class="pantalla">
    <header>
      <h1 class="pantalla__titulo">Mis reservas</h1>
      <p class="pantalla__subtitulo">
        Entra a una reserva confirmada para ver el mapa de tu viaje.
      </p>
    </header>

    <AlertMessage v-if="error" tipo="error">{{ mensajeDeError(error) }}</AlertMessage>
    <p v-if="cargando" class="texto-suave centrado">Cargando…</p>
    <p v-else-if="!error && reservas.length === 0" class="texto-suave centrado">
      Aún no tienes reservas.
      <RouterLink :to="{ name: 'buscar' }">Buscar un viaje</RouterLink>
    </p>

    <ul class="lista">
      <li v-for="r in reservas" :key="r.id">
        <RouterLink :to="{ name: 'mapa-reserva', params: { id: r.id } }" class="tarjeta reserva">
          <span class="reserva__cabecera">
            <strong>{{ r.viaje.puntoEncuentro.nombre }} → {{ r.viaje.destino }}</strong>
            <span class="estado" :class="`estado--${r.estado}`">{{ textoEstado[r.estado] }}</span>
          </span>
          <span class="texto-suave">{{ fechaHora(r.viaje.fechaSalida) }}</span>
          <span class="texto-suave">
            {{ r.folio }} · {{ r.asientos }} {{ r.asientos === 1 ? 'asiento' : 'asientos' }} ·
            {{ mxn(r.montoAporte) }}
          </span>
        </RouterLink>
      </li>
    </ul>
  </main>
</template>

<style scoped>
.lista {
  display: flex;
  flex-direction: column;
  gap: var(--espacio-3);
  margin: 0;
  padding: 0;
  list-style: none;
}

.reserva {
  display: flex;
  flex-direction: column;
  gap: 2px;
  color: inherit;
  text-decoration: none;
}

.reserva:hover {
  border-color: var(--color-acento);
}

.reserva__cabecera {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--espacio-3);
}

.estado {
  flex-shrink: 0;
  padding: 2px var(--espacio-3);
  border-radius: var(--radio-pill);
  background: #e6ebf2;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
}

.estado--Confirmada {
  background: var(--color-exito-claro);
  color: var(--color-exito);
}

.estado--Pendiente {
  background: var(--color-aviso-claro);
  color: var(--color-aviso);
}

.estado--Rechazada,
.estado--Cancelada {
  background: var(--color-error-claro);
  color: var(--color-error);
}
</style>
