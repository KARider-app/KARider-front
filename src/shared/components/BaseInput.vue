<script setup lang="ts">
import { useId } from 'vue'

defineOptions({ inheritAttrs: false })

const props = defineProps<{
  etiqueta: string
  error?: string
  ayuda?: string
  /** Convierte a mayúsculas mientras se escribe (ej. placas). */
  mayusculas?: boolean
}>()

const modelo = defineModel<string | number>({ default: '' })
const id = useId()

function alEscribir(evento: Event) {
  const valor = (evento.target as HTMLInputElement).value
  modelo.value = props.mayusculas ? valor.toUpperCase() : valor
}
</script>

<template>
  <div class="campo" :class="{ 'campo--error': error }">
    <div class="campo__fila-etiqueta">
      <label class="campo__etiqueta" :for="id">{{ etiqueta }}</label>
      <slot name="etiqueta-extra" />
    </div>
    <div class="campo__control" :class="{ 'campo__control--con-prefijo': !!$slots.prefijo }">
      <slot name="prefijo" />
      <input
        :id="id"
        class="campo__input"
        :value="modelo"
        :aria-invalid="!!error"
        :aria-describedby="error || ayuda ? `${id}-msg` : undefined"
        v-bind="$attrs"
        @input="alEscribir"
      />
      <slot name="sufijo" />
    </div>
    <p v-if="error" :id="`${id}-msg`" class="campo__error" role="alert">{{ error }}</p>
    <p v-else-if="ayuda" :id="`${id}-msg`" class="campo__ayuda">{{ ayuda }}</p>
  </div>
</template>

<style scoped>
.campo {
  display: flex;
  flex-direction: column;
  gap: var(--espacio-1);
}

.campo__fila-etiqueta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--espacio-2);
}

.campo__etiqueta {
  font-size: 0.875rem;
  font-weight: 600;
}

.campo__control {
  position: relative;
  display: flex;
  align-items: center;
}

.campo__input {
  width: 100%;
  min-height: 48px;
  padding: 0 var(--espacio-3);
  border: 1px solid var(--color-borde);
  border-radius: var(--radio-sm);
  background: var(--color-superficie);
}

.campo__control--con-prefijo .campo__input {
  padding-left: 44px;
}

.campo__input:focus {
  border-color: var(--color-acento);
  outline: none;
  box-shadow: 0 0 0 3px var(--color-acento-claro);
}

.campo--error .campo__input {
  border-color: var(--color-error);
}

.campo__error {
  font-size: 0.8125rem;
  color: var(--color-error);
}

.campo__ayuda {
  font-size: 0.8125rem;
  color: var(--color-texto-suave);
}
</style>
