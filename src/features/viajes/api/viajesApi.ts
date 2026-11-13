import { apiClient } from '@/core/http/apiClient'
import type {
  BuscarViajesParams,
  EditarViajeRequest,
  EstadoViaje,
  LlegadaConductor,
  PagedResult,
  PublicarViajeRequest,
  RutaViaje,
  UbicacionConductor,
  Vehiculo,
  ViajeDetalle,
  ViajeResumen,
} from '../domain/tipos'

export const viajesApi = {
  misVehiculos: () => apiClient.get<Vehiculo[]>('/vehiculos').then((r) => r.data),
  publicar: (p: PublicarViajeRequest) =>
    apiClient.post<ViajeDetalle>('/viajes', p).then((r) => r.data),
  publicarBorrador: (id: string) =>
    apiClient
      .patch<ViajeDetalle>(`/viajes/${encodeURIComponent(id)}/estado`, { estado: 'Programado' })
      .then((r) => r.data),
  /** HU-11: el conductor marca que ya salió al recorrido. */
  iniciar: (id: string) =>
    apiClient
      .patch<ViajeDetalle>(`/viajes/${encodeURIComponent(id)}/estado`, { estado: 'EnCurso' })
      .then((r) => r.data),
  /** HU-11: el conductor marca el viaje como concluido; desbloquea la calificación mutua. */
  finalizar: (id: string) =>
    apiClient
      .patch<ViajeDetalle>(`/viajes/${encodeURIComponent(id)}/estado`, { estado: 'Completado' })
      .then((r) => r.data),
  misPublicados: (estado?: EstadoViaje, pagina = 1) =>
    apiClient
      .get<PagedResult<ViajeResumen>>('/viajes/publicados', { params: { estado, pagina } })
      .then((r) => r.data),
  detalle: (id: string) =>
    apiClient.get<ViajeDetalle>(`/viajes/${encodeURIComponent(id)}`).then((r) => r.data),
  editar: (id: string, p: EditarViajeRequest) =>
    apiClient.put<ViajeDetalle>(`/viajes/${encodeURIComponent(id)}`, p).then((r) => r.data),
  /** HU-06: viajes programados con cupo; los parámetros vacíos no se envían. */
  buscar: (p: BuscarViajesParams) =>
    apiClient
      .get<PagedResult<ViajeResumen>>('/viajes', {
        params: {
          destino: p.destino?.trim() || undefined,
          puntoEncuentroId: p.puntoEncuentroId || undefined,
          fecha: p.fecha || undefined,
          orden: p.orden,
          pagina: p.pagina,
          tamanoPagina: p.tamanoPagina,
        },
      })
      .then((r) => r.data),
  /** HU-08 (pasajero con reserva confirmada): 404 VIAJE_UBICACION_NO_DISPONIBLE si el conductor no comparte aún. */
  ubicacion: (id: string) =>
    apiClient
      .get<UbicacionConductor>(`/viajes/${encodeURIComponent(id)}/ubicacion`)
      .then((r) => r.data),
  /** HU-08: ruta real por calles del viaje (punto de encuentro → paradas → destino). */
  ruta: (id: string) =>
    apiClient.get<RutaViaje>(`/viajes/${encodeURIComponent(id)}/ruta`).then((r) => r.data),
  /** HU-08: tiempo estimado de llegada y distancia restante del conductor, por calles. */
  llegada: (id: string) =>
    apiClient
      .get<LlegadaConductor>(`/viajes/${encodeURIComponent(id)}/llegada`)
      .then((r) => r.data),
  /** HU-08 (conductor): comparte su posición actual. */
  compartirUbicacion: (id: string, latitud: number, longitud: number) =>
    apiClient
      .put(`/viajes/${encodeURIComponent(id)}/ubicacion`, { latitud, longitud })
      .then(() => undefined),
}
