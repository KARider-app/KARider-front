import type {
  EstadoReserva,
  EstadoViaje,
  PuntoEncuentroViaje,
} from '@/features/viajes/domain/tipos'

export type { EstadoReserva }

export interface Reserva {
  id: string
  folio: string
  estado: EstadoReserva
  asientos: number
  montoAporte: number
  aportePagado: boolean
  creadoEn: string
  respondidaEn: string | null
  viaje: {
    id: string
    destino: string
    fechaSalida: string
    estado: EstadoViaje
    puntoEncuentro: PuntoEncuentroViaje
    conductor: {
      id: string
      nombreCompleto: string
      fotoUrl: string | null
      calificacion: number
      telefono: string | null
    }
    vehiculo: string
    placas: string | null
  }
}
