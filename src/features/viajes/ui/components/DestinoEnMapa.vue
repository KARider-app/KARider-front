<script setup lang="ts">
/**
 * HU-22: destino del viaje con su lugar exacto en el mapa.
 *
 * El conductor escribe el destino (es el texto que verán los pasajeros) y tiene dos formas de ubicarlo:
 * - «Buscar lugar»: la API sugiere lugares cercanos al campus y el que elija se guarda con sus coordenadas.
 * - «Marcar en el mapa»: toca el mapa o arrastra el pin hasta el punto exacto; sirve para cualquier lugar,
 *   aunque no aparezca en la búsqueda (colonias, fraccionamientos, una casa).
 * Así la ruta del viaje se dibuja exacta y no depende de que el texto libre se encuentre después.
 *
 * La búsqueda es solo al tocar el botón o con Enter (no mientras se escribe): los servicios de mapas
 * de OpenStreetMap no permiten consultas de autocompletado.
 */
import { computed, ref, watch } from 'vue'
import { Check, Crosshair, LoaderCircle, MapPin, Search } from 'lucide-vue-next'
import BaseInput from '@/shared/components/BaseInput.vue'
import { viajesApi } from '../../api/viajesApi'
import type { LugarMapa } from '../../domain/tipos'
import SelectorPuntoMapa from './SelectorPuntoMapa.vue'

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
/** Lugar elegido de la búsqueda en esta sesión (al editar un viaje solo se conocen sus coordenadas). */
const elegido = ref<LugarMapa | null>(null)
/** El punto lo marcó el conductor a mano en el mapa. */
const marcadoAMano = ref(false)
const mapaVisible = ref(false)
const textoBuscado = ref('')

const ubicado = computed(() => latitud.value != null && longitud.value != null)
const puedeBuscar = computed(() => destino.value.trim().length >= TEXTO_MINIMO)

// Si el conductor cambia el texto después de elegir un lugar de la búsqueda, ese lugar ya no
// corresponde. Un punto marcado a mano se conserva: el conductor lo puso donde quería.
// (Al cargar un viaje para editarlo el texto pasa de vacío a su valor: eso no cuenta.)
watch(destino, (nuevo, anterior) => {
  if (anterior.trim() === '' || nuevo.trim() === anterior.trim()) return
  if (ubicado.value && !marcadoAMano.value) quitarUbicacion()
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
  marcadoAMano.value = false
  lugares.value = []
  estado.value = 'inicial'
  // Se muestra el pin para confirmar el lugar o ajustarlo.
  mapaVisible.value = true
}

/** El conductor tocó el mapa o arrastró el pin. */
function alMarcar() {
  marcadoAMano.value = true
  elegido.value = null
  lugares.value = []
  estado.value = 'inicial'
}

function quitarUbicacion() {
  latitud.value = null
  longitud.value = null
  elegido.value = null
  marcadoAMano.value = false
}

function buscarOtro() {
  quitarUbicacion()
  void buscar()
}

function abrirMapa() {
  mapaVisible.value = true
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
          <span v-else-if="marcadoAMano" class="block text-emerald-700">
            Punto que marcaste en el mapa.
          </span>
          <span v-else class="block text-emerald-700">La ruta se dibuja con este lugar.</span>
        </span>
      </span>
      <span class="shrink-0 flex flex-col items-end gap-1">
        <button
          v-if="!mapaVisible"
          type="button"
          class="font-bold text-[#0284C7] hover:underline"
          @click="abrirMapa"
        >
          Ver en el mapa
        </button>
        <button
          type="button"
          class="font-bold text-[#0284C7] hover:underline disabled:opacity-50"
          :disabled="!puedeBuscar"
          @click="buscarOtro"
        >
          Buscar otro
        </button>
      </span>
    </div>

    <!-- Aún sin lugar: buscarlo o marcarlo a mano. -->
    <div v-else class="space-y-1.5">
      <p class="text-[10px] text-[#4B5563]">
        Ubícalo para que la ruta se dibuje exacta: búscalo o márcalo tú en el mapa.
      </p>
      <div class="flex flex-wrap gap-2">
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
          <span>{{ estado === 'buscando' ? 'Buscando…' : 'Buscar lugar' }}</span>
        </button>
        <button
          v-if="!mapaVisible"
          type="button"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold border border-[#C9DCE8] text-[#1D2D44] bg-white hover:bg-[#EAF2F8]"
          @click="abrirMapa"
        >
          <Crosshair class="w-3.5 h-3.5" aria-hidden="true" />
          <span>Marcar en el mapa</span>
        </button>
      </div>
    </div>

    <!-- Sugerencias. -->
    <fieldset v-if="estado === 'resultados' && !ubicado" class="space-y-1.5">
      <legend class="text-[10px] font-semibold text-[#3E5C76] mb-1">
        Elige el lugar exacto de «{{ textoBuscado }}» (del más cercano al más lejano):
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
      <p class="text-[10px] text-[#4B5563]">
        ¿No está tu lugar?
        <button type="button" class="font-bold text-[#0284C7] hover:underline" @click="abrirMapa">
          Márcalo en el mapa
        </button>
      </p>
    </fieldset>

    <p
      v-else-if="estado === 'sin-resultados'"
      class="text-[10px] font-semibold text-amber-700"
      role="status"
    >
      No encontramos «{{ textoBuscado }}» cerca del campus.
      <button type="button" class="font-bold text-[#0284C7] hover:underline" @click="abrirMapa">
        Márcalo en el mapa
      </button>
      o prueba con otro nombre (ej. «Tula Centro»).
    </p>

    <p
      v-else-if="estado === 'error'"
      class="text-[10px] font-semibold text-amber-700"
      role="status"
    >
      No pudimos consultar la búsqueda.
      <button type="button" class="font-bold text-[#0284C7] hover:underline" @click="abrirMapa">
        Márcalo en el mapa
      </button>
      o continúa: intentaremos ubicar el destino después.
    </p>

    <!-- Mapa para marcar o ajustar el punto exacto. -->
    <SelectorPuntoMapa
      v-if="mapaVisible"
      v-model:latitud="latitud"
      v-model:longitud="longitud"
      @marcado="alMarcar"
    />
  </div>
</template>
