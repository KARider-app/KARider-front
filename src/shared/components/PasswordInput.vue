<script setup lang="ts">
import { ref } from 'vue'
import BaseInput from './BaseInput.vue'

defineOptions({ inheritAttrs: false })

defineProps<{
  etiqueta: string
  error?: string
  ayuda?: string
  /** true = contraseña nueva (registro o cambio); false = contraseña actual (inicio de sesión). */
  nueva?: boolean
}>()

const modelo = defineModel<string>({ default: '' })
const visible = ref(false)
</script>

<template>
  <div class="con-boton">
    <BaseInput
      v-model="modelo"
      :etiqueta="etiqueta"
      :error="error"
      :ayuda="ayuda"
      :type="visible ? 'text' : 'password'"
      :autocomplete="nueva ? 'new-password' : 'current-password'"
      autocapitalize="off"
      spellcheck="false"
      v-bind="$attrs"
    >
      <template #sufijo>
        <button
          type="button"
          class="ojo"
          :aria-label="visible ? 'Ocultar contraseña' : 'Mostrar contraseña'"
          :aria-pressed="visible"
          @click="visible = !visible"
        >
          <svg v-if="visible" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.9 5.1A9.8 9.8 0 0112 5c5 0 9 4.5 10 7a13 13 0 01-3.2 4.3M6.1 6.1C3.9 7.6 2.5 9.8 2 12c1 2.5 5 7 10 7a9.6 9.6 0 004.2-1"
            />
          </svg>
          <svg v-else viewBox="0 0 24 24" aria-hidden="true">
            <path d="M2 12c1-2.5 5-7 10-7s9 4.5 10 7c-1 2.5-5 7-10 7S3 14.5 2 12z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>
      </template>
    </BaseInput>
  </div>
</template>

<style scoped>
.con-boton :deep(.campo__input) {
  padding-right: 48px;
}

.ojo {
  position: absolute;
  right: 4px;
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: var(--radio-sm);
  background: transparent;
  color: var(--color-texto-suave);
  cursor: pointer;
}

.ojo svg {
  width: 22px;
  height: 22px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}
</style>
