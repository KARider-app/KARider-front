<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { Plus, Trash2 } from 'lucide-vue-next'
import { MAX_PARADAS, paradaEsquema } from '../../domain/esquemas'

defineProps<{ error?: string }>()
const paradas = defineModel<string[]>({ required: true })

const id = useId()
const nueva = ref('')
const errorLocal = ref('')
const llena = computed(() => paradas.value.length >= MAX_PARADAS)

function agregar() {
  const r = paradaEsquema.safeParse(nueva.value)
  if (!r.success) {
    errorLocal.value = r.error.issues[0]?.message ?? 'Parada no válida'
    return
  }
  if (llena.value) return
  paradas.value = [...paradas.value, r.data]
  nueva.value = ''
  errorLocal.value = ''
}

function quitar(indice: number) {
  paradas.value = paradas.value.filter((_, i) => i !== indice)
}
</script>

<template>
  <div>
    <label :for="id" class="block text-xs font-semibold text-[#3E5C76] mb-1">
      Paradas Intermedias (Opcional, máximo {{ MAX_PARADAS }})
    </label>
    <div class="flex items-center gap-2 mb-2">
      <input
        :id="id"
        v-model="nueva"
        class="flex-1 min-w-0 p-2 text-xs rounded-xl border border-[#C9DCE8] bg-white outline-none focus:border-[#1D2D44] disabled:opacity-60"
        maxlength="100"
        :disabled="llena"
        :placeholder="llena ? 'Llegaste al máximo de paradas' : 'Ej. Crucero de Tlahuelilpan'"
        @keydown.enter.prevent="agregar"
      />
      <button
        type="button"
        class="px-3 py-2 bg-[#3E5C76] text-white rounded-xl text-xs font-bold hover:bg-[#1D2D44] disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Agregar parada"
        :disabled="llena"
        @click="agregar"
      >
        <Plus class="w-3.5 h-3.5" aria-hidden="true" />
      </button>
    </div>
    <ul v-if="paradas.length" class="flex flex-wrap gap-1.5">
      <li
        v-for="(p, i) in paradas"
        :key="`${i}-${p}`"
        class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#EAF2F8] border border-[#8AA9C4] text-[11px] font-medium text-[#1D2D44] max-w-full"
      >
        <span class="truncate">{{ p }}</span>
        <button
          type="button"
          class="text-[#3E5C76] hover:text-red-600"
          :aria-label="`Quitar ${p}`"
          @click="quitar(i)"
        >
          <Trash2 class="w-3 h-3" aria-hidden="true" />
        </button>
      </li>
    </ul>
    <p v-if="errorLocal || error" class="text-[10px] font-semibold text-red-600 mt-1" role="alert">
      {{ errorLocal || error }}
    </p>
  </div>
</template>
