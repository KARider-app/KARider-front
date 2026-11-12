<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/features/auth/application/useAuthStore'
import { useMisRutas } from '@/features/viajes/application/useMisRutas'
import type { EstadoViaje } from '@/features/viajes/domain/tipos'
import { fechaHora, mxn } from '@/core/utils/formato'
import AlertMessage from '@/shared/components/AlertMessage.vue'
import { mensajeDeError } from '@/shared/composables/useApiError'
import { useMisReservas } from '../../application/useMisReservas'
import type { EstadoReserva } from '../../domain/tipos'

const auth = useAuthStore()
const { reservas, cargando: cargandoReservas, error: errorReservas, cargar: cargarReservas } =
  useMisReservas()
const { rutas, cargando: cargandoRutas, error: errorRutas, cargar: cargarRutas } = useMisRutas()

const textoEstadoReserva: Record<EstadoReserva, string> = {
  Pendiente: 'Pendiente',
  Confirmada: 'Confirmada',
  Rechazada: 'Rechazada',
  Cancelada: 'Cancelada',
  Completada: 'Completada',
}

const textoEstadoViaje: Record<EstadoViaje, string> = {
  Borrador: 'Borrador',
  Programado: 'Programado',
  EnCurso: 'En curso',
  Completado: 'Completado',
  Cancelado: 'Cancelado',
}

onMounted(() => {
  if (auth.esConductor) void cargarRutas()
  else void cargarReservas()
})
</script>

<template>
  <main class="pantalla">
    <header>
      <h1 class="pantalla__titulo">{{ auth.esConductor ? 'Mapa de mis rutas' : 'Mis reservas' }}</h1>
      <p class="pantalla__subtitulo">
        {{
          auth.esConductor
            ? 'Entra a una ruta programada o en curso para compartir tu ubicación.'
            : 'Entra a una reserva confirmada para ver el mapa de tu viaje.'
        }}
      </p>
    </header>

    <template v-if="auth.esConductor">
      <AlertMessage v-if="errorRutas" tipo="error">{{ mensajeDeError(errorRutas) }}</AlertMessage>
      <p v-if="cargandoRutas" class="texto-suave centrado">Cargando…</p>
      <p v-else-if="!errorRutas && rutas.length === 0" class="texto-suave centrado">
        Aún no tienes rutas publicadas.
        <RouterLink :to="{ name: 'publicar-1' }">Publicar una ruta</RouterLink>
      </p>

      <ul class="lista">
        <li v-for="v in rutas" :key="v.id">
          <RouterLink :to="{ name: 'viaje', params: { id: v.id } }" class="tarjeta reserva">
            <span class="reserva__cabecera">
              <strong>{{ v.puntoEncuentro.nombre }} → {{ v.destino }}</strong>
              <span class="estado" :class="`estado--${v.estado}`">{{ textoEstadoViaje[v.estado] }}</span>
            </span>
            <span class="texto-suave">{{ fechaHora(v.fechaSalida) }}</span>
            <span class="texto-suave">
              {{ v.asientosDisponibles }}/{{ v.asientosOfrecidos }} asientos disponibles ·
              {{ mxn(v.aportePorAsiento) }}
            </span>
          </RouterLink>
        </li>
      </ul>
    </template>

    <template v-else>
      <AlertMessage v-if="errorReservas" tipo="error">{{ mensajeDeError(errorReservas) }}</AlertMessage>
      <p v-if="cargandoReservas" class="texto-suave centrado">Cargando…</p>
      <p v-else-if="!errorReservas && reservas.length === 0" class="texto-suave centrado">
        Aún no tienes reservas.
        <RouterLink :to="{ name: 'buscar' }">Buscar un viaje</RouterLink>
      </p>

      <ul class="lista">
        <li v-for="r in reservas" :key="r.id">
          <RouterLink :to="{ name: 'mapa-reserva', params: { id: r.id } }" class="tarjeta reserva">
            <span class="reserva__cabecera">
              <strong>{{ r.viaje.puntoEncuentro.nombre }} → {{ r.viaje.destino }}</strong>
              <span class="estado" :class="`estado--${r.estado}`">{{ textoEstadoReserva[r.estado] }}</span>
            </span>
            <span class="texto-suave">{{ fechaHora(r.viaje.fechaSalida) }}</span>
            <span class="texto-suave">
              {{ r.folio }} · {{ r.asientos }} {{ r.asientos === 1 ? 'asiento' : 'asientos' }} ·
              {{ mxn(r.montoAporte) }}
            </span>
          </RouterLink>
        </li>
      </ul>
    </template>
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

.estado--Confirmada,
.estado--Programado {
  background: var(--color-exito-claro);
  color: var(--color-exito);
}

.estado--Pendiente,
.estado--EnCurso {
  background: var(--color-aviso-claro);
  color: var(--color-aviso);
}

.estado--Rechazada,
.estado--Cancelada,
.estado--Cancelado {
  background: var(--color-error-claro);
  color: var(--color-error);
}
</style>
