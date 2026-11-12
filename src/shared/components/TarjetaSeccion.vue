<script setup lang="ts">
import type { Component } from 'vue'

/** Tarjeta blanca con título e ícono, como las secciones de los formularios de los mockups. */
withDefaults(
  defineProps<{
    titulo?: string
    icono?: Component
    colorIcono?: string
    /** Variante resaltada (degradado azul hielo), como la calculadora de gastos. */
    resaltada?: boolean
    etiqueta?: string
  }>(),
  { colorIcono: 'text-[#3E5C76]' },
)
</script>

<template>
  <section
    class="p-4 rounded-2xl shadow-xs space-y-3"
    :class="
      resaltada
        ? 'bg-gradient-to-br from-[#EAF2F8] to-[#C9DCE8]/40 border border-[#8AA9C4]/50'
        : 'bg-white border border-[#C9DCE8]'
    "
    :aria-label="titulo"
  >
    <div v-if="titulo" class="flex items-center justify-between gap-2">
      <h2 class="flex items-center gap-2 text-xs font-bold text-[#1D2D44] font-sans">
        <component
          :is="icono"
          v-if="icono"
          class="w-4 h-4"
          :class="colorIcono"
          aria-hidden="true"
        />
        <span>{{ titulo }}</span>
      </h2>
      <span
        v-if="etiqueta"
        class="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white text-[#3E5C76]"
      >
        {{ etiqueta }}
      </span>
    </div>
    <slot />
  </section>
</template>
