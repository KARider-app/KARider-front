<script setup lang="ts">
import { computed } from 'vue'
import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-vue-next'

const props = withDefaults(defineProps<{ tipo?: 'error' | 'exito' | 'info' | 'aviso' }>(), {
  tipo: 'info',
})

// Avisos con el estilo de los mockups
const estilos = {
  error: {
    caja: 'bg-red-50 border-red-200 text-red-700',
    icono: CircleAlert,
    color: 'text-red-600',
  },
  exito: {
    caja: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    icono: CircleCheck,
    color: 'text-emerald-600',
  },
  info: {
    caja: 'bg-[#EAF2F8] border-[#C9DCE8] text-[#1D2D44]',
    icono: Info,
    color: 'text-[#0284C7]',
  },
  aviso: {
    caja: 'bg-amber-50 border-amber-200 text-amber-800',
    icono: TriangleAlert,
    color: 'text-amber-600',
  },
} as const

const e = computed(() => estilos[props.tipo])
</script>

<template>
  <div
    class="p-3 rounded-xl border text-xs flex items-start gap-2"
    :class="e.caja"
    :role="tipo === 'error' ? 'alert' : 'status'"
  >
    <component :is="e.icono" class="w-4 h-4 shrink-0 mt-px" :class="e.color" aria-hidden="true" />
    <div class="flex-1 flex flex-col gap-2">
      <slot />
    </div>
  </div>
</template>
