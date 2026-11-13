<script setup lang="ts">
import { computed } from 'vue'
import { useNavegacion, type ItemNavegacion } from '@/shared/composables/useNavegacion'
import LogoKarider from './LogoKarider.vue'
import type { UsuarioSesion } from '@/features/auth/domain/tipos'

const props = defineProps<{
  autenticado: boolean
  esConductor: boolean
  usuario: UsuarioSesion | null
}>()
const emit = defineEmits<{ salir: [] }>()

const { items, esActivo } = useNavegacion(props)

/** «Salir» va a la derecha junto al usuario; el resto son las secciones. */
const secciones = computed(() => items.value.filter((i) => i.clave !== 'salir'))
const salir = computed(() => items.value.find((i) => i.clave === 'salir'))

const iniciales = computed(() =>
  (props.usuario?.nombreCompleto ?? '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join(''),
)

function clases(item: ItemNavegacion) {
  return [
    'px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap',
    esActivo(item)
      ? 'bg-[#0284C7] text-white shadow-xs'
      : 'text-[#C9DCE8] hover:text-white hover:bg-white/10',
  ]
}
</script>

<template>
  <!-- Barra superior: tablet y PC (en celular se usa la barra inferior). -->
  <header
    class="hidden md:block w-full bg-[#1D2D44] text-white border-b border-[#3E5C76] sticky top-0 z-40 shadow-sm"
  >
    <div class="max-w-7xl mx-auto px-4 lg:px-6 py-2.5 flex items-center justify-between gap-4">
      <RouterLink
        :to="{ name: 'inicio' }"
        class="flex items-center gap-3 shrink-0"
        aria-label="Inicio"
      >
        <LogoKarider variant="horizontal" size="sm" text-color="light" />
        <span class="hidden lg:block h-6 w-px bg-white/20" aria-hidden="true" />
        <span class="hidden lg:block text-xs">
          <span class="font-bold text-[#8AA9C4] block">Carpooling Universitario UTTT</span>
          <span class="text-[10px] text-[#C9DCE8]">Comunidad universitaria verificada</span>
        </span>
      </RouterLink>

      <nav
        class="flex items-center gap-1 bg-[#111827]/60 p-1 rounded-xl border border-white/10"
        aria-label="Navegación principal"
      >
        <RouterLink
          v-for="item in secciones"
          :key="item.clave"
          :to="item.destino!"
          :class="clases(item)"
        >
          <component :is="item.icono" class="w-3.5 h-3.5" aria-hidden="true" />
          <span>{{ item.texto }}</span>
        </RouterLink>
      </nav>

      <div class="flex items-center gap-2 shrink-0">
        <template v-if="autenticado && usuario">
          <div class="hidden lg:flex items-center gap-2 text-right">
            <div class="leading-tight">
              <span class="text-xs font-bold block max-w-[160px] truncate">
                {{ usuario.nombreCompleto }}
              </span>
              <span
                class="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                :class="esConductor ? 'bg-sky-100 text-sky-800' : 'bg-emerald-100 text-emerald-800'"
              >
                {{ usuario.rol }}
              </span>
            </div>
            <img
              v-if="usuario.fotoUrl"
              :src="usuario.fotoUrl"
              :alt="usuario.nombreCompleto"
              class="w-8 h-8 rounded-full object-cover border-2 border-[#8AA9C4]"
            />
            <span
              v-else
              class="w-8 h-8 rounded-full border-2 border-[#8AA9C4] bg-[#3E5C76] flex items-center justify-center text-[11px] font-black"
              aria-hidden="true"
            >
              {{ iniciales }}
            </span>
          </div>
          <button
            v-if="salir"
            type="button"
            class="px-2.5 py-1.5 rounded-lg bg-[#3E5C76]/60 hover:bg-[#3E5C76] text-xs font-semibold text-white flex items-center gap-1.5 border border-white/10 transition-colors"
            @click="emit('salir')"
          >
            <component :is="salir.icono" class="w-3.5 h-3.5 text-[#8AA9C4]" aria-hidden="true" />
            <span>Salir</span>
          </button>
        </template>
        <RouterLink
          v-else
          :to="{ name: 'registro' }"
          class="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-colors"
        >
          Crear cuenta
        </RouterLink>
      </div>
    </div>
  </header>
</template>
