<script setup lang="ts">
import { Car, User } from 'lucide-vue-next'

type RolSeleccionable = 'Pasajero' | 'Conductor'

defineProps<{
  etiqueta?: string
  /** Variante del registro: textos cortos (Pasajero / Conductor). */ corto?: boolean
}>()
const modelo = defineModel<RolSeleccionable>({ required: true })

const opciones = [
  { valor: 'Pasajero' as const, texto: 'Pasajero UTTT', icono: User },
  { valor: 'Conductor' as const, texto: 'Conductor UTTT', icono: Car },
]
</script>

<template>
  <fieldset>
    <legend
      v-if="etiqueta"
      class="block text-[11px] font-extrabold text-[#3E5C76] uppercase tracking-wider mb-1.5"
    >
      {{ etiqueta }}
    </legend>
    <div class="grid grid-cols-2 gap-2">
      <label
        v-for="o in opciones"
        :key="o.valor"
        class="rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#0284C7]"
        :class="[
          corto ? 'p-2.5' : 'py-2.5 px-3',
          modelo === o.valor
            ? 'border-[#1D2D44] bg-[#1D2D44] text-white shadow-xs'
            : 'border-[#EDEDED] text-[#4B5563] bg-white hover:border-[#8AA9C4]',
        ]"
      >
        <input v-model="modelo" type="radio" name="rol" :value="o.valor" class="sr-only" />
        <component :is="o.icono" class="w-4 h-4" aria-hidden="true" />
        <span>{{ corto ? o.valor : o.texto }}</span>
      </label>
    </div>
  </fieldset>
</template>
