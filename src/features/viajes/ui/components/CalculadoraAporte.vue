<script setup lang="ts">
// Importa computed para crear un valor calculado que se actualiza
// automáticamente cuando cambian sus dependencias.
import { computed } from 'vue'
import { Fuel } from 'lucide-vue-next'

// Importa la función mxn, que permite mostrar cantidades en formato
// de moneda mexicana (pesos mexicanos).
import { mxn } from '@/core/utils/formato'

// Componentes reutilizables: campo de captura y tarjeta de sección.
import BaseInput from '@/shared/components/BaseInput.vue'
import TarjetaSeccion from '@/shared/components/TarjetaSeccion.vue'

// Importa la función que calcula el aporte económico por pasajero.
import { calcularAporte } from '../../domain/aporte'

// Importa la constante que establece el gasto máximo permitido.
import { GASTO_MAXIMO } from '../../domain/esquemas'

// asientos: número de asientos disponibles para pasajeros.
// error: mensaje opcional que se muestra si existe un error de validación.
// numero: prefijo del título de la sección (ej. «3.»).
const props = withDefaults(
  defineProps<{
    asientos: number
    error?: string
    numero?: string
  }>(),
  { numero: '3.' },
)

// Avisa al componente padre cuando se necesita validar el gasto ingresado.
const emit = defineEmits<{
  validar: []
}>()

// Modelo vinculado con el componente padre mediante v-model.
// Acepta un número o una cadena porque los campos numéricos pueden
// entregar temporalmente su valor como texto.
const gastoTotal = defineModel<number | string>({ required: true })

// Aporte por pasajero: gasto total entre los asientos más el conductor.
const aporte = computed(() => calcularAporte(Number(gastoTotal.value), props.asientos))
</script>

<template>
  <TarjetaSeccion
    :titulo="[numero, 'Calculadora de Gastos Solidarios'].filter(Boolean).join(' ')"
    :icono="Fuel"
    resaltada
    etiqueta="Reglamento UTTT"
  >
    <div class="grid grid-cols-2 gap-3 items-center">
      <BaseInput
        v-model="gastoTotal"
        etiqueta="Gasto Total (Gasolina + Casetas):"
        suave
        class="font-bold"
        :error="error"
        type="number"
        inputmode="decimal"
        min="0.01"
        :max="GASTO_MAXIMO"
        step="0.01"
        placeholder="0.00"
        @blur="emit('validar')"
      >
        <template #prefijo>
          <span
            class="absolute left-3 top-2.5 text-xs font-bold text-[#4B5563] pointer-events-none"
            aria-hidden="true"
            >$</span
          >
        </template>
      </BaseInput>

      <!-- aria-live: el lector de pantalla anuncia el nuevo aporte sin interrumpir. -->
      <div class="bg-white p-2.5 rounded-xl border border-[#8AA9C4] text-center" aria-live="polite">
        <span class="text-[10px] text-[#4B5563] block">Aporte por Pasajero:</span>
        <strong class="text-base font-extrabold text-[#1D2D44] block leading-tight">
          {{ mxn(aporte) }} MXN
        </strong>
        <span class="text-[9px] text-emerald-700 font-medium block">
          Dividido entre {{ asientos + 1 }} personas
        </span>
      </div>
    </div>

    <p class="text-[10px] text-[#3E5C76] leading-snug">
      * El carpooling no persigue lucro comercial. El aporte cubre equitativamente el combustible
      utilizado en el trayecto universitario.
    </p>
  </TarjetaSeccion>
</template>
