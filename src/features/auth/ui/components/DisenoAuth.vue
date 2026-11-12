<script setup lang="ts">
import { Fuel, Leaf, ShieldCheck } from 'lucide-vue-next'
import { env } from '@/core/config/env'
import LogoKarider from '@/shared/components/LogoKarider.vue'

/**
 * Contenedor de las pantallas de acceso.
 * - Celular: la pantalla ocupa toda la columna (diseño de los mockups).
 * - Tablet: el formulario se muestra como tarjeta centrada.
 * - PC: pantalla dividida, panel de marca a la izquierda y formulario a la derecha.
 */
const beneficios = [
  {
    titulo: '100% UTTT',
    texto: `Solo cuentas @${env.dominio}`,
    icono: ShieldCheck,
    color: 'text-emerald-300',
  },
  {
    titulo: 'Aporte justo',
    texto: 'Divide la gasolina de forma transparente',
    icono: Fuel,
    color: 'text-sky-300',
  },
  {
    titulo: 'Eco friendly',
    texto: 'Menos autos, menos emisiones',
    icono: Leaf,
    color: 'text-teal-300',
  },
]
</script>

<template>
  <div
    class="flex-1 flex flex-col bg-white md:bg-[#F3F7FA] md:items-center md:justify-center md:p-8 lg:p-0 lg:grid lg:grid-cols-2 lg:items-stretch lg:bg-white"
  >
    <!-- Panel de marca (solo PC) -->
    <aside
      class="hidden lg:flex flex-col justify-between bg-gradient-to-br from-[#1D2D44] via-[#24395A] to-[#3E5C76] text-white p-12 xl:p-16"
    >
      <div class="self-start bg-white rounded-3xl p-4 shadow-xl">
        <LogoKarider variant="full" size="lg" />
      </div>
      <div class="space-y-4 max-w-md">
        <h2 class="text-4xl xl:text-5xl font-black leading-tight tracking-tight">
          Carpooling Universitario UTTT
        </h2>
        <p class="text-sm text-[#C9DCE8] leading-relaxed">
          Comparte ruta desde el campus, divide gasolina de forma justa y viaja seguro con
          compañeros universitarios.
        </p>
      </div>
      <ul class="grid grid-cols-3 gap-3">
        <li
          v-for="b in beneficios"
          :key="b.titulo"
          class="p-3.5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-sm"
        >
          <component :is="b.icono" class="w-5 h-5 mb-1.5" :class="b.color" aria-hidden="true" />
          <span class="font-bold text-sm block">{{ b.titulo }}</span>
          <span class="text-[11px] text-[#C9DCE8] leading-snug">{{ b.texto }}</span>
        </li>
      </ul>
    </aside>

    <!-- Formulario -->
    <div
      class="flex-1 flex flex-col w-full md:flex-none md:max-w-md md:rounded-3xl md:shadow-xl md:border md:border-[#C9DCE8] md:overflow-hidden md:bg-white lg:flex-1 lg:max-w-none lg:rounded-none lg:shadow-none lg:border-0 lg:justify-center lg:py-10 lg:px-12 xl:px-20"
    >
      <div class="flex-1 flex flex-col w-full lg:flex-none lg:max-w-md lg:mx-auto">
        <slot />
      </div>
    </div>
  </div>
</template>
