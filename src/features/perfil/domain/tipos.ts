import type { Rol } from '@/features/auth/domain/tipos'
import type {
  EstadoReserva,
  EstadoViaje,
  PagedResult,
  Vehiculo,
} from '@/features/viajes/domain/tipos'

export type FiltroRolHistorial = 'Todos' | 'Pasajero' | 'Conductor'

export interface EstadisticasPerfil {
  viajesRealizados: number
  viajesComoConductor: number
  viajesComoPasajero: number
  ahorroCombustible: number
  co2EvitadoKg: number
}

export interface Perfil {
  id: string
  nombreCompleto: string
  correoInstitucional: string
  matricula: string
  telefono: string
  carrera: string
  cuatrimestre: number | null
  fotoUrl: string | null
  rol: Rol
  correoVerificado: boolean
  calificacion: number
  totalCalificaciones: number
  estadisticas: EstadisticasPerfil
  miembroDesde: string
}

export interface ActualizarPerfilRequest {
  telefono: string
  cuatrimestre?: number | null
  fotoUrl?: string | null
}

export interface CompaneroHistorial {
  id: string
  nombreCompleto: string
  vehiculo: string | null
  calificacion: number
}

export interface HistorialItem {
  viajeId: string
  rolEnViaje: Rol
  fechaSalida: string
  monto: number
  origen: string
  destino: string
  estadoViaje: EstadoViaje
  estadoReserva: EstadoReserva | null
  aportePagado: boolean | null
  pasajeros: number | null
  companero: CompaneroHistorial | null
  /** Solo en viajes como conductor: pasajeros que llevó (reservas confirmadas o completadas). */
  nombresPasajeros?: string[] | null
}

export interface Credenciales {
  correoInstitucional: string
  matricula: string
  carrera: string
  estatus: string
  correoVerificado: boolean
  vehiculos: Vehiculo[]
}

export interface EtiquetaConteo {
  etiqueta: string
  total: number
}

export interface Calificacion {
  id: string
  viajeId: string
  evaluadorId: string
  evaluadorNombre: string
  evaluadorCarrera: string
  rolEvaluado: Rol
  estrellas: number
  etiquetas: string[]
  comentario: string | null
  creadoEn: string
}

export interface Reputacion {
  usuarioId: string
  promedio: number
  totalCalificaciones: number
  etiquetas: EtiquetaConteo[]
  resenas: PagedResult<Calificacion>
}

export interface CalificacionPendiente {
  viajeId: string
  destino: string
  fechaSalida: string
  evaluadoId: string
  evaluadoNombre: string
  rolEvaluado: Rol
}

export interface CalificarRequest {
  viajeId: string
  evaluadoId: string
  estrellas: number
  etiquetas?: string[]
  comentario?: string
}

/** Catálogo de etiquetas de comportamiento (debe coincidir con EtiquetasCalificacion del backend). */
export const ETIQUETAS_CALIFICACION = [
  'Puntual',
  'Manejo seguro',
  'Aporte al abordar',
  'Respeto universitario',
  'Buena comunicación',
  'Vehículo limpio',
  'Respeta las reglas',
] as const
