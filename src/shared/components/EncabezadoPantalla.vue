<script setup lang="ts">
import { ArrowLeft } from 'lucide-vue-next'
import type { RouteLocationRaw } from 'vue-router'

/** Encabezado azul marino de las pantallas internas (mockups de Publicar, Consultar, Detalle…). */
withDefaults(
  defineProps<{
    titulo: string
    /** Destino del enlace «Volver». Sin destino no se muestra. */
    volver?: RouteLocationRaw
    volverTexto?: string
    /** Insignia a la derecha (ej. «Paso 1 de 2»). */
    etiqueta?: string
  }>(),
  { volverTexto: 'Volver' },
)
</script>

<template>
  <header
    class="bg-[#1D2D44] text-white px-5 pt-4 pb-4 rounded-b-2xl md:rounded-none md:px-8 md:py-6 shadow-sm"
  >
    <div class="md:max-w-6xl md:mx-auto">
      <div class="flex items-center justify-between gap-2 mb-2 md:mb-3">
        <RouterLink
          v-if="volver"
          :to="volver"
          class="flex items-center gap-1.5 text-xs text-[#C9DCE8] hover:text-white"
        >
          <ArrowLeft class="w-4 h-4" aria-hidden="true" />
          <span>{{ volverTexto }}</span>
        </RouterLink>
        <span v-else class="w-4" />
        <h1 class="text-xs md:text-base font-bold uppercase tracking-wider font-sans text-center">
          {{ titulo }}
        </h1>
        <slot name="derecha">
          <span
            v-if="etiqueta"
            class="text-[10px] md:text-xs font-mono bg-white/10 px-2 py-0.5 rounded text-[#C9DCE8] whitespace-nowrap"
          >
            {{ etiqueta }}
          </span>
          <span v-else class="w-4" />
        </slot>
      </div>
      <div class="md:text-center md:[&_p]:text-sm">
        <slot />
      </div>
    </div>
  </header>
</template>
