<script setup lang="ts">
withDefaults(
  defineProps<{
    variante?: 'primario' | 'secundario' | 'acento' | 'texto'
    type?: 'button' | 'submit'
    cargando?: boolean
    disabled?: boolean
    bloque?: boolean
  }>(),
  { variante: 'primario', type: 'button', cargando: false, disabled: false, bloque: false },
)

// Estilos de botón de los mockups
const variantes = {
  primario:
    'py-3 px-4 rounded-xl bg-[#1D2D44] text-white font-extrabold text-xs uppercase tracking-wider hover:bg-[#3E5C76] shadow-md shadow-[#1D2D44]/20',
  secundario:
    'py-2.5 px-4 rounded-xl border-2 border-[#1D2D44] text-[#1D2D44] bg-white font-bold text-xs hover:bg-[#EAF2F8]',
  acento:
    'py-3 px-4 rounded-xl bg-[#0284C7] text-white font-extrabold text-xs uppercase tracking-wider hover:bg-sky-700 shadow-md shadow-sky-600/20',
  texto: 'py-1.5 px-2 text-[11px] font-semibold text-[#0284C7] hover:underline',
} as const
</script>

<template>
  <button
    :type="type"
    class="inline-flex items-center justify-center gap-2 transition-all disabled:opacity-55 disabled:cursor-not-allowed"
    :class="[variantes[variante], { 'w-full': bloque }]"
    :disabled="disabled || cargando"
    :aria-busy="cargando"
  >
    <span
      v-if="cargando"
      class="w-4 h-4 border-2 border-current border-r-transparent rounded-full animate-spin"
      aria-hidden="true"
    />
    <slot />
  </button>
</template>
