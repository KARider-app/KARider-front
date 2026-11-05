import { apiClient } from '@/core/http/apiClient'
import type { PagedResult } from '@/features/viajes/domain/tipos'
import type { EstadoReserva, Reserva } from '../domain/tipos'

export const reservasApi = {
  /** HU-07: aparta 1 o 2 asientos. 409 VIAJE_SIN_CUPO si otro pasajero se quedó con el último lugar. */
  crear: (viajeId: string, asientos: number) =>
    apiClient
      .post<Reserva>(`/viajes/${encodeURIComponent(viajeId)}/reservas`, { asientos })
      .then((r) => r.data),
  obtener: (id: string) =>
    apiClient.get<Reserva>(`/reservas/${encodeURIComponent(id)}`).then((r) => r.data),
  misReservas: (estado?: EstadoReserva, pagina = 1) =>
    apiClient
      .get<PagedResult<Reserva>>('/reservas', { params: { estado, pagina } })
      .then((r) => r.data),
  cancelar: (id: string) =>
    apiClient.post<Reserva>(`/reservas/${encodeURIComponent(id)}/cancelar`).then((r) => r.data),
}
