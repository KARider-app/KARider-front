<script setup lang="ts">
import * as L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { PuntoMapa } from '../../domain/geo'

/** Par [latitud, longitud] de un trazo. */
type Vertice = [number, number]

const props = defineProps<{
  puntoEncuentro: PuntoMapa
  destino?: PuntoMapa | null
  conductor?: PuntoMapa | null
  /** Paradas intermedias del itinerario (HU-04), en orden. */
  paradas?: PuntoMapa[]
  /** Ruta real por calles del viaje (punto de encuentro → paradas → destino). */
  trazo?: Vertice[]
  /** Camino por calles del conductor hacia el punto de encuentro (o al destino si va en curso). */
  trazoConductor?: Vertice[]
  /** Altura reducida para mostrarlo dentro de otra pantalla (detalle del viaje). */
  compacto?: boolean
}>()

const contenedor = ref<HTMLDivElement | null>(null)
let mapa: L.Map | null = null
let capa: L.LayerGroup | null = null
let observador: ResizeObserver | null = null
let ajustado = false
let teniaConductor = false
let teniaRuta = false

/** Marcador circular con texto fijo; evita depender de las imágenes por defecto de Leaflet. */
function icono(clase: string, texto: string, tamano = 32) {
  return L.divIcon({
    className: 'kar-marcador',
    html: `<span class="kar-marcador__punto kar-marcador__punto--${clase}">${texto}</span>`,
    iconSize: [tamano, tamano],
    iconAnchor: [tamano / 2, tamano / 2],
  })
}

function marcador(p: PuntoMapa, clase: string, texto: string, tamano?: number) {
  const m = L.marker([p.latitud, p.longitud], {
    icon: icono(clase, texto, tamano),
    title: p.etiqueta,
  })
  // Se usa un nodo de texto (no HTML) porque la etiqueta puede venir de datos capturados por usuarios.
  const etiqueta = document.createElement('span')
  etiqueta.textContent = p.etiqueta
  m.bindTooltip(etiqueta, { direction: 'top', offset: [0, -14] })
  return m
}

/** Ruta con borde oscuro y relleno azul, al estilo de los navegadores (Waze, Google Maps). */
function lineaRuta(trazo: Vertice[]) {
  L.polyline(trazo, { color: '#1e3a8a', weight: 10, opacity: 0.35, lineCap: 'round' }).addTo(capa!)
  L.polyline(trazo, { color: '#2563eb', weight: 6, opacity: 0.95, lineCap: 'round' }).addTo(capa!)
}

function dibujar() {
  if (!mapa || !capa) return
  capa.clearLayers()

  const origen = props.puntoEncuentro
  const puntos: L.LatLngTuple[] = [[origen.latitud, origen.longitud]]
  const trazo = props.trazo ?? []

  if (trazo.length > 1) {
    lineaRuta(trazo)
    puntos.push(...trazo)
  } else if (props.destino) {
    // Sin ruta por calles disponible: línea punteada de referencia entre encuentro y destino.
    L.polyline(
      [
        [origen.latitud, origen.longitud],
        [props.destino.latitud, props.destino.longitud],
      ],
      { color: '#3e5c76', weight: 4, opacity: 0.8, dashArray: '8 8' },
    ).addTo(capa)
  }

  const conductor = props.trazoConductor ?? []
  if (props.conductor && conductor.length > 1) {
    L.polyline(conductor, {
      color: '#059669',
      weight: 5,
      opacity: 0.9,
      dashArray: '1 10',
      lineCap: 'round',
    }).addTo(capa)
  }

  props.paradas?.forEach((p, i) => {
    marcador(p, 'parada', String(i + 1), 24).addTo(capa!)
    puntos.push([p.latitud, p.longitud])
  })

  marcador(origen, 'encuentro', 'P').addTo(capa)

  if (props.destino) {
    marcador(props.destino, 'destino', 'D').addTo(capa)
    puntos.push([props.destino.latitud, props.destino.longitud])
  }

  if (props.conductor) {
    marcador(props.conductor, 'conductor', '🚗', 36).addTo(capa)
    puntos.push([props.conductor.latitud, props.conductor.longitud])
  }

  // Se reencuadra al abrir, al llegar la ruta y la primera vez que aparece el conductor;
  // después se respeta el zoom del usuario.
  const apareceConductor = !!props.conductor && !teniaConductor
  const apareceRuta = trazo.length > 1 && !teniaRuta
  teniaConductor = !!props.conductor
  teniaRuta = trazo.length > 1
  if (!ajustado || apareceConductor || apareceRuta) {
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

  // Si el contenedor cambia de tamaño (rotar el celular, layout de escritorio), Leaflet debe recalcular
  // qué mosaicos pedir; sin esto el mapa puede quedar en gris.
  if (typeof ResizeObserver !== 'undefined') {
    observador = new ResizeObserver(() => mapa?.invalidateSize())
    observador.observe(contenedor.value)
  }
})

watch(
  () => [
    props.puntoEncuentro,
    props.destino,
    props.conductor,
    props.paradas,
    props.trazo,
    props.trazoConductor,
  ],
  dibujar,
  { deep: true },
)

onBeforeUnmount(() => {
  observador?.disconnect()
  observador = null
  mapa?.remove()
  mapa = null
  capa = null
})
</script>

<template>
  <div
    ref="contenedor"
    class="relative w-full bg-[#DDE5EE] overflow-hidden z-0"
    :class="
      compacto
        ? 'h-[240px] md:h-[320px]'
        : 'h-[290px] md:h-[420px] lg:h-[calc(100dvh-11rem)] lg:min-h-[480px]'
    "
    role="img"
    aria-label="Mapa con la ruta del viaje, el punto de encuentro, el destino y la ubicación del conductor"
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
  width: 36px;
  height: 36px;
  background: #1d2d44;
  font-size: 1.05rem;
}

.kar-marcador__punto--parada {
  width: 24px;
  height: 24px;
  border-width: 2px;
  background: #64748b;
  box-shadow: 0 2px 4px rgb(29 45 68 / 35%);
  font-size: 0.6875rem;
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
