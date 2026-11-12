<script setup lang="ts">
import { useId } from 'vue'

defineProps<{ error?: string }>()
const codigo = defineModel<string>({ default: '' })
const id = useId()

function alEscribir(evento: Event) {
  const input = evento.target as HTMLInputElement
  // Solo dígitos, máximo 6 (también al pegar el código del correo)
  const limpio = input.value.replace(/\D/g, '').slice(0, 6)
  input.value = limpio
  codigo.value = limpio
}
</script>

<template>
  <div class="flex flex-col items-center">
    <label :for="id" class="sr-only">Código de verificación</label>
    <input
      :id="id"
      class="w-48 text-center text-xl font-mono tracking-widest font-black py-2.5 rounded-xl border-2 focus:ring-2 focus:ring-[#0284C7] outline-none bg-white"
      :class="error ? 'border-red-500' : 'border-[#1D2D44]'"
      :value="codigo"
      inputmode="numeric"
      autocomplete="one-time-code"
      pattern="\d{6}"
      maxlength="6"
      placeholder="••••••"
      :aria-invalid="!!error"
      :aria-describedby="error ? `${id}-msg` : undefined"
      @input="alEscribir"
    />
    <p
      v-if="error"
      :id="`${id}-msg`"
      class="text-[10px] font-semibold text-red-600 mt-1"
      role="alert"
    >
      {{ error }}
    </p>
  </div>
</template>
