<script setup lang="ts">
import { ref } from 'vue'
import { Eye, EyeOff, Lock } from 'lucide-vue-next'
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
  <BaseInput
    v-model="modelo"
    :etiqueta="etiqueta"
    :error="error"
    :ayuda="ayuda"
    :icono="Lock"
    :type="visible ? 'text' : 'password'"
    :autocomplete="nueva ? 'new-password' : 'current-password'"
    autocapitalize="off"
    spellcheck="false"
    class="!pr-10"
    v-bind="$attrs"
  >
    <template #etiqueta-extra>
      <slot name="etiqueta-extra" />
    </template>
    <template #sufijo>
      <button
        type="button"
        class="absolute right-3 top-2.5 text-[#8AA9C4] hover:text-[#1D2D44]"
        :aria-label="visible ? 'Ocultar contraseña' : 'Mostrar contraseña'"
        :aria-pressed="visible"
        @click="visible = !visible"
      >
        <EyeOff v-if="visible" class="w-4 h-4" aria-hidden="true" />
        <Eye v-else class="w-4 h-4" aria-hidden="true" />
      </button>
    </template>
  </BaseInput>
</template>
