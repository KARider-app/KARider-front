<script setup lang="ts">
import { useId, type Component } from 'vue'

defineOptions({ inheritAttrs: false })

defineProps<{
  etiqueta: string
  opciones: { valor: string | number; texto: string }[]
  placeholder?: string
  error?: string
  ayuda?: string
  /** Ícono (lucide) dentro del campo, a la izquierda. */
  icono?: Component
  /** Etiqueta en azul pizarra y fondo gris claro (formularios de publicar/editar). */
  suave?: boolean
}>()

const modelo = defineModel<string | number>({ default: '' })
const id = useId()
</script>

<template>
  <div>
    <label
      class="campo__etiqueta block text-xs mb-1"
      :class="suave ? 'font-semibold text-[#3E5C76]' : 'font-bold text-[#1D2D44]'"
      :for="id"
      >{{ etiqueta }}</label
    >
    <div class="relative">
      <component
        :is="icono"
        v-if="icono"
        class="w-4 h-4 text-[#8AA9C4] absolute left-3 top-3 pointer-events-none"
        aria-hidden="true"
      />
      <select
        :id="id"
        v-model="modelo"
        class="w-full pr-3 py-2.5 text-xs rounded-xl border focus:ring-1 outline-none transition-all"
        :class="[
          suave ? 'bg-[#F8FAFC] font-medium' : 'bg-white',
          icono ? 'pl-9' : 'pl-3',
          error
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
            : 'border-[#C9DCE8] focus:border-[#1D2D44] focus:ring-[#1D2D44]',
        ]"
        :aria-invalid="!!error"
        :aria-describedby="error || ayuda ? `${id}-msg` : undefined"
        v-bind="$attrs"
      >
        <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
        <option v-for="o in opciones" :key="o.valor" :value="o.valor">{{ o.texto }}</option>
      </select>
    </div>
    <p
      v-if="error"
      :id="`${id}-msg`"
      class="text-[10px] font-semibold text-red-600 mt-1 block"
      role="alert"
    >
      {{ error }}
    </p>
    <p v-else-if="ayuda" :id="`${id}-msg`" class="text-[10px] text-[#4B5563] mt-1 block">
      {{ ayuda }}
    </p>
  </div>
</template>
