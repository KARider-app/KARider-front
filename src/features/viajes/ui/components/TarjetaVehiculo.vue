<script setup lang="ts">
// Se usa con v-bind="vehiculo": los campos extra (id, capacidad) no deben llegar al HTML
defineOptions({ inheritAttrs: false })

defineProps<{
  modelo: string
  color: string
  placas: string
  anio?: number
  verificado: boolean
}>()
</script>

<template>
  <div
    class="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#EDEDED] flex items-center justify-between gap-2 text-xs"
  >
    <div class="min-w-0">
      <span class="font-bold text-[#1D2D44] block truncate"
        >{{ modelo }}<template v-if="anio"> {{ anio }}</template></span
      >
      <span class="text-[10px] text-[#4B5563]">Color {{ color }} • Placas: {{ placas }}</span>
    </div>
    <span
      v-if="verificado"
      class="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shrink-0"
    >
      Verificado
    </span>
    <span
      v-else
      class="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 shrink-0"
    >
      Sin verificar
    </span>
  </div>
</template>
