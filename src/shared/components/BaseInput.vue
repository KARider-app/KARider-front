<script setup lang="ts">
import { useId, type Component } from 'vue'

defineOptions({ inheritAttrs: false })

const props = defineProps<{
  etiqueta: string
  error?: string
  ayuda?: string
  /** Convierte a mayúsculas mientras se escribe (ej. placas). */
  mayusculas?: boolean
  /** Bloquea caracteres no permitidos mientras se escribe (no solo al validar). */
  filtro?: 'letras' | 'numeros' | 'alfanumerico'
  /** Ícono (lucide) dentro del campo, a la izquierda. */
  icono?: Component
  /** Etiqueta en azul pizarra (formularios de publicar/editar). */
  suave?: boolean
}>()

const modelo = defineModel<string | number>({ default: '' })
const id = useId()

const filtros: Record<NonNullable<typeof props.filtro>, RegExp> = {
  letras: /[^\p{L}\s]/gu,
  numeros: /\D/g,
  alfanumerico: /[^A-Za-z0-9]/g,
}

function alEscribir(evento: Event) {
  const input = evento.target as HTMLInputElement
  let valor = input.value
  if (props.filtro) valor = valor.replace(filtros[props.filtro], '')
  if (props.mayusculas) valor = valor.toUpperCase()
  modelo.value = valor
  // Si se removieron caracteres, el input nativo queda desincronizado del v-model; se corrige aquí.
  if (input.value !== valor) input.value = valor
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-1 gap-2">
      <label
        class="campo__etiqueta block text-xs"
        :class="suave ? 'font-semibold text-[#3E5C76]' : 'font-bold text-[#1D2D44]'"
        :for="id"
        >{{ etiqueta }}</label
      >
      <slot name="etiqueta-extra" />
    </div>
    <div class="relative">
      <component
        :is="icono"
        v-if="icono"
        class="w-4 h-4 text-[#8AA9C4] absolute left-3 top-3 pointer-events-none"
        aria-hidden="true"
      />
      <slot name="prefijo" />
      <input
        :id="id"
        class="w-full pr-3 py-2.5 text-xs rounded-xl border focus:ring-1 outline-none transition-all"
        :class="[
          'bg-white',
          icono || $slots.prefijo ? 'pl-9' : 'pl-3',
          error
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
            : 'border-[#C9DCE8] focus:border-[#1D2D44] focus:ring-[#1D2D44]',
        ]"
        :value="modelo"
        :aria-invalid="!!error"
        :aria-describedby="error || ayuda ? `${id}-msg` : undefined"
        v-bind="$attrs"
        @input="alEscribir"
      />
      <slot name="sufijo" />
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
