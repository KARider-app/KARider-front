<script setup lang="ts">
defineProps<{ capacidad: number; error?: string }>()
const asientos = defineModel<number>({ required: true })
</script>

<template>
  <fieldset>
    <legend class="block text-xs font-semibold text-[#3E5C76] mb-1.5">
      Asientos Disponibles para Compañeros *
    </legend>
    <div class="grid grid-cols-4 gap-2">
      <label
        v-for="n in 4"
        :key="n"
        class="py-2 rounded-xl text-xs font-bold border transition-all flex flex-col items-center has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#0284C7]"
        :class="[
          asientos === n
            ? 'border-[#1D2D44] bg-[#1D2D44] text-white shadow-xs'
            : 'border-[#C9DCE8] bg-[#F8FAFC] text-[#1D2D44] hover:bg-[#EAF2F8]',
          n > capacidad ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
        ]"
      >
        <input
          v-model="asientos"
          type="radio"
          name="asientos"
          :value="n"
          :disabled="n > capacidad"
          class="sr-only"
        />
        <span>{{ n }}</span>
        <span class="text-[9px] opacity-80">{{ n === 1 ? 'cupo' : 'cupos' }}</span>
      </label>
    </div>
    <p v-if="error" class="text-[10px] font-semibold text-red-600 mt-1" role="alert">{{ error }}</p>
    <p v-else-if="capacidad < 4" class="text-[10px] text-[#4B5563] mt-1">
      Tu vehículo admite hasta {{ capacidad }} {{ capacidad === 1 ? 'pasajero' : 'pasajeros' }}.
    </p>
  </fieldset>
</template>
