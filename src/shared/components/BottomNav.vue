<script setup lang="ts">
import { computed } from 'vue'
import type { RouteLocationRaw } from 'vue-router'

const props = defineProps<{ autenticado: boolean; esConductor: boolean }>()
const emit = defineEmits<{ salir: [] }>()

interface Item {
  clave: string
  texto: string
  icono: string
  destino?: RouteLocationRaw
  /** Pantallas de sprints posteriores. */
  proximamente?: boolean
}

// Trazos SVG (24×24) de cada ícono
const iconos = {
  login: 'M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3',
  salir: 'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9',
  publicar: 'M12 3a9 9 0 100 18 9 9 0 000-18zM12 8v8M8 12h8',
  consultar: 'M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.3-4.3',
  mapa: 'M12 2a7 7 0 00-7 7c0 5.25 7 12 7 12s7-6.75 7-12a7 7 0 00-7-7zM12 12a3 3 0 100-6 3 3 0 000 6z',
  perfil: 'M20 21a8 8 0 00-16 0M12 13a5 5 0 100-10 5 5 0 000 10z',
}

const items = computed<Item[]>(() => [
  props.autenticado
    ? { clave: 'salir', texto: 'Salir', icono: iconos.salir }
    : { clave: 'login', texto: 'Login', icono: iconos.login, destino: { name: 'login' } },
  ...(props.esConductor
    ? [
        {
          clave: 'publicar',
          texto: 'Publicar',
          icono: iconos.publicar,
          destino: { name: 'publicar-1' },
        },
      ]
    : []),
  { clave: 'consultar', texto: 'Consultar', icono: iconos.consultar, destino: { name: 'buscar' } },
  { clave: 'mapa', texto: 'Mapa Ruta', icono: iconos.mapa, destino: { name: 'mis-reservas' } },
  { clave: 'perfil', texto: 'Perfil', icono: iconos.perfil, proximamente: true },
])
</script>

<template>
  <nav class="nav" aria-label="Navegación principal">
    <template v-for="item in items" :key="item.clave">
      <RouterLink v-if="item.destino" :to="item.destino" class="nav__item">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path :d="item.icono" /></svg>
        <span>{{ item.texto }}</span>
      </RouterLink>
      <button
        v-else-if="item.clave === 'salir'"
        type="button"
        class="nav__item"
        @click="emit('salir')"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true"><path :d="item.icono" /></svg>
        <span>{{ item.texto }}</span>
      </button>
      <span
        v-else
        class="nav__item nav__item--inactivo"
        aria-disabled="true"
        :title="item.proximamente ? 'Disponible en el siguiente sprint' : undefined"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true"><path :d="item.icono" /></svg>
        <span>{{ item.texto }}</span>
      </span>
    </template>
  </nav>
</template>

<style scoped>
.nav {
  position: fixed;
  inset: auto 0 0;
  z-index: 10;
  display: flex;
  justify-content: space-around;
  height: calc(var(--alto-nav) + env(safe-area-inset-bottom));
  padding-bottom: env(safe-area-inset-bottom);
  background: var(--color-superficie);
  border-top: 1px solid var(--color-borde);
}

.nav__item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  border: 0;
  background: transparent;
  color: var(--color-deshabilitado);
  font-size: 0.6875rem;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
}

.nav__item svg {
  width: 22px;
  height: 22px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.nav__item.router-link-exact-active {
  color: var(--color-acento);
}

.nav__item--inactivo {
  cursor: default;
  opacity: 0.6;
}
</style>
