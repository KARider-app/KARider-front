export interface Coordenada {
  latitud: number
  longitud: number
}

/** Punto que se dibuja en el mapa, con el texto que aparece al tocarlo. */
export interface PuntoMapa extends Coordenada {
  etiqueta: string
}

const RADIO_TIERRA_KM = 6371
/** Velocidad urbana promedio para estimar la llegada (la API no calcula rutas). */
export const VELOCIDAD_PROMEDIO_KMH = 30

const aRadianes = (grados: number) => (grados * Math.PI) / 180

/** Distancia en línea recta (fórmula de Haversine), en kilómetros. */
export function distanciaKm(a: Coordenada, b: Coordenada): number {
  const dLat = aRadianes(b.latitud - a.latitud)
  const dLon = aRadianes(b.longitud - a.longitud)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(aRadianes(a.latitud)) * Math.cos(aRadianes(b.latitud)) * Math.sin(dLon / 2) ** 2
  return 2 * RADIO_TIERRA_KM * Math.asin(Math.min(1, Math.sqrt(h)))
}

/** Minutos estimados para recorrer `km` a velocidad urbana promedio (mínimo 1 si hay distancia). */
export function minutosEstimados(km: number, velocidadKmH = VELOCIDAD_PROMEDIO_KMH): number {
  if (!Number.isFinite(km) || km <= 0) return 0
  return Math.max(1, Math.round((km / velocidadKmH) * 60))
}

export function textoDistancia(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`
}

export function textoTiempo(minutos: number): string {
  if (minutos <= 0) return 'Llegando'
  if (minutos < 60) return `${minutos} min`
  const h = Math.floor(minutos / 60)
  const m = minutos % 60
  return m === 0 ? `${h} h` : `${h} h ${m} min`
}

const coordenadaTexto = (c: Coordenada) => `${c.latitud.toFixed(6)},${c.longitud.toFixed(6)}`

/**
 * HU-08: abre la ruta completa del viaje en Google Maps (navegación real), pasando por las paradas.
 * Sin destino, abre el punto de encuentro.
 */
export function enlaceGoogleMaps(
  origen: Coordenada,
  destino?: Coordenada | null,
  paradas: Coordenada[] = [],
): string {
  const url = new URL('https://www.google.com/maps/dir/')
  url.searchParams.set('api', '1')
  if (destino) {
    url.searchParams.set('origin', coordenadaTexto(origen))
    url.searchParams.set('destination', coordenadaTexto(destino))
    if (paradas.length) url.searchParams.set('waypoints', paradas.map(coordenadaTexto).join('|'))
  } else {
    url.searchParams.set('destination', coordenadaTexto(origen))
  }
  url.searchParams.set('travelmode', 'driving')
  return url.toString()
}

/** HU-08: navega con Waze hasta un punto (Waze no admite paradas intermedias en el enlace). */
export function enlaceWaze(punto: Coordenada): string {
  return `https://waze.com/ul?ll=${encodeURIComponent(coordenadaTexto(punto))}&navigate=yes`
}
