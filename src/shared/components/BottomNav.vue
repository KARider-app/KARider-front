<script setup lang="ts">
import { useNavegacion, type ItemNavegacion } from '@/shared/composables/useNavegacion'

const props = defineProps<{ autenticado: boolean; esConductor: boolean }>()
const emit = defineEmits<{ salir: [] }>()

const { items, esActivo } = useNavegacion(props)

function clases(item: ItemNavegacion) {
  return [
    'flex flex-col items-center gap-0.5 transition-colors',
    esActivo(item)
      ? item.activoPin
        ? 'text-[#0284C7] font-bold'
        : 'text-[#1D2D44] font-bold'
      : 'text-[#4B5563] hover:text-[#1D2D44]',
  ]
}
</script>

<template>
  <!-- Barra inferior: solo en celular (en tablet y PC se usa la barra superior). -->
  <nav
    class="md:hidden fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[400px] h-(--alto-nav) bg-white border-t border-[#C9DCE8] px-2 pb-[env(safe-area-inset-bottom)] flex items-center justify-around select-none shadow-lg z-20"
    aria-label="Navegación principal"
  >
    <template v-for="item in items" :key="item.clave">
      <RouterLink v-if="item.destino" :to="item.destino" :class="clases(item)">
        <component :is="item.icono" class="w-5 h-5" aria-hidden="true" />
        <span class="text-[10px]">{{ item.texto }}</span>
      </RouterLink>
      <button v-else type="button" :class="clases(item)" @click="emit('salir')">
        <component :is="item.icono" class="w-5 h-5" aria-hidden="true" />
        <span class="text-[10px]">{{ item.texto }}</span>
      </button>
    </template>
  </nav>
</template>
