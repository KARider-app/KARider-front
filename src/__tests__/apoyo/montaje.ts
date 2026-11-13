/**
 * Apoyo para pruebas de vistas: API falsa (sobre apiClient) y montaje con router y Pinia.
 * Vive en __tests__ para que Sonar lo trate como código de prueba.
 */
import { vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter, type RouteRecordRaw } from 'vue-router'
import type { Component } from 'vue'
import { apiClient } from '@/core/http/apiClient'
import { ApiError } from '@/core/http/apiError'
import { useAuthStore } from '@/features/auth/application/useAuthStore'
import type { Rol, UsuarioSesion } from '@/features/auth/domain/tipos'

// ---------- Datos de prueba ----------
export const punto = {
  id: 1,
  nombre: 'Puerta Principal (Torniquetes A)',
  descripcion: 'Junto a la caseta de vigilancia principal.',
  latitud: 20.0385,
  longitud: -99.2132,
}

const manana = new Date(Date.now() + 86_400_000).toISOString()

export const conductorDetalle = {
  id: 'c1',
  nombreCompleto: 'Valeria Gómez Ramírez',
  carrera: 'Ing. en Mecatrónica',
  fotoUrl: null,
  calificacion: 4.9,
  totalCalificaciones: 42,
  verificado: true,
  telefono: '7731234567',
}

export function viajeResumen(id = 'v1', p: Record<string, unknown> = {}) {
  return {
    id,
    conductor: { ...conductorDetalle, calificacion: 4.8 },
    puntoEncuentro: punto,
    destino: 'Pachuca de Soto (Plaza Galerías)',
    paradas: ['Actopan Centro'],
    fechaSalida: manana,
    aportePorAsiento: 40,
    asientosDisponibles: 2,
    asientosOfrecidos: 3,
    vehiculo: { modelo: 'Nissan Versa', color: 'Azul', verificado: true },
    estado: 'Programado',
    ...p,
  }
}

export function reserva(p: Record<string, unknown> = {}) {
  return {
    id: 'r1',
    folio: 'KAR-UTTT-2026-9874',
    estado: 'Confirmada',
    asientos: 1,
    montoAporte: 40,
    aportePagado: false,
    creadoEn: manana,
    respondidaEn: manana,
    viaje: {
      id: 'v1',
      destino: 'Pachuca de Soto (Plaza Galerías)',
      fechaSalida: manana,
      estado: 'EnCurso',
      puntoEncuentro: punto,
      conductor: {
        id: 'c1',
        nombreCompleto: 'Valeria Gómez Ramírez',
        fotoUrl: null,
        calificacion: 4.9,
        telefono: '7731234567',
      },
      vehiculo: 'Nissan Versa Azul Acero',
      placas: 'HNX-421-C',
    },
    ...p,
  }
}

export const vehiculo = {
  id: 'veh1',
  modelo: 'Nissan Versa Sense',
  color: 'Azul Acero',
  anio: 2022,
  placas: 'HNX-421-C',
  capacidad: 4,
  verificado: true,
}

export const pagina = <T>(items: T[]) => ({
  items,
  pagina: 1,
  tamanoPagina: 20,
  total: items.length,
  totalPaginas: 1,
  tieneSiguiente: false,
})

export function perfil(rol: Rol = 'Pasajero') {
  return {
    id: 'u1',
    nombreCompleto: 'Carlos Mendoza López',
    correoInstitucional: 'carlos.mendoza@uttt.edu.mx',
    matricula: '22300630',
    telefono: '7731234567',
    carrera: 'Ing. en Desarrollo y Gestión de Software',
    cuatrimestre: 7,
    fotoUrl: null,
    rol,
    correoVerificado: true,
    calificacion: 4.9,
    totalCalificaciones: 24,
    estadisticas: {
      viajesRealizados: 18,
      viajesComoConductor: 4,
      viajesComoPasajero: 14,
      ahorroCombustible: 1480,
      co2EvitadoKg: 42,
    },
    miembroDesde: '2026-01-10T00:00:00Z',
  }
}

export const historial = [
  {
    viajeId: 'h1',
    rolEnViaje: 'Pasajero',
    fechaSalida: '2026-09-18T20:15:00Z',
    monto: 45,
    origen: 'Campus UTTT (Puerta 1)',
    destino: 'Pachuca de Soto (Galerías)',
    estadoViaje: 'Completado',
    estadoReserva: 'Completada',
    aportePagado: true,
    pasajeros: null,
    companero: {
      id: 'c1',
      nombreCompleto: 'Valeria Gómez R.',
      vehiculo: 'Nissan Versa Azul',
      calificacion: 5,
    },
  },
  {
    viajeId: 'h2',
    rolEnViaje: 'Conductor',
    fechaSalida: '2026-09-10T23:00:00Z',
    monto: 90,
    origen: 'Campus UTTT (Estacionamiento Poniente)',
    destino: 'Tepeji del Río',
    estadoViaje: 'Completado',
    estadoReserva: null,
    aportePagado: false,
    pasajeros: 3,
    companero: { id: 'p3', nombreCompleto: 'Marco Morales S.', vehiculo: null, calificacion: 4.9 },
  },
]

