import { apiClient } from '@/core/http/apiClient'
import type { VehiculoRequest } from '@/features/auth/domain/tipos'
import type { PagedResult, Vehiculo } from '@/features/viajes/domain/tipos'
import type {
  ActualizarPerfilRequest,
  CalificacionPendiente,
  CalificarRequest,
  Credenciales,
  FiltroRolHistorial,
  HistorialItem,
  Perfil,
  Reputacion,
} from '../domain/tipos'

export const perfilApi = {
  obtener: () => apiClient.get<Perfil>('/perfil').then((r) => r.data),
  actualizar: (p: ActualizarPerfilRequest) =>
    apiClient.put<Perfil>('/perfil', p).then((r) => r.data),
  historial: (rol: FiltroRolHistorial = 'Todos', pagina = 1) =>
    apiClient
      .get<PagedResult<HistorialItem>>('/perfil/historial', { params: { rol, pagina } })
      .then((r) => r.data),
  calificaciones: (pagina = 1) =>
    apiClient.get<Reputacion>('/perfil/calificaciones', { params: { pagina } }).then((r) => r.data),
  credenciales: () => apiClient.get<Credenciales>('/perfil/credenciales').then((r) => r.data),
  pendientes: () =>
    apiClient.get<CalificacionPendiente[]>('/calificaciones/pendientes').then((r) => r.data),
  calificar: (p: CalificarRequest) => apiClient.post('/calificaciones', p).then(() => undefined),
  /** HU-17: registrar el primer vehículo convierte la cuenta en conductor. */
  registrarVehiculo: (v: VehiculoRequest) =>
    apiClient.post<Vehiculo>('/vehiculos', v).then((r) => r.data),
}
