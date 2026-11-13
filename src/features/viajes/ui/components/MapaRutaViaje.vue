<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ExternalLink, Route } from 'lucide-vue-next'
import MapaRuta from '@/features/reservas/ui/components/MapaRuta.vue'
import {
  enlaceGoogleMaps,
  textoDistancia,
  textoTiempo,
  type PuntoMapa,
} from '@/features/reservas/domain/geo'
import { viajesApi } from '../../api/viajesApi'
import type { PuntoRuta, RutaViaje } from '../../domain/tipos'

/** HU-08: mapa con la ruta real por calles del viaje, visible desde su detalle. */
const props = defineProps<{ viajeId: string }>()

const ruta = ref<RutaViaje | null>(null)
const cargando = ref(false)
const fallo = ref(false)

watch(
  () => props.viajeId,
  async (id) => {
    cargando.value = true
    fallo.value = false
    try {
      ruta.value = await viajesApi.ruta(id)
    } catch {
      ruta.value = null
      fallo.value = true
    } finally {
      cargando.value = false
    }
  },
  { immediate: true },
)

const aPunto = (p: PuntoRuta): PuntoMapa => ({
  latitud: p.latitud,
  longitud: p.longitud,
  etiqueta: p.nombre,
})

const origen = computed(() => (ruta.value ? aPunto(ruta.value.origen) : null))
const destino = computed(() => (ruta.value?.destino ? aPunto(ruta.value.destino) : null))
const paradas = computed(() => ruta.value?.paradas.map(aPunto) ?? [])
const urlGoogleMaps = computed(() =>
  origen.value ? enlaceGoogleMaps(origen.value, destino.value, paradas.value) : null,
)
</script>

<template>
  <section
    v-if="!fallo"
    class="rounded-2xl bg-white border border-[#C9DCE8] shadow-xs overflow-hidden"
    aria-label="Mapa de la ruta"
  >
    <div class="px-4 pt-3.5 pb-2.5 flex items-center justify-between gap-2">
      <h2 class="flex items-center gap-1.5 text-xs font-bold text-[#1D2D44] font-sans">
        <Route class="w-4 h-4 text-[#0284C7]" aria-hidden="true" />
        <span>Ruta en el mapa</span>
      </h2>
      <span
        v-if="ruta?.distanciaKm != null && ruta?.duracionMinutos != null"
        class="text-[11px] font-bold text-[#1D2D44]"
      >
        {{ textoDistancia(ruta.distanciaKm) }} · ~{{ textoTiempo(ruta.duracionMinutos) }}
      </span>
    </div>

    <p v-if="cargando && !ruta" class="px-4 pb-4 text-xs text-[#4B5563]">Cargando la ruta…</p>

    <template v-if="ruta && origen">
      <MapaRuta
        compacto
        :punto-encuentro="origen"
        :destino="destino"
        :paradas="paradas"
        :trazo="ruta.trazo"
      />
      <div class="px-4 py-2.5 flex items-center justify-between gap-2 text-[11px]">
        <span class="text-[#4B5563]">
          <template v-if="!ruta.destino">No pudimos ubicar el destino en el mapa.</template>
          <template v-else-if="ruta.porCalles">Ruta por calles (OpenStreetMap).</template>
          <template v-else>Línea recta de referencia (servicio de rutas no disponible).</template>
        </span>
        <a
          v-if="urlGoogleMaps"
          :href="urlGoogleMaps"
          target="_blank"
          rel="noopener noreferrer"
          class="font-bold text-[#0284C7] hover:underline flex items-center gap-1 shrink-0"
        >
          <ExternalLink class="w-3.5 h-3.5" aria-hidden="true" />
          <span>Abrir en Google Maps</span>
        </a>
      </div>
    </template>
  </section>
</template>
