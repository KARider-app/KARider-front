export type EstadoViaje = 'Borrador' | 'Programado' | 'EnCurso' | 'Completado' | 'Cancelado'

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
  paradas: { orden: number; nombre: string }[]
  fechaSalida: string
  gastoTotal: number
  aportePorAsiento: number
  asientosDisponibles: number
  asientosOfrecidos: number
  notas: string | null
  estado: EstadoViaje
  esPropietario: boolean
}

export interface ViajeResumen {
  id: string
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
