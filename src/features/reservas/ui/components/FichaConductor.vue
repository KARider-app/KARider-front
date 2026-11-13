<script setup lang="ts">
import { computed } from 'vue'
import { CircleCheck, MessageSquare, Phone } from 'lucide-vue-next'
import AvatarUsuario from '@/shared/components/AvatarUsuario.vue'
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
  <div>
    <div class="flex items-center justify-between gap-2 pb-3 border-b border-[#EDEDED]">
      <div class="flex items-center gap-3 min-w-0">
        <AvatarUsuario
          :nombre="conductor.nombreCompleto"
          :foto-url="conductor.fotoUrl"
          :verificado="conductor.verificado"
          clase="w-12 h-12 border-2 border-[#8AA9C4]"
          clase-insignia="w-3 h-3"
        />
        <div class="min-w-0">
          <div class="text-xs font-bold text-[#1D2D44]">{{ conductor.nombreCompleto }}</div>
          <div class="text-[11px] text-[#4B5563]">{{ conductor.carrera }}</div>
          <div
            v-if="conductor.verificado"
            class="text-[10px] text-emerald-700 font-semibold flex items-center gap-1 mt-0.5"
          >
            <CircleCheck class="w-3 h-3" aria-hidden="true" />
            <span>Comunidad UTTT Verificada</span>
          </div>
        </div>
      </div>
      <div class="text-right shrink-0">
        <template v-if="calificacion">
          <div class="text-xs font-extrabold text-amber-600">★ {{ calificacion }}</div>
          <span class="text-[9px] text-[#4B5563]">
            {{ conductor.totalCalificaciones }}
            {{ conductor.totalCalificaciones === 1 ? 'valoración' : 'valoraciones' }}
          </span>
        </template>
        <span v-else class="text-[9px] text-[#4B5563]">Sin calificaciones todavía</span>
      </div>
    </div>

    <div v-if="conductor.telefono" class="pt-2.5 grid grid-cols-2 gap-2 text-xs">
      <a
        :href="enlaceWhatsApp(conductor.telefono)"
        target="_blank"
        rel="noopener noreferrer"
        class="py-1.5 px-3 rounded-xl bg-[#EAF2F8] text-[#1D2D44] font-semibold flex items-center justify-center gap-1.5 hover:bg-[#C9DCE8]"
      >
        <MessageSquare class="w-3.5 h-3.5 text-[#0284C7]" aria-hidden="true" />
        <span>Enviar Mensaje</span>
      </a>
      <a
        :href="enlaceLlamada(conductor.telefono)"
        class="py-1.5 px-3 rounded-xl bg-[#EAF2F8] text-[#1D2D44] font-semibold flex items-center justify-center gap-1.5 hover:bg-[#C9DCE8]"
      >
        <Phone class="w-3.5 h-3.5 text-[#3E5C76]" aria-hidden="true" />
        <span>Llamar</span>
      </a>
    </div>
    <p v-else-if="esPasajero" class="pt-2.5 text-[11px] text-[#4B5563] italic">
      El contacto del conductor se habilita cuando tu reserva esté confirmada.
    </p>
  </div>
</template>
