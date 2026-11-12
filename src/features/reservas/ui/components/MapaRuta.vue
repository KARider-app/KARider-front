<script setup lang="ts">
import * as L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { PuntoMapa } from '../../domain/geo'

const props = defineProps<{
  puntoEncuentro: PuntoMapa
  destino?: PuntoMapa | null
  conductor?: PuntoMapa | null
}>()

const contenedor = ref<HTMLDivElement | null>(null)
let mapa: L.Map | null = null
let capa: L.LayerGroup | null = null
let ajustado = false
let teniaConductor = false

/** Marcador circular con texto fijo; evita depender de las imágenes por defecto de Leaflet. */
function icono(clase: string, texto: string) {
  return L.divIcon({
    className: 'kar-marcador',
    html: `<span class="kar-marcador__punto kar-marcador__punto--${clase}">${texto}</span>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  })
}

function marcador(p: PuntoMapa, clase: string, texto: string) {
  const m = L.marker([p.latitud, p.longitud], { icon: icono(clase, texto), title: p.etiqueta })
  // Se usa un nodo de texto (no HTML) porque la etiqueta puede venir de datos capturados por usuarios.
  const etiqueta = document.createElement('span')
  etiqueta.textContent = p.etiqueta
  m.bindTooltip(etiqueta, { direction: 'top', offset: [0, -14] })
  return m
}

function dibujar() {
  if (!mapa || !capa) return
  capa.clearLayers()

  const puntos: L.LatLngTuple[] = []
  const origen = props.puntoEncuentro
  marcador(origen, 'encuentro', 'P').addTo(capa)
  puntos.push([origen.latitud, origen.longitud])

  if (props.destino) {
    marcador(props.destino, 'destino', 'D').addTo(capa)
    puntos.push([props.destino.latitud, props.destino.longitud])
    // Línea entre punto de encuentro y destino (sin cálculo de ruta óptima: fuera de alcance).
    L.polyline(
      [
        [origen.latitud, origen.longitud],
        [props.destino.latitud, props.destino.longitud],
      ],
      // Debe reflejar --color-acento (Leaflet no acepta variables CSS en sus opciones de estilo).
      { color: '#3e5c76', weight: 4, opacity: 0.8, dashArray: '8 8' },
    ).addTo(capa)
  }

  if (props.conductor) {
    marcador(props.conductor, 'conductor', '🚗').addTo(capa)
    puntos.push([props.conductor.latitud, props.conductor.longitud])
  }

  // Se reencuadra al abrir y la primera vez que aparece el conductor; después se respeta el zoom del usuario.
  const apareceConductor = !!props.conductor && !teniaConductor
  teniaConductor = !!props.conductor
  if (!ajustado || apareceConductor) {
    ajustado = true
    const primero = puntos[0]
    if (puntos.length === 1 && primero) mapa.setView(primero, 15)
    else mapa.fitBounds(L.latLngBounds(puntos), { padding: [40, 40], maxZoom: 16 })
  }
}

onMounted(() => {
  if (!contenedor.value) return
  mapa = L.map(contenedor.value, { zoomControl: false, attributionControl: true })
  // Zoom a la derecha, como en el mockup del mapa
  L.control.zoom({ position: 'topright' }).addTo(mapa)
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(mapa)
  capa = L.layerGroup().addTo(mapa)
  dibujar()
})

watch(() => [props.puntoEncuentro, props.destino, props.conductor], dibujar, { deep: true })

onBeforeUnmount(() => {
  mapa?.remove()
  mapa = null
  capa = null
})
</script>

<template>
  <div
    ref="contenedor"
    class="relative w-full h-[290px] md:h-[420px] lg:h-[calc(100dvh-11rem)] lg:min-h-[480px] bg-[#DDE5EE] overflow-hidden z-0"
    role="img"
    aria-label="Mapa con el punto de encuentro, el destino y la ubicación del conductor"
  />
</template>

<!-- Estilos globales: Leaflet inserta estos nodos fuera del alcance de Vue. -->
<style>
.kar-marcador {
  background: transparent;
  border: 0;
}

.kar-marcador__punto {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border: 3px solid #fff;
  border-radius: 50%;
  box-shadow:
    0 0 0 6px rgb(2 132 199 / 25%),
    0 2px 6px rgb(29 45 68 / 35%);
  color: #fff;
  font-size: 0.8125rem;
  font-weight: 700;
}

.kar-marcador__punto--encuentro {
  background: #0284c7;
}

.kar-marcador__punto--destino {
  background: #059669;
}

.kar-marcador__punto--conductor {
  background: #1d2d44;
  font-size: 1rem;
}
</style>

<!-- Controles de zoom con el estilo de los mockups (botones blancos redondeados). -->
<style>
.leaflet-touch .leaflet-bar.leaflet-control-zoom,
.leaflet-bar.leaflet-control-zoom {
  display: flex;
  flex-direction: column;
  gap: 6px;
  border: 0;
  box-shadow: none;
}

.leaflet-bar.leaflet-control-zoom a,
.leaflet-touch .leaflet-bar.leaflet-control-zoom a {
  width: 32px;
  height: 32px;
  line-height: 30px;
  border: 1px solid #c9dce8;
  border-radius: 12px;
  background: rgb(255 255 255 / 95%);
  color: #1d2d44;
  font-size: 14px;
  font-weight: 900;
  box-shadow:
    0 4px 6px -1px rgb(0 0 0 / 10%),
    0 2px 4px -2px rgb(0 0 0 / 10%);
}

.leaflet-bar.leaflet-control-zoom a:hover {
  background: #eaf2f8;
}
</style>
