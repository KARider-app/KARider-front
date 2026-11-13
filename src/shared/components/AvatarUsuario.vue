<script setup lang="ts">
import { computed } from 'vue'
import { ShieldCheck } from 'lucide-vue-next'

/** Foto del usuario (o sus iniciales) con la insignia verde de verificado UTTT. */
const props = withDefaults(
  defineProps<{
    nombre: string
    fotoUrl?: string | null
    /** Clases de tamaño y borde, ej. «w-10 h-10 border border-[#8AA9C4]». */
    clase?: string
    verificado?: boolean
    /** Clases de la insignia de verificado. */
    claseInsignia?: string
  }>(),
  {
    fotoUrl: null,
    clase: 'w-10 h-10 border border-[#8AA9C4]',
    verificado: true,
    claseInsignia: 'w-2.5 h-2.5',
  },
)

const iniciales = computed(() =>
  props.nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join(''),
)
</script>

<template>
  <div class="relative shrink-0">
    <img
      v-if="fotoUrl"
      :src="fotoUrl"
      :alt="nombre"
      class="rounded-full object-cover"
      :class="clase"
    />
    <div
      v-else
      class="rounded-full bg-[#EAF2F8] text-[#1D2D44] font-black flex items-center justify-center text-xs"
      :class="clase"
      role="img"
      :aria-label="nombre"
    >
      {{ iniciales }}
    </div>
    <div v-if="verificado" class="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-0.5">
      <ShieldCheck class="text-white" :class="claseInsignia" aria-hidden="true" />
    </div>
  </div>
</template>
