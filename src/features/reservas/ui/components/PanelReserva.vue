<script setup lang="ts">
import { computed } from 'vue'
import { mxn } from '@/core/utils/formato'
import AlertMessage from '@/shared/components/AlertMessage.vue'
import BaseButton from '@/shared/components/BaseButton.vue'
import { mensajeDeError } from '@/shared/composables/useApiError'
import type { ViajeDetalle } from '@/features/viajes/domain/tipos'
import { useReservar } from '../../application/useReservar'
import { MAX_ASIENTOS_POR_RESERVA, maximoReservable, montoEstimado } from '../../domain/asientos'
import type { Reserva } from '../../domain/tipos'

const props = defineProps<{ viaje: ViajeDetalle }>()
const emit = defineEmits<{
  reservada: [reserva: Reserva]
  /** El cupo cambió mientras el pasajero decidía: hay que volver a pedir el viaje. */
  actualizar: []
}>()

const { asientos, reservando, error, reservar } = useReservar()

const reservaActiva = computed(() => {
  const r = props.viaje.miReserva
  return r && (r.estado === 'Pendiente' || r.estado === 'Confirmada') ? r : null
})

const maximo = computed(() => maximoReservable(props.viaje.asientosDisponibles))
const acepta = computed(() => props.viaje.estado === 'Programado')
const total = computed(() => montoEstimado(props.viaje.aportePorAsiento, asientos.value))

async function apartar() {
  const reserva = await reservar(props.viaje.id, props.viaje.asientosDisponibles)
  if (reserva) {
    emit('reservada', reserva)
    return
  }
  // Otro pasajero pudo quedarse con el lugar (409): se refresca el cupo mostrado.
  if (error.value?.code === 'VIAJE_SIN_CUPO') emit('actualizar')
}
</script>

<template>
  <section class="tarjeta panel" aria-label="Reserva">
    <!-- Ya tiene una reserva activa en este viaje -->
    <template v-if="reservaActiva">
      <h2 class="seccion-titulo">Tu reserva</h2>
      <p class="folio">{{ reservaActiva.folio }}</p>
      <p>
        {{ reservaActiva.asientos }}
        {{ reservaActiva.asientos === 1 ? 'asiento' : 'asientos' }} ·
        {{ mxn(reservaActiva.montoAporte) }}
      </p>
      <AlertMessage v-if="reservaActiva.estado === 'Pendiente'" tipo="info">
        Tu solicitud está pendiente: el conductor debe aceptarla. Te avisaremos cuando responda.
      </AlertMessage>
      <RouterLink
        v-else
        :to="{ name: 'mapa-reserva', params: { id: reservaActiva.id } }"
        class="enlace-boton"
      >
        VER MAPA Y RUTA
      </RouterLink>
    </template>

    <!-- Viaje que ya no recibe reservas -->
    <AlertMessage v-else-if="!acepta" tipo="aviso">
      Este viaje ya no acepta reservas porque salió, fue cancelado o aún es un borrador.
    </AlertMessage>
    <AlertMessage v-else-if="maximo === 0" tipo="aviso"
      >Ya no hay asientos disponibles.</AlertMessage
    >

    <!-- Apartar asientos -->
    <form v-else class="formulario" @submit.prevent="apartar">
      <fieldset class="selector">
        <legend class="seccion-titulo">¿Cuántos asientos?</legend>
        <div class="selector__opciones">
          <label
            v-for="n in MAX_ASIENTOS_POR_RESERVA"
            :key="n"
            class="selector__opcion"
            :class="{
              'selector__opcion--activa': asientos === n,
              'selector__opcion--inactiva': n > maximo,
            }"
          >
            <input
              v-model="asientos"
              type="radio"
              name="asientos-reserva"
              :value="n"
              :disabled="n > maximo"
              class="sr-only"
            />
            {{ n }}
          </label>
        </div>
      </fieldset>

      <p class="total">
        Aporte total estimado: <strong>{{ mxn(total) }}</strong>
      </p>

      <AlertMessage v-if="error" tipo="error">{{ mensajeDeError(error) }}</AlertMessage>

      <BaseButton type="submit" variante="acento" bloque :cargando="reservando">
        APARTAR ASIENTO
      </BaseButton>
    </form>
  </section>
</template>

<style scoped>
.panel {
  display: flex;
  flex-direction: column;
  gap: var(--espacio-3);
}

.folio {
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.selector {
  display: flex;
  flex-direction: column;
  gap: var(--espacio-2);
  margin: 0;
  padding: 0;
  border: 0;
}

.selector__opciones {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--espacio-2);
}

.selector__opcion {
  display: grid;
  place-items: center;
  min-height: 52px;
  border: 2px solid var(--color-borde);
  border-radius: var(--radio-md);
  background: var(--color-superficie);
  font-size: 1.25rem;
  font-weight: 700;
  cursor: pointer;
}

.selector__opcion--activa {
  border-color: var(--color-primario);
  background: var(--color-primario);
  color: #fff;
}

.selector__opcion--inactiva {
  cursor: not-allowed;
  opacity: 0.35;
}

.selector__opcion:has(input:focus-visible) {
  outline: 3px solid var(--color-acento);
  outline-offset: 2px;
}

.total {
  text-align: center;
}

.enlace-boton {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  border-radius: var(--radio-md);
  background: var(--color-acento);
  color: #fff;
  font-weight: 700;
  text-decoration: none;
}
</style>
