<script setup lang="ts">
import { computed } from 'vue'
import { Navigation } from 'lucide-vue-next'
import { mxn } from '@/core/utils/formato'
import AlertMessage from '@/shared/components/AlertMessage.vue'
import BaseButton from '@/shared/components/BaseButton.vue'
import { mensajeDeError } from '@/shared/composables/useApiError'
import type { ViajeDetalle } from '@/features/viajes/domain/tipos'
import { useReservar } from '../../application/useReservar'
import { MAX_ASIENTOS_POR_RESERVA, maximoReservable, montoEstimado } from '../../domain/asientos'
import type { Reserva } from '../../domain/tipos'

const props = defineProps<{
  viaje: ViajeDetalle
  /** En PC se muestra como tarjeta en la columna lateral (no fijo abajo). */
  lateral?: boolean
}>()
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
  <section
    class="p-4 bg-white"
    :class="
      lateral
        ? 'rounded-2xl border border-[#C9DCE8] shadow-md'
        : 'sticky bottom-(--alto-nav) md:bottom-0 z-10 border-t border-[#C9DCE8] shadow-lg md:px-8 md:[&>*]:max-w-3xl md:[&>*]:mx-auto'
    "
    aria-label="Reserva"
  >
    <!-- Ya tiene una reserva activa en este viaje -->
    <div v-if="reservaActiva" class="space-y-3">
      <div class="flex items-center justify-between gap-2">
        <div class="text-xs">
          <span class="text-[#4B5563] block text-[10px]">Tu reserva</span>
          <span class="font-mono font-black text-sm text-[#1D2D44]">{{ reservaActiva.folio }}</span>
        </div>
        <div class="text-right text-xs">
          <span class="text-[#4B5563] block text-[10px]">
            {{ reservaActiva.asientos }} {{ reservaActiva.asientos === 1 ? 'asiento' : 'asientos' }}
          </span>
          <span class="text-lg font-black text-[#1D2D44]">
            {{ mxn(reservaActiva.montoAporte) }} MXN
          </span>
        </div>
      </div>
      <AlertMessage v-if="reservaActiva.estado === 'Pendiente'" tipo="info">
        Tu solicitud está pendiente: el conductor debe aceptarla. Te avisaremos cuando responda.
      </AlertMessage>
      <RouterLink
        v-else
        :to="{ name: 'mapa-reserva', params: { id: reservaActiva.id } }"
        class="w-full py-3 rounded-xl bg-[#1D2D44] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#3E5C76] transition-all shadow-md shadow-[#1D2D44]/20 flex items-center justify-center gap-2"
      >
        <Navigation class="w-4 h-4 text-[#8AA9C4]" aria-hidden="true" />
        <span>Ver Mapa y Ruta</span>
      </RouterLink>
    </div>

    <!-- Viaje que ya no recibe reservas -->
    <AlertMessage v-else-if="!acepta" tipo="aviso">
      Este viaje ya no acepta reservas porque salió, fue cancelado o aún es un borrador.
    </AlertMessage>
    <AlertMessage v-else-if="maximo === 0" tipo="aviso"
      >Ya no hay asientos disponibles.</AlertMessage
    >

    <!-- Apartar asientos -->
    <form v-else @submit.prevent="apartar">
      <div class="flex items-center justify-between mb-3">
        <div class="text-xs" aria-live="polite">
          <span class="text-[#4B5563] block text-[10px]">Total de aporte solidario:</span>
          <span class="text-lg font-black text-[#1D2D44]">{{ mxn(total) }} MXN</span>
        </div>
        <fieldset class="flex items-center gap-1">
          <legend class="text-xs font-semibold text-[#3E5C76] mr-1 float-left">Asientos:</legend>
          <label
            v-for="n in MAX_ASIENTOS_POR_RESERVA"
            :key="n"
            class="w-7 h-7 rounded-lg text-xs font-bold border flex items-center justify-center has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#0284C7]"
            :class="[
              asientos === n
                ? 'bg-[#1D2D44] text-white border-[#1D2D44]'
                : 'bg-[#F8FAFC] text-[#4B5563] border-[#C9DCE8]',
              n > maximo ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer',
            ]"
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
        </fieldset>
      </div>

      <AlertMessage v-if="error" tipo="error" class="mb-3">{{
        mensajeDeError(error)
      }}</AlertMessage>

      <BaseButton type="submit" bloque class="!font-bold" :cargando="reservando">
        <span>Apartar Asiento ({{ asientos }})</span>
        <span aria-hidden="true">•</span>
        <span>{{ mxn(total) }} MXN</span>
      </BaseButton>
    </form>
  </section>
</template>
