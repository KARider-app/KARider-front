<script setup lang="ts">
import { onMounted } from 'vue'
import { ArrowLeft, Car, ChevronRight, Clock, MapPin, Navigation } from 'lucide-vue-next'
import { useAuthStore } from '@/features/auth/application/useAuthStore'
import { useMisRutas } from '@/features/viajes/application/useMisRutas'
import type { EstadoViaje } from '@/features/viajes/domain/tipos'
import { fechaHora, mxn } from '@/core/utils/formato'
import AlertMessage from '@/shared/components/AlertMessage.vue'
import { mensajeDeError } from '@/shared/composables/useApiError'
import { useMisReservas } from '../../application/useMisReservas'
import type { EstadoReserva } from '../../domain/tipos'

const auth = useAuthStore()
const {
  reservas,
  cargando: cargandoReservas,
  error: errorReservas,
  cargar: cargarReservas,
} = useMisReservas()
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

const estiloReserva: Record<EstadoReserva, string> = {
  Pendiente: 'bg-amber-50 text-amber-800 border-amber-200',
  Confirmada: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  Rechazada: 'bg-red-50 text-red-700 border-red-200',
  Cancelada: 'bg-red-50 text-red-700 border-red-200',
  Completada: 'bg-[#EAF2F8] text-[#1D2D44] border-[#C9DCE8]',
}

const estiloViaje: Record<EstadoViaje, string> = {
  Borrador: 'bg-amber-50 text-amber-800 border-amber-200',
  Programado: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  EnCurso: 'bg-sky-50 text-sky-800 border-sky-200',
  Completado: 'bg-[#EAF2F8] text-[#1D2D44] border-[#C9DCE8]',
  Cancelado: 'bg-red-50 text-red-700 border-red-200',
}
</script>

