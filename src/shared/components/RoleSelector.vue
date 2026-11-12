<script setup lang="ts">
type RolSeleccionable = 'Pasajero' | 'Conductor'

defineProps<{ etiqueta?: string }>()
const modelo = defineModel<RolSeleccionable>({ required: true })

const opciones: { valor: RolSeleccionable; texto: string }[] = [
  { valor: 'Pasajero', texto: 'Pasajero UTTT' },
  { valor: 'Conductor', texto: 'Conductor UTTT' },
]
</script>

<template>
  <fieldset class="roles">
    <legend v-if="etiqueta" class="roles__etiqueta">{{ etiqueta }}</legend>
    <div class="roles__opciones">
      <label
        v-for="o in opciones"
        :key="o.valor"
        class="roles__opcion"
        :class="{ 'roles__opcion--activa': modelo === o.valor }"
      >
        <input v-model="modelo" type="radio" name="rol" :value="o.valor" class="sr-only" />
        <svg v-if="o.valor === 'Pasajero'" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21a8 8 0 0 1 16 0" />
        </svg>
        <svg v-else viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11" />
          <rect x="3" y="11" width="18" height="6" rx="2" />
          <circle cx="7.5" cy="17" r="1.5" />
          <circle cx="16.5" cy="17" r="1.5" />
        </svg>
        {{ o.texto }}
      </label>
    </div>
  </fieldset>
</template>

<style scoped>
.roles {
  display: flex;
  flex-direction: column;
  gap: var(--espacio-2);
  margin: 0;
  padding: 0;
  border: 0;
}

.roles__etiqueta {
  padding: 0;
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-texto-suave);
}

.roles__opciones {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--espacio-1);
  padding: var(--espacio-1);
  border-radius: var(--radio-pill);
  background: #e6ebf2;
}

.roles__opcion {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--espacio-2);
  min-height: 44px;
  border-radius: var(--radio-pill);
  font-weight: 600;
  color: var(--color-texto-suave);
  cursor: pointer;
}

.roles__opcion svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.roles__opcion--activa {
  background: var(--color-primario);
  color: #fff;
  box-shadow: var(--sombra-sm);
}

.roles__opcion:has(input:focus-visible) {
  outline: 3px solid var(--color-acento);
  outline-offset: 2px;
}
</style>
