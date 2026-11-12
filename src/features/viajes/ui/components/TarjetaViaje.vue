<script setup lang="ts">
import { computed } from 'vue'
import { Car, ChevronRight, Clock, MapPin } from 'lucide-vue-next'
import { fechaCorta, horaCorta, mxn } from '@/core/utils/formato'
import AvatarUsuario from '@/shared/components/AvatarUsuario.vue'
import type { ViajeResumen } from '../../domain/tipos'

const props = defineProps<{ viaje: ViajeResumen }>()

const calificacion = computed(() =>
  props.viaje.conductor.totalCalificaciones > 0
    ? props.viaje.conductor.calificacion.toFixed(1)
    : null,
)
</script>

<template>
  <RouterLink
    :to="{ name: 'viaje', params: { id: viaje.id } }"
    class="block p-4 rounded-2xl bg-white border border-[#C9DCE8] shadow-xs hover:border-[#3E5C76] hover:shadow-md transition-all cursor-pointer group"
  >
    <div class="flex items-start justify-between gap-2 pb-2.5 border-b border-[#EDEDED]">
      <div class="flex items-center gap-2.5 min-w-0">
        <AvatarUsuario
          :nombre="viaje.conductor.nombreCompleto"
          :foto-url="viaje.conductor.fotoUrl"
        />
        <div class="min-w-0">
          <div
            class="text-xs font-bold text-[#1D2D44] group-hover:text-[#0284C7] transition-colors truncate"
          >
            {{ viaje.conductor.nombreCompleto }}
          </div>
          <div class="text-[10px] text-[#4B5563] leading-tight">{{ viaje.conductor.carrera }}</div>
          <div
            v-if="calificacion"
            class="text-[10px] font-bold text-amber-600"
            :title="`${calificacion} de 5`"
          >
            ★ {{ calificacion }}
          </div>
          <div v-else class="text-[10px] text-[#4B5563]">Sin calificaciones</div>
        </div>
      </div>
      <div class="text-right shrink-0">
        <div
          class="text-xs font-extrabold text-[#1D2D44] bg-[#EAF2F8] px-2 py-1 rounded-lg inline-block"
        >
          {{ mxn(viaje.aportePorAsiento) }} MXN
        </div>
        <div class="text-[9px] text-[#4B5563] mt-0.5">aporte solidario</div>
      </div>
    </div>

    <div class="py-2.5 space-y-1.5">
      <div class="flex items-center gap-2 text-xs">
        <Clock class="w-3.5 h-3.5 text-[#3E5C76] shrink-0" aria-hidden="true" />
        <span class="font-bold text-[#1D2D44]">{{ horaCorta(viaje.fechaSalida) }}</span>
        <span class="text-[10px] text-[#4B5563]">({{ fechaCorta(viaje.fechaSalida) }})</span>
      </div>
      <div class="flex items-start gap-2 text-xs">
        <MapPin class="w-3.5 h-3.5 text-[#0284C7] shrink-0 mt-0.5" aria-hidden="true" />
        <div class="leading-tight min-w-0">
          <span class="text-[11px] font-medium text-[#4B5563] block">
            Salida: {{ viaje.puntoEncuentro.nombre }}
          </span>
          <span class="font-bold text-[#1D2D44] text-xs block mt-0.5">
            Destino: {{ viaje.destino }}
          </span>
        </div>
      </div>
      <div
        v-if="viaje.paradas.length"
        class="flex items-center gap-1.5 text-[10px] text-[#3E5C76] pl-5 overflow-hidden"
      >
        <span class="font-semibold shrink-0">Paradas:</span>
        <span class="truncate">{{ viaje.paradas.join(' • ') }}</span>
      </div>
    </div>

    <div
      class="pt-2.5 border-t border-[#EDEDED] flex items-center justify-between gap-2 text-[11px]"
    >
      <div class="flex items-center gap-1.5 text-[#4B5563] min-w-0">
        <Car class="w-3.5 h-3.5 text-[#8AA9C4] shrink-0" aria-hidden="true" />
        <span class="truncate">{{ viaje.vehiculo.modelo }} ({{ viaje.vehiculo.color }})</span>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <span
          class="font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px]"
        >
          {{ viaje.asientosDisponibles }} de {{ viaje.asientosOfrecidos }} cupos libres
        </span>
        <ChevronRight
          class="w-4 h-4 text-[#8AA9C4] group-hover:translate-x-0.5 transition-transform"
          aria-hidden="true"
        />
      </div>
    </div>
  </RouterLink>
</template>