<template>
  <main class="flex flex-col min-h-full flex-1 bg-[#F3F7FA] text-[#1D2D44]">
    <header class="bg-[#1D2D44] text-white px-5 pt-4 pb-4 rounded-b-2xl shadow-sm">
      <div class="flex items-center justify-between mb-2">
        <RouterLink
          :to="{ name: 'inicio' }"
          class="flex items-center gap-1.5 text-xs text-[#C9DCE8] hover:text-white"
        >
          <ArrowLeft class="w-4 h-4" aria-hidden="true" />
          <span>Volver</span>
        </RouterLink>
        <span class="text-xs font-bold uppercase tracking-wider">Mapa Ruta</span>
        <span class="w-12" />
      </div>
      <h1 class="text-sm font-extrabold text-white flex items-center gap-1.5 font-sans">
        <Navigation class="w-4 h-4 text-[#0284C7]" aria-hidden="true" />
        <span>{{ auth.esConductor ? 'Mapa de mis rutas' : 'Mis reservas' }}</span>
      </h1>
      <p class="text-xs text-[#C9DCE8] mt-0.5">
        {{
          auth.esConductor
            ? 'Entra a una ruta programada o en curso para compartir tu ubicación.'
            : 'Entra a una reserva confirmada para ver el mapa de tu viaje.'
        }}
      </p>
    </header>

    <div class="p-5 space-y-3 flex-1">
      <template v-if="auth.esConductor">
        <AlertMessage v-if="errorRutas" tipo="error">{{ mensajeDeError(errorRutas) }}</AlertMessage>
        <p v-if="cargandoRutas" class="py-8 text-center text-xs text-[#4B5563]">Cargando…</p>
        <section
          v-else-if="!errorRutas && rutas.length === 0"
          class="py-12 px-4 text-center rounded-2xl bg-white border border-[#C9DCE8]"
        >
          <Car class="w-10 h-10 text-[#8AA9C4] mx-auto mb-2" aria-hidden="true" />
          <h2 class="text-sm font-bold text-[#1D2D44] font-sans">Aún no tienes rutas publicadas</h2>
          <RouterLink
            :to="{ name: 'publicar-1' }"
            class="inline-block mt-4 px-4 py-2 rounded-xl bg-[#1D2D44] text-white text-xs font-bold hover:bg-[#3E5C76]"
          >
            Publicar una ruta
          </RouterLink>
        </section>

        <ul class="space-y-3">
          <li v-for="v in rutas" :key="v.id">
            <RouterLink
              :to="{ name: 'viaje', params: { id: v.id } }"
              class="block p-4 rounded-2xl bg-white border border-[#C9DCE8] shadow-xs hover:border-[#3E5C76] hover:shadow-md transition-all group"
            >
              <div class="flex items-start justify-between gap-2">
                <div class="space-y-1 min-w-0">
                  <div class="flex items-center gap-2 text-xs text-[#4B5563]">
                    <Clock class="w-3.5 h-3.5 text-[#3E5C76]" aria-hidden="true" />
                    <span>{{ fechaHora(v.fechaSalida) }}</span>
                  </div>
                  <div class="text-sm font-bold text-[#1D2D44]">
                    {{ v.puntoEncuentro.nombre }} → {{ v.destino }}
                  </div>
                  <div class="text-[11px] text-[#3E5C76]">
                    {{ v.asientosDisponibles }}/{{ v.asientosOfrecidos }} asientos disponibles ·
                    {{ mxn(v.aportePorAsiento) }}
                  </div>
                </div>
                <div class="flex flex-col items-end gap-2 shrink-0">
                  <span
                    class="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                    :class="estiloViaje[v.estado]"
                  >
                    {{ textoEstadoViaje[v.estado] }}
                  </span>
                  <ChevronRight
                    class="w-4 h-4 text-[#8AA9C4] group-hover:translate-x-0.5 transition-transform"
                    aria-hidden="true"
                  />
                </div>
              </div>
            </RouterLink>
          </li>
        </ul>
      </template>

      <template v-else>
        <AlertMessage v-if="errorReservas" tipo="error">{{
          mensajeDeError(errorReservas)
        }}</AlertMessage>
        <p v-if="cargandoReservas" class="py-8 text-center text-xs text-[#4B5563]">Cargando…</p>
        <section
          v-else-if="!errorReservas && reservas.length === 0"
          class="py-12 px-4 text-center rounded-2xl bg-white border border-[#C9DCE8]"
        >
          <MapPin class="w-10 h-10 text-[#8AA9C4] mx-auto mb-2" aria-hidden="true" />
          <h2 class="text-sm font-bold text-[#1D2D44] font-sans">Aún no tienes reservas</h2>
          <RouterLink
            :to="{ name: 'buscar' }"
            class="inline-block mt-4 px-4 py-2 rounded-xl bg-[#1D2D44] text-white text-xs font-bold hover:bg-[#3E5C76]"
          >
            Buscar un viaje
          </RouterLink>
        </section>

        <ul class="space-y-3">
          <li v-for="r in reservas" :key="r.id">
            <RouterLink
              :to="{ name: 'mapa-reserva', params: { id: r.id } }"
              class="block p-4 rounded-2xl bg-white border border-[#C9DCE8] shadow-xs hover:border-[#3E5C76] hover:shadow-md transition-all group"
            >
              <div class="flex items-start justify-between gap-2">
                <div class="space-y-1 min-w-0">
                  <div class="flex items-center gap-2 text-xs text-[#4B5563]">
                    <Clock class="w-3.5 h-3.5 text-[#3E5C76]" aria-hidden="true" />
                    <span>{{ fechaHora(r.viaje.fechaSalida) }}</span>
                  </div>
                  <div class="text-sm font-bold text-[#1D2D44]">
                    {{ r.viaje.puntoEncuentro.nombre }} → {{ r.viaje.destino }}
                  </div>
                  <div class="text-[11px] text-[#3E5C76] flex items-center gap-1.5 flex-wrap">
                    <span
                      class="font-mono font-bold text-[#1D2D44] bg-[#EAF2F8] px-1.5 py-0.5 rounded"
                      >{{ r.folio }}</span
                    >
                    <span>
                      {{ r.asientos }} {{ r.asientos === 1 ? 'asiento' : 'asientos' }} ·
                      {{ mxn(r.montoAporte) }}
                    </span>
                  </div>
                </div>
                <div class="flex flex-col items-end gap-2 shrink-0">
                  <span
                    class="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                    :class="estiloReserva[r.estado]"
                  >
                    {{ textoEstadoReserva[r.estado] }}
                  </span>
                  <ChevronRight
                    class="w-4 h-4 text-[#8AA9C4] group-hover:translate-x-0.5 transition-transform"
                    aria-hidden="true"
                  />
                </div>
              </div>
            </RouterLink>
          </li>
        </ul>
      </template>
    </div>
  </main>
</template>
