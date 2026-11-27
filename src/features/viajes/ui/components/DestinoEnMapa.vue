<script setup lang="ts">
/**
 * HU-22: destino del viaje con su lugar exacto en el mapa.
 *
 * El conductor escribe el destino (es el texto que verán los pasajeros) y toca «Ubicar en el mapa»;
 * la API sugiere lugares de OpenStreetMap y el que elija se guarda con sus coordenadas. Así la ruta
 * del viaje se dibuja exacta y no depende de que el texto libre se encuentre después.
 *
 * La búsqueda es solo al tocar el botón o con Enter (no mientras se escribe): el servicio de mapas
 * de OpenStreetMap no permite consultas de autocompletado.
 */
import { computed, ref, watch } from 'vue'
import { Check, LoaderCircle, MapPin, Search } from 'lucide-vue-next'
import BaseInput from '@/shared/components/BaseInput.vue'
import { viajesApi } from '../../api/viajesApi'
import type { LugarMapa } from '../../domain/tipos'

const TEXTO_MINIMO = 3

defineProps<{
  etiqueta: string
  error?: string
}>()

const emit = defineEmits<{
  validar: []
}>()

const destino = defineModel<string>('destino', { required: true })
const latitud = defineModel<number | null>('latitud', { required: true })
const longitud = defineModel<number | null>('longitud', { required: true })

type Estado = 'inicial' | 'buscando' | 'resultados' | 'sin-resultados' | 'error'

const estado = ref<Estado>('inicial')
const lugares = ref<LugarMapa[]>([])
/** Lugar elegido en esta sesión (al editar un viaje solo se conocen sus coordenadas). */
const elegido = ref<LugarMapa | null>(null)
const textoBuscado = ref('')

const ubicado = computed(() => latitud.value != null && longitud.value != null)
const puedeBuscar = computed(() => destino.value.trim().length >= TEXTO_MINIMO)

// Si el conductor cambia el texto después de elegir un lugar, ese lugar ya no corresponde.
// (Al cargar un viaje para editarlo el texto pasa de vacío a su valor: eso no cuenta.)
watch(destino, (nuevo, anterior) => {
  if (anterior.trim() === '' || nuevo.trim() === anterior.trim()) return
  if (ubicado.value) quitarUbicacion()
  if (estado.value !== 'buscando') estado.value = 'inicial'
})

async function buscar() {
  if (!puedeBuscar.value || estado.value === 'buscando') return
  const texto = destino.value.trim()
  textoBuscado.value = texto
  estado.value = 'buscando'
  try {
    const encontrados = await viajesApi.buscarLugares(texto)
    // Descarta la respuesta si mientras tanto el conductor cambió el texto.
    if (destino.value.trim() !== texto) {
      estado.value = 'inicial'
      return
    }
    lugares.value = encontrados
    estado.value = encontrados.length ? 'resultados' : 'sin-resultados'
  } catch {
    estado.value = destino.value.trim() === texto ? 'error' : 'inicial'
  }
}

function elegir(lugar: LugarMapa) {
  latitud.value = lugar.latitud
  longitud.value = lugar.longitud
  elegido.value = lugar
  lugares.value = []
  estado.value = 'inicial'
}

function quitarUbicacion() {
  latitud.value = null
  longitud.value = null
  elegido.value = null
}

function cambiar() {
  quitarUbicacion()
  void buscar()
}
</script>

<template>
  <div class="space-y-2">
    <BaseInput
      v-model="destino"
      :etiqueta="etiqueta"
      suave
      :error="error"
      maxlength="150"
      placeholder="Ej. Plaza Galerías Pachuca"
      autocomplete="off"
      @blur="emit('validar')"
      @keydown.enter.prevent="buscar"
    />

    <!-- Ya tiene su lugar en el mapa. -->
    <div
      v-if="ubicado"
      class="flex items-start justify-between gap-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px]"
      role="status"
    >
      <span class="flex items-start gap-1.5 min-w-0 text-emerald-800">
        <Check class="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden="true" />
        <span class="min-w-0">
          <strong class="block">Ubicado en el mapa</strong>
          <span v-if="elegido" class="block text-emerald-700 break-words">
            {{ elegido.direccion }}
          </span>
          <span v-else class="block text-emerald-700">La ruta se dibuja con este lugar.</span>
        </span>
      </span>
      <button
        type="button"
        class="shrink-0 font-bold text-[#0284C7] hover:underline disabled:opacity-50"
        :disabled="!puedeBuscar"
        @click="cambiar"
      >
        Cambiar
      </button>
    </div>

    <!-- Aún sin lugar: botón para buscarlo. -->
    <div v-else class="flex items-center justify-between gap-2 flex-wrap">
      <p class="text-[10px] text-[#4B5563] flex-1 min-w-[10rem]">
        Ubícalo en el mapa para que la ruta se dibuje exacta.
      </p>
      <button
        type="button"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold border border-[#0284C7] text-[#0284C7] bg-white hover:bg-[#EAF2F8] disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="!puedeBuscar || estado === 'buscando'"
        @click="buscar"
      >
        <LoaderCircle
          v-if="estado === 'buscando'"
          class="w-3.5 h-3.5 animate-spin"
          aria-hidden="true"
        />
        <Search v-else class="w-3.5 h-3.5" aria-hidden="true" />
        <span>{{ estado === 'buscando' ? 'Buscando…' : 'Ubicar en el mapa' }}</span>
      </button>
    </div>

    <!-- Sugerencias. -->
    <fieldset v-if="estado === 'resultados' && !ubicado" class="space-y-1.5">
      <legend class="text-[10px] font-semibold text-[#3E5C76] mb-1">
        Elige el lugar exacto de «{{ textoBuscado }}»:
      </legend>
      <button
        v-for="lugar in lugares"
        :key="`${lugar.latitud},${lugar.longitud}`"
        type="button"
        class="lugar w-full flex items-start gap-2 p-2 rounded-xl border border-[#C9DCE8] bg-white text-left hover:border-[#0284C7] hover:bg-[#F0F7FC] focus-visible:ring-2 focus-visible:ring-[#0284C7] outline-none"
        @click="elegir(lugar)"
      >
        <MapPin class="w-3.5 h-3.5 mt-0.5 text-[#0284C7] shrink-0" aria-hidden="true" />
        <span class="min-w-0">
          <span class="block text-xs font-bold text-[#1D2D44]">{{ lugar.nombre }}</span>
          <span class="block text-[10px] text-[#4B5563] break-words">{{ lugar.direccion }}</span>
        </span>
      </button>
    </fieldset>

    <p
      v-else-if="estado === 'sin-resultados'"
      class="text-[10px] font-semibold text-amber-700"
      role="status"
    >
      No encontramos «{{ textoBuscado }}» en el mapa. Prueba con un solo lugar: una plaza, colonia o
      municipio (ej. «Tula Centro»).
    </p>

    <p
      v-else-if="estado === 'error'"
      class="text-[10px] font-semibold text-amber-700"
      role="status"
    >
      No pudimos consultar el mapa. Puedes continuar: intentaremos ubicar el destino después.
    </p>
  </div>
</template>
