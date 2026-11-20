<script setup lang="ts">
import { Download, Share, X } from 'lucide-vue-next'
import BaseButton from './BaseButton.vue'
import { useInstalarApp } from '../composables/useInstalarApp'

const { puedeInstalar, esIosSinPrompt, instalando, instalar, descartar } = useInstalarApp()
</script>

<template>
  <div
    v-if="puedeInstalar || esIosSinPrompt"
    class="fixed bottom-(--alto-nav) left-0 right-0 z-30 p-3 md:bottom-3 md:left-auto md:right-6 md:w-96"
    role="region"
    aria-label="Instalar KARider"
  >
    <div class="p-3.5 rounded-2xl bg-[#1D2D44] text-white shadow-xl flex items-start gap-3">
      <div class="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
        <Download class="w-4.5 h-4.5 text-[#0284C7]" aria-hidden="true" />
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-xs font-bold">Instala KARider en tu celular</p>
        <p v-if="puedeInstalar" class="text-[11px] text-[#C9DCE8] mt-0.5">
          Accede más rápido, sin abrir el navegador cada vez.
        </p>
        <p v-else class="text-[11px] text-[#C9DCE8] mt-0.5 flex items-center gap-1 flex-wrap">
          Toca
          <Share class="w-3.5 h-3.5 inline shrink-0" aria-hidden="true" />
          y luego «Agregar a pantalla de inicio».
        </p>
        <BaseButton
          v-if="puedeInstalar"
          variante="acento"
          class="mt-2.5"
          :cargando="instalando"
          @click="instalar"
        >
          Instalar
        </BaseButton>
      </div>
      <button
        type="button"
        class="text-[#8AA9C4] hover:text-white shrink-0"
        aria-label="Cerrar aviso de instalación"
        @click="descartar"
      >
        <X class="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>
