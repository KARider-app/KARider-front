import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/core/http/apiError'
import { reservasApi } from '../../api/reservasApi'
import { viajesApi } from '@/features/viajes/api/viajesApi'
import type {
  LlegadaConductor,
  RutaViaje,
  UbicacionConductor,
} from '@/features/viajes/domain/tipos'
import type { Reserva } from '../../domain/tipos'
import { useMapaReserva } from '../useMapaReserva'

vi.mock('../../api/reservasApi', () => ({
  reservasApi: { obtener: vi.fn<(id: string) => Promise<Reserva>>() },
}))
vi.mock('@/features/viajes/api/viajesApi', () => ({
  viajesApi: {
    ubicacion: vi.fn<(id: string) => Promise<UbicacionConductor>>(),
    ruta: vi.fn<(id: string) => Promise<RutaViaje>>(),
    llegada: vi.fn<(id: string) => Promise<LlegadaConductor>>(),
  },
}))

const obtener = vi.mocked(reservasApi.obtener)
const ruta = vi.mocked(viajesApi.ruta)

function reserva(estadoViaje: 'Programado' | 'Cancelado' = 'Programado'): Reserva {
  return {
    id: 'r1',
    folio: 'KAR-UTTT-2026-000123',
    estado: 'Confirmada',
    asientos: 1,
    montoAporte: 40,
    aportePagado: false,
    creadoEn: '2026-11-01T00:00:00.000Z',
    respondidaEn: '2026-11-01T00:05:00.000Z',
    viaje: {
      id: 'v1',
      destino: 'Centro de Tula',
      fechaSalida: '2026-11-01T20:00:00.000Z',
      estado: estadoViaje,
      puntoEncuentro: { id: 1, nombre: 'Entrada UTTT', descripcion: '', latitud: 0, longitud: 0 },
      conductor: {
        id: 'c1',
        nombreCompleto: 'Conductor de prueba',
        fotoUrl: null,
        calificacion: 0,
        telefono: '7731234567',
      },
      vehiculo: 'Nissan Versa',
      placas: 'HNX421BCD',
    },
  }
}

describe('useMapaReserva (HU-15: datos de la reserva sin conexión)', () => {
  beforeEach(() => {
    obtener.mockReset()
    ruta.mockReset()
    localStorage.clear()
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('guarda la reserva en caché al cargarla con éxito', async () => {
    // Viaje cancelado: evita entrar al flujo de polling de ubicación, fuera del alcance de esta prueba.
    obtener.mockResolvedValue(reserva('Cancelado'))
    ruta.mockRejectedValue(new Error('sin ruta'))
    const { reserva: r, sinConexionDatos, cargar } = useMapaReserva()

    await cargar('r1')

    expect(r.value?.folio).toBe('KAR-UTTT-2026-000123')
    expect(sinConexionDatos.value).toBe(false)
    expect(localStorage.getItem('karider.reserva.r1')).toContain('KAR-UTTT-2026-000123')
  })

  it('sin conexión y con caché previa, muestra folio, punto de encuentro y contacto guardados', async () => {
    obtener.mockResolvedValueOnce(reserva('Cancelado'))
    ruta.mockRejectedValue(new Error('sin ruta'))
    const primero = useMapaReserva()
    await primero.cargar('r1')

    obtener.mockRejectedValueOnce(new ApiError(0, 'SIN_CONEXION', 'No hay conexión.'))
    const { reserva: r, sinConexionDatos, error, cargar } = useMapaReserva()
    await cargar('r1')

    expect(sinConexionDatos.value).toBe(true)
    expect(error.value).toBeNull()
    expect(r.value?.folio).toBe('KAR-UTTT-2026-000123')
    expect(r.value?.viaje.puntoEncuentro.nombre).toBe('Entrada UTTT')
    expect(r.value?.viaje.conductor.telefono).toBe('7731234567')
  })

  it('sin conexión y sin caché previa, muestra el error normal', async () => {
    obtener.mockRejectedValue(new ApiError(0, 'SIN_CONEXION', 'No hay conexión.'))
    const { reserva: r, sinConexionDatos, error, cargar } = useMapaReserva()

    await cargar('r1')

    expect(sinConexionDatos.value).toBe(false)
    expect(error.value?.code).toBe('SIN_CONEXION')
    expect(r.value).toBeNull()
  })
})
