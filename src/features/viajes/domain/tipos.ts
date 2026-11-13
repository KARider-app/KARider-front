export type EstadoViaje = 'Borrador' | 'Programado' | 'EnCurso' | 'Completado' | 'Cancelado'

export type EstadoReserva = 'Pendiente' | 'Confirmada' | 'Rechazada' | 'Cancelada' | 'Completada'

/** Criterios de orden del listado (HU-06). */
export type OrdenViajes = 'Horario' | 'MenorAporte' | 'Calificacion'

export interface Vehiculo {
  id: string
  modelo: string
  color: string
  anio: number
  placas: string
  capacidad: number
  verificado: boolean
}

export interface PuntoEncuentroViaje {
  id: number
  nombre: string
  descripcion: string
  latitud: number
  longitud: number
}

export interface PublicarViajeRequest {
  vehiculoId?: string
  puntoEncuentroId: number
  destino: string
  fechaSalida: string
  asientos: number
  gastoTotal: number
  notas?: string
  paradas: string[]
  publicar: boolean
}

export interface ViajeDetalle {
  id: string
  conductor: {
    id: string
    nombreCompleto: string
    carrera: string
    fotoUrl: string | null
    calificacion: number
    totalCalificaciones: number
    verificado: boolean
    telefono: string | null
  }
  vehiculo: { modelo: string; color: string; anio: number; placas: string; verificado: boolean }
  puntoEncuentro: PuntoEncuentroViaje
  destino: string
  destinoLatitud: number | null
  destinoLongitud: number | null
  paradas: { orden: number; nombre: string }[]
  fechaSalida: string
  gastoTotal: number
  aportePorAsiento: number
  asientosDisponibles: number
  asientosOfrecidos: number
  notas: string | null
  estado: EstadoViaje
  esPropietario: boolean
  /** Reserva del usuario autenticado en este viaje (si la tiene). */
  miReserva: MiReserva | null
}

export interface MiReserva {
  id: string
  folio: string
  estado: EstadoReserva
  asientos: number
  montoAporte: number
}

export interface ConductorResumen {
  id: string
  nombreCompleto: string
  carrera: string
  fotoUrl: string | null
  calificacion: number
  totalCalificaciones: number
}

export interface ViajeResumen {
  id: string
  conductor: ConductorResumen
  puntoEncuentro: PuntoEncuentroViaje
  destino: string
  paradas: string[]
  fechaSalida: string
  aportePorAsiento: number
  asientosDisponibles: number
  asientosOfrecidos: number
  vehiculo: { modelo: string; color: string; verificado: boolean }
  estado: EstadoViaje
}

export interface PagedResult<T> {
  items: T[]
  pagina: number
  tamanoPagina: number
  total: number
  totalPaginas: number
  tieneSiguiente: boolean
}

export type EditarViajeRequest = Omit<PublicarViajeRequest, 'publicar'>

export interface BuscarViajesParams {
  destino?: string
  puntoEncuentroId?: number
  fecha?: string
  orden?: OrdenViajes
  pagina?: number
  tamanoPagina?: number
}

/** Última posición que compartió el conductor (P8). */
/** HU-08: punto con nombre de la ruta del viaje. */
export interface PuntoRuta {
  latitud: number
  longitud: number
  nombre: string
}

/**
 * HU-08: ruta real del viaje. `trazo` son pares [latitud, longitud]; si `porCalles` es false, el servicio de
 * rutas no respondió y el trazo es una línea recta de respaldo.
 */
export interface RutaViaje {
  origen: PuntoRuta
  destino: PuntoRuta | null
  paradas: PuntoRuta[]
  trazo: [number, number][]
  distanciaKm: number | null
  duracionMinutos: number | null
  porCalles: boolean
}

/** HU-08: llegada estimada del conductor (al punto de encuentro o, si ya va en curso, al destino). */
export interface LlegadaConductor {
  objetivo: 'PuntoEncuentro' | 'Destino'
  trazo: [number, number][]
  distanciaKm: number
  duracionMinutos: number
  porCalles: boolean
}

export interface UbicacionConductor {
  latitud: number
  longitud: number
  actualizadaEn: string
  estadoViaje: EstadoViaje
  puntoEncuentro: PuntoEncuentroViaje
}
