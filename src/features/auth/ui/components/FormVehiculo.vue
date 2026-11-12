<script setup lang="ts">
import BaseInput from '@/shared/components/BaseInput.vue'
import BaseSelect from '@/shared/components/BaseSelect.vue'
import type { Errores } from '@/shared/composables/useFormulario'

export interface DatosVehiculo {
  modelo: string
  color: string
  anio: number | ''
  placas: string
  capacidad: number | ''
}

defineProps<{ errores: Errores }>()
const emit = defineEmits<{ validar: [campo: string] }>()
const vehiculo = defineModel<DatosVehiculo>({ required: true })

const anioMax = new Date().getFullYear() + 1
const opcionesCapacidad = [1, 2, 3, 4].map((n) => ({
  valor: n,
  texto: `${n} ${n === 1 ? 'pasajero' : 'pasajeros'}`,
}))
</script>

<template>
  <fieldset class="vehiculo tarjeta">
    <legend class="seccion-titulo">Datos del Auto del Conductor</legend>
    <BaseInput
      v-model="vehiculo.modelo"
      etiqueta="Modelo"
      :error="errores['vehiculo.modelo']"
      placeholder="Ej. Nissan Versa"
      @blur="emit('validar', 'vehiculo.modelo')"
    >
      <template #prefijo>
        <span class="campo__icono campo__icono--prefijo" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11" />
            <rect x="3" y="11" width="18" height="6" rx="2" />
            <circle cx="7.5" cy="17" r="1.5" />
            <circle cx="16.5" cy="17" r="1.5" />
          </svg>
        </span>
      </template>
    </BaseInput>
    <BaseInput
      v-model="vehiculo.placas"
      etiqueta="Placas"
      :error="errores['vehiculo.placas']"
      mayusculas
      autocapitalize="characters"
      maxlength="10"
      placeholder="Ej. HNX-421-C"
      @blur="emit('validar', 'vehiculo.placas')"
    >
      <template #prefijo>
        <span class="campo__icono campo__icono--prefijo" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="M3 10h18" />
            <path d="M7 15h4" />
          </svg>
        </span>
      </template>
    </BaseInput>
    <div class="fila">
      <BaseInput
        v-model="vehiculo.color"
        etiqueta="Color"
        :error="errores['vehiculo.color']"
        placeholder="Ej. Gris"
        @blur="emit('validar', 'vehiculo.color')"
      />
      <BaseInput
        v-model="vehiculo.anio"
        etiqueta="Año"
        :error="errores['vehiculo.anio']"
        type="number"
        inputmode="numeric"
        min="1990"
        :max="anioMax"
        placeholder="Ej. 2019"
        @blur="emit('validar', 'vehiculo.anio')"
      />
    </div>
    <BaseSelect
      v-model="vehiculo.capacidad"
      etiqueta="Capacidad para pasajeros"
      placeholder="Selecciona"
      :opciones="opcionesCapacidad"
      :error="errores['vehiculo.capacidad']"
    />
    <p v-if="errores.vehiculo" class="error" role="alert">{{ errores.vehiculo }}</p>
  </fieldset>
</template>

<style scoped>
.vehiculo {
  display: flex;
  flex-direction: column;
  gap: var(--espacio-4);
  margin: 0;
}

.vehiculo legend {
  float: left;
  width: 100%;
}

.error {
  font-size: 0.8125rem;
  color: var(--color-error);
}
</style>
