<script setup lang="ts">
import { computed } from 'vue'

/**
 * Logotipo oficial de KARider, con las mismas variantes que los mockups:
 * - horizontal: escudo a la izquierda y wordmark a la derecha
 * - full: escudo arriba y wordmark centrado debajo
 * - shield-only: solo el escudo
 * El escudo es la imagen oficial; el wordmark se dibuja con la "i" en forma de pin.
 */
const props = withDefaults(
  defineProps<{
    variant?: 'horizontal' | 'full' | 'shield-only'
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    textColor?: 'dark' | 'light'
    showSubtitle?: boolean
  }>(),
  { variant: 'horizontal', size: 'md', textColor: 'dark', showSubtitle: true },
)

const tamanos = {
  xs: { shield: 24, text: 'text-base', subtext: 'text-[9px]' },
  sm: { shield: 34, text: 'text-xl', subtext: 'text-[10px]' },
  md: { shield: 46, text: 'text-2xl', subtext: 'text-xs' },
  lg: { shield: 72, text: 'text-3xl', subtext: 'text-sm' },
  xl: { shield: 110, text: 'text-5xl', subtext: 'text-base' },
} as const

const t = computed(() => tamanos[props.size])
const claro = computed(() => props.textColor === 'light')

// Binding dinámico: una ruta estática haría que el compilador la trate como asset.
const escudoSrc = '/logo-karider.png'
</script>

<template>
  <div
    :class="
      variant === 'shield-only'
        ? 'inline-flex items-center justify-center'
        : variant === 'full'
          ? 'inline-flex flex-col items-center justify-center gap-2 text-center'
          : 'inline-flex items-center gap-2.5'
    "
  >
    <img
      :src="escudoSrc"
      alt=""
      aria-hidden="true"
      :width="t.shield"
      :height="t.shield"
      class="shrink-0 object-contain transition-transform hover:scale-105 duration-200 drop-shadow-xs"
      :class="claro ? 'bg-white rounded-xl p-0.5' : ''"
      :style="{ width: `${t.shield}px`, height: `${t.shield}px` }"
    />

    <div
      v-if="variant !== 'shield-only'"
      :class="
        variant === 'full' ? 'flex flex-col items-center' : 'flex flex-col items-start leading-none'
      "
    >
      <div
        class="font-black tracking-tight flex items-baseline select-none"
        :class="[t.text, claro ? 'text-white' : 'text-[#0D233A]']"
        style="font-family: var(--font-heading)"
        role="img"
        aria-label="KARider"
      >
        <span aria-hidden="true">KAR</span>
        <span
          class="relative inline-flex flex-col items-center justify-end mx-[0.5px]"
          aria-hidden="true"
        >
          <span class="w-[0.38em] h-[0.52em] mb-[0.14em] flex items-center justify-center relative">
            <svg viewBox="0 0 24 30" fill="none" class="w-full h-full drop-shadow-xs">
              <path
                d="M 12 0 C 5.37 0 0 5.37 0 12 C 0 19.5 12 30 12 30 C 12 30 24 19.5 24 12 C 24 5.37 18.63 0 12 0 Z"
                fill="#00A8E8"
              />
              <circle cx="12" cy="11" r="4.5" fill="#FFFFFF" />
            </svg>
          </span>
          <span
            class="w-[0.24em] h-[0.68em] rounded-[2px]"
            :class="claro ? 'bg-white' : 'bg-[#0D233A]'"
          />
        </span>
        <span aria-hidden="true">der</span>
      </div>
      <span
        v-if="showSubtitle"
        class="font-semibold tracking-wider uppercase"
        :class="[
          t.subtext,
          variant === 'full' ? 'mt-0.5' : '',
          claro ? 'text-[#C9DCE8]' : 'text-[#3E5C76]',
        ]"
      >
        Carpooling UTTT
      </span>
    </div>
  </div>
</template>
