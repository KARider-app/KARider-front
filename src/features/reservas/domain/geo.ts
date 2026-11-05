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
