<script setup lang="ts">
import { computed, type Component } from 'vue'
import { useRoute, type RouteLocationRaw } from 'vue-router'
import { CirclePlus, LogIn, LogOut, MapPin, Search, UserCheck } from 'lucide-vue-next'

const props = defineProps<{ autenticado: boolean; esConductor: boolean }>()
const emit = defineEmits<{ salir: [] }>()

const route = useRoute()

interface Item {
  clave: string
  texto: string
  icono: Component
  destino?: RouteLocationRaw
  /** Rutas en las que la pestaña se marca como activa. */
  rutas: string[]
  /** Color de la pestaña activa (como en los mockups: navy o azul pin). */
  colorActivo: string
}

const NAVY = 'text-[#1D2D44] font-bold'
const PIN = 'text-[#0284C7] font-bold'

const items = computed<Item[]>(() => [
  props.autenticado
    ? { clave: 'salir', texto: 'Salir', icono: LogOut, rutas: [], colorActivo: NAVY }
    : {
        clave: 'login',
        texto: 'Login',
        icono: LogIn,
        destino: { name: 'login' },
        rutas: ['login', 'registro', 'verificar', 'recuperar'],
        colorActivo: NAVY,
      },
  ...(props.esConductor
    ? [
        {
          clave: 'publicar',
          texto: 'Publicar',
          icono: CirclePlus,
          destino: { name: 'publicar-1' },
          rutas: ['publicar-1', 'publicar-2', 'borradores', 'viaje-editar'],
          colorActivo: PIN,
        },
      ]
    : []),
  {
    clave: 'consultar',
    texto: 'Consultar',
    icono: Search,
    destino: { name: 'buscar' },
    rutas: ['buscar', 'viaje'],
    colorActivo: PIN,
  },
  {
    clave: 'mapa',
    texto: 'Mapa Ruta',
    icono: MapPin,
    destino: { name: 'mis-reservas' },
    rutas: ['mis-reservas', 'mapa-reserva'],
    colorActivo: PIN,
  },
  {
    clave: 'perfil',
    texto: 'Perfil',
    icono: UserCheck,
    destino: { name: 'perfil' },
    rutas: ['perfil'],
    colorActivo: NAVY,
  },
])

function clases(item: Item) {
  const activo = item.rutas.includes(String(route.name ?? ''))
  return [
    'flex flex-col items-center gap-0.5 transition-colors',
    activo ? item.colorActivo : 'text-[#4B5563] hover:text-[#1D2D44]',
  ]
}
</script>

<template>
  <nav
    class="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[400px] h-(--alto-nav) bg-white border-t border-[#C9DCE8] px-2 pb-[env(safe-area-inset-bottom)] flex items-center justify-around select-none shadow-lg z-20"
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
