import { ref } from 'vue'
import { comoApiError, type ApiError } from '@/core/http/apiError'
import { perfilApi } from '../api/perfilApi'
import type {
  CalificacionPendiente,
  CalificarRequest,
  Credenciales,
  FiltroRolHistorial,
  HistorialItem,
  Perfil,
  Reputacion,
} from '../domain/tipos'

/** Datos del perfil del usuario autenticado: estadísticas, historial, reputación y credenciales (P13-P15). */
export function usePerfil() {
  const perfil = ref<Perfil | null>(null)
  const cargandoPerfil = ref(false)
  const errorPerfil = ref<ApiError | null>(null)

  const historial = ref<HistorialItem[]>([])
  const cargandoHistorial = ref(false)
  const errorHistorial = ref<ApiError | null>(null)
  const filtroRol = ref<FiltroRolHistorial>('Todos')

  const reputacion = ref<Reputacion | null>(null)
  const cargandoReputacion = ref(false)
  const errorReputacion = ref<ApiError | null>(null)

  const credenciales = ref<Credenciales | null>(null)
  const cargandoCredenciales = ref(false)
  const errorCredenciales = ref<ApiError | null>(null)

  const pendientes = ref<CalificacionPendiente[]>([])

  async function cargarPerfil() {
    cargandoPerfil.value = true
    errorPerfil.value = null
    try {
      perfil.value = await perfilApi.obtener()
    } catch (e) {
      errorPerfil.value = comoApiError(e)
    } finally {
      cargandoPerfil.value = false
    }
  }

  async function cargarHistorial(rol: FiltroRolHistorial = filtroRol.value) {
    filtroRol.value = rol
    cargandoHistorial.value = true
    errorHistorial.value = null
    try {
      historial.value = (await perfilApi.historial(rol)).items
    } catch (e) {
      errorHistorial.value = comoApiError(e)
    } finally {
      cargandoHistorial.value = false
    }
  }

  async function cargarReputacion() {
    cargandoReputacion.value = true
    errorReputacion.value = null
    try {
      reputacion.value = await perfilApi.calificaciones()
    } catch (e) {
      errorReputacion.value = comoApiError(e)
    } finally {
      cargandoReputacion.value = false
    }
  }

  async function cargarCredenciales() {
    cargandoCredenciales.value = true
    errorCredenciales.value = null
    try {
      credenciales.value = await perfilApi.credenciales()
    } catch (e) {
      errorCredenciales.value = comoApiError(e)
    } finally {
      cargandoCredenciales.value = false
    }
  }

  async function cargarPendientes() {
    try {
      pendientes.value = await perfilApi.pendientes()
    } catch {
      /* no bloquea la pantalla: solo oculta la acción de evaluar */
    }
  }

  function pendientePara(viajeId: string): CalificacionPendiente | undefined {
    return pendientes.value.find((p) => p.viajeId === viajeId)
  }

  async function calificar(request: CalificarRequest) {
    await perfilApi.calificar(request)
    pendientes.value = pendientes.value.filter((p) => p.viajeId !== request.viajeId)
  }

  return {
    perfil,
    cargandoPerfil,
    errorPerfil,
    cargarPerfil,
    historial,
    cargandoHistorial,
    errorHistorial,
    filtroRol,
    cargarHistorial,
    reputacion,
    cargandoReputacion,
    errorReputacion,
    cargarReputacion,
    credenciales,
    cargandoCredenciales,
    errorCredenciales,
    cargarCredenciales,
    pendientes,
    cargarPendientes,
    pendientePara,
    calificar,
  }
}
