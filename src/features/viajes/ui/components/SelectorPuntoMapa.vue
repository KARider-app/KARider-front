<script setup lang="ts">
/**
 * HU-22: mapa para marcar el destino exacto. El conductor toca el mapa o arrastra el pin; así puede
 * elegir cualquier lugar, aunque no aparezca en la búsqueda (colonias, fraccionamientos, una casa).
 */
import * as L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

/** Entrada principal de la UTTT: centro del mapa cuando aún no hay punto. */
const CAMPUS_UTTT = { latitud: 20.00997, longitud: -99.3425 } as const

const ZOOM_SIN_PUNTO = 13
const ZOOM_CON_PUNTO = 16

const latitud = defineModel<number | null>('latitud', { required: true })
const longitud = defineModel<number | null>('longitud', { required: true })

const emit = defineEmits<{
  /** El conductor movió el pin a mano (tocando el mapa o arrastrándolo). */
  marcado: []
}>()

const contenedor = ref<HTMLDivElement | null>(null)
let mapa: L.Map | null = null
let pin: L.Marker | null = null
let observador: ResizeObserver | null = null
/** El pin se movió a mano: no hace falta recentrar el mapa (sería un salto molesto). */
let movidoAMano = false

const icono = () =>
  L.divIcon({
    className: 'kar-pin',
    html: '<span class="kar-pin__punto">D</span>',
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  })

/** Redondea a 6 decimales (~10 cm): suficiente y evita ruido de coma flotante. */
const redondear = (v: number) => Math.round(v * 1e6) / 1e6

function marcar(lat: number, lng: number) {
  movidoAMano = true
  latitud.value = redondear(lat)
  longitud.value = redondear(lng)
  emit('marcado')
}

/** Pone (o mueve) el pin en las coordenadas actuales del modelo. */
function dibujarPin(centrar: boolean) {
  if (!mapa) return
  if (latitud.value == null || longitud.value == null) {
    pin?.remove()
    pin = null
    return
  }
  const punto: L.LatLngTuple = [latitud.value, longitud.value]
  if (pin) {
    pin.setLatLng(punto)
  } else {
    pin = L.marker(punto, { icon: icono(), draggable: true, title: 'Destino', keyboard: false })
    pin.on('dragend', () => {
      const p = pin!.getLatLng()
      marcar(p.lat, p.lng)
    })
    pin.addTo(mapa)
  }
  if (centrar) mapa.setView(punto, Math.max(mapa.getZoom?.() ?? 0, ZOOM_CON_PUNTO))
}

onMounted(() => {
  if (!contenedor.value) return
  const hayPunto = latitud.value != null && longitud.value != null
  mapa = L.map(contenedor.value, { zoomControl: true, attributionControl: true })
  mapa.setView(
    hayPunto ? [latitud.value!, longitud.value!] : [CAMPUS_UTTT.latitud, CAMPUS_UTTT.longitud],
    hayPunto ? ZOOM_CON_PUNTO : ZOOM_SIN_PUNTO,
  )
  // Misma configuración de mosaicos que MapaRuta (Referer y CORS que exige OpenStreetMap).
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    referrerPolicy: 'strict-origin-when-cross-origin',
    crossOrigin: 'anonymous',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(mapa)
  mapa.on('click', (e: L.LeafletMouseEvent) => marcar(e.latlng.lat, e.latlng.lng))
  dibujarPin(false)

  if (typeof ResizeObserver !== 'undefined') {
    observador = new ResizeObserver(() => mapa?.invalidateSize())
    observador.observe(contenedor.value)
  }
})

// Si el punto cambia desde fuera (se eligió una sugerencia o se quitó), el pin lo sigue.
watch([latitud, longitud], () => {
  dibujarPin(!movidoAMano)
  movidoAMano = false
})

onBeforeUnmount(() => {
  observador?.disconnect()
  observador = null
  mapa?.remove()
  mapa = null
  pin = null
})
</script>

<template>
  <div class="space-y-1">
    <div
      ref="contenedor"
      class="relative w-full h-[230px] md:h-[260px] rounded-xl overflow-hidden border border-[#C9DCE8] bg-[#DDE5EE] z-0"
      role="application"
      aria-label="Mapa para marcar el destino: toca el lugar exacto o arrastra el pin"
    />
    <p class="text-[10px] text-[#4B5563]">
      Toca el mapa o arrastra el pin <strong>D</strong> hasta el lugar exacto de tu destino.
    </p>
  </div>
</template>

<!-- Estilos globales: Leaflet inserta el pin fuera del alcance de Vue. -->
<style>
.kar-pin {
  background: transparent;
  border: 0;
}

.kar-pin__punto {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border: 3px solid #fff;
  border-radius: 50%;
  background: #059669;
  box-shadow:
    0 0 0 6px rgb(5 150 105 / 25%),
    0 2px 6px rgb(29 45 68 / 35%);
  color: #fff;
  font-size: 0.8125rem;
  font-weight: 700;
  cursor: grab;
}
</style>