export const reputacion = {
  usuarioId: 'u1',
  promedio: 4.9,
  totalCalificaciones: 24,
  etiquetas: [{ etiqueta: 'Puntual', total: 12 }],
  resenas: pagina([
    {
      id: 'cal1',
      viajeId: 'h1',
      evaluadorId: 'c1',
      evaluadorNombre: 'Valeria Gómez R.',
      evaluadorCarrera: 'Ing. Mecatrónica',
      rolEvaluado: 'Pasajero',
      estrellas: 5,
      etiquetas: ['Puntual'],
      comentario: 'Muy puntual.',
      creadoEn: '2026-09-18T22:00:00Z',
    },
  ]),
}

export function credenciales(conVehiculo = true) {
  return {
    correoInstitucional: 'carlos.mendoza@uttt.edu.mx',
    matricula: '22300630',
    carrera: 'Ing. en Desarrollo y Gestión de Software',
    estatus: 'Alumno Regular Activo',
    correoVerificado: true,
    vehiculos: conVehiculo ? [vehiculo] : [],
  }
}

export const pendientes = [
  {
    viajeId: 'h1',
    destino: 'Pachuca',
    fechaSalida: '2026-09-18T20:15:00Z',
    evaluadoId: 'c1',
    evaluadoNombre: 'Valeria Gómez R.',
    rolEvaluado: 'Conductor',
  },
]

// ---------- API falsa ----------
type Respuesta = unknown | ((url: string, cuerpo?: unknown) => unknown)
/** Ruta exacta (sin /api/v1) o expresión regular → datos; un Error se rechaza. */
export type MapaApi = [string | RegExp, Respuesta][]

export const errorApi = (status: number, code: string) =>
  new ApiError(status, code, `Error ${code}`)

export function instalarApiFalsa(mapa: MapaApi) {
  const resolver = (url: string, cuerpo?: unknown) => {
    const entrada = mapa.find(([k]) => (typeof k === 'string' ? k === url : k.test(url)))
    if (!entrada) return Promise.reject(errorApi(404, 'NO_ENCONTRADO'))
    const v = typeof entrada[1] === 'function' ? entrada[1](url, cuerpo) : entrada[1]
    return v instanceof Error ? Promise.reject(v) : Promise.resolve({ data: v })
  }
  vi.spyOn(apiClient, 'get').mockImplementation((url: string) => resolver(url) as never)
  vi.spyOn(apiClient, 'post').mockImplementation(
    (url: string, c?: unknown) => resolver(url, c) as never,
  )
  vi.spyOn(apiClient, 'put').mockImplementation(
    (url: string, c?: unknown) => resolver(url, c) as never,
  )
  vi.spyOn(apiClient, 'patch').mockImplementation(
    (url: string, c?: unknown) => resolver(url, c) as never,
  )
}

// ---------- Montaje ----------
const Vacia = { template: '<div />' }
const NOMBRES = [
  ['/', 'inicio'],
  ['/login', 'login'],
  ['/registro', 'registro'],
  ['/verificar-correo', 'verificar'],
  ['/recuperar-contrasena', 'recuperar'],
  ['/publicar', 'publicar-1'],
  ['/publicar/gastos', 'publicar-2'],
  ['/publicar/borradores', 'borradores'],
  ['/viajes', 'buscar'],
  ['/viajes/:id', 'viaje'],
  ['/viajes/:id/editar', 'viaje-editar'],
  ['/reservas', 'mis-reservas'],
  ['/reservas/:id/mapa', 'mapa-reserva'],
  ['/perfil', 'perfil'],
] as const

export function usuario(rol: Rol = 'Pasajero'): UsuarioSesion {
  return {
    id: 'u1',
    nombreCompleto: 'Carlos Mendoza López',
    correoInstitucional: 'carlos.mendoza@uttt.edu.mx',
    rol,
    fotoUrl: null,
  }
}

/**
 * Monta `componente` en la ruta `ruta` (cuyo nombre es `nombre`).
 * `rol` null = sin sesión.
 */
export async function montar(
  componente: Component,
  opciones: { ruta: string; nombre: string; rol?: Rol | null; stubs?: Record<string, Component> },
) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const auth = useAuthStore()
  if (opciones.rol) auth.usuario = usuario(opciones.rol)

  const routes: RouteRecordRaw[] = NOMBRES.map(([path, name]) => ({
    path,
    name,
    component: name === opciones.nombre ? componente : Vacia,
  }))
  const router = createRouter({ history: createMemoryHistory(), routes })
  await router.push(opciones.ruta)
  await router.isReady()

  const wrapper = mount(componente, {
    global: { plugins: [pinia, router], stubs: opciones.stubs ?? {} },
    attachTo: document.body,
  })
  await flushPromises()
  return { wrapper, router, auth }
}
