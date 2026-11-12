<script setup lang="ts">
import { Car } from 'lucide-vue-next'
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
  <fieldset class="p-3 rounded-xl bg-[#EAF2F8] border border-[#C9DCE8] space-y-2">
    <legend
      class="float-left w-full flex items-center gap-1.5 text-xs font-bold text-[#1D2D44] mb-2"
    >
      <Car class="w-4 h-4 text-[#0284C7]" aria-hidden="true" />
      <span>Datos del Auto del Conductor:</span>
    </legend>
    <div class="grid grid-cols-2 gap-2 clear-both">
      <BaseInput
        v-model="vehiculo.modelo"
        etiqueta="Modelo"
        :error="errores['vehiculo.modelo']"
        placeholder="Modelo (ej. Nissan Versa)"
        @blur="emit('validar', 'vehiculo.modelo')"
      />
      <BaseInput
        v-model="vehiculo.placas"
        etiqueta="Placas"
        :error="errores['vehiculo.placas']"
        class="font-mono"
        mayusculas
        autocapitalize="characters"
        maxlength="10"
        placeholder="Placas (ej. HNX-421-C)"
        @blur="emit('validar', 'vehiculo.placas')"
      />
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
    <p v-if="errores.vehiculo" class="text-[10px] font-semibold text-red-600" role="alert">
      {{ errores.vehiculo }}
    </p>
  </fieldset>
</template>
