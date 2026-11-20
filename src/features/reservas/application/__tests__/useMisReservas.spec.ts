import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/core/http/apiError'
import type { PagedResult } from '@/features/viajes/domain/tipos'
import { reservasApi } from '../../api/reservasApi'
import type { Reserva } from '../../domain/tipos'
import { useMisReservas } from '../useMisReservas'

vi.mock('../../api/reservasApi', () => ({
  reservasApi: {
    misReservas: vi.fn<() => Promise<PagedResult<Reserva>>>(),
  },
}))

const misReservas = vi.mocked(reservasApi.misReservas)

function reserva(id: string): Reserva {
  return {
    id,
    folio: `KAR-UTTT-2026-00000${id}`,
    estado: 'Confirmada',
    asientos: 1,
    montoAporte: 40,
    aportePagado: false,
    creadoEn: '2026-11-01T00:00:00.000Z',
    respondidaEn: null,
    viaje: {
      id: `v${id}`,
      destino: 'Centro de Tula',
      fechaSalida: '2026-11-01T20:00:00.000Z',
      estado: 'Programado',
      puntoEncuentro: { id: 1, nombre: 'Entrada UTTT', descripcion: '', latitud: 0, longitud: 0 },
      conductor: {
        id: 'c1',
        nombreCompleto: 'Conductor',
        fotoUrl: null,
        calificacion: 0,
        telefono: '7731234567',
      },
      vehiculo: 'Nissan Versa',
      placas: 'HNX421BCD',
    },
  }
}

const pagina = (items: Reserva[]): PagedResult<Reserva> => ({
  items,
  total: items.length,
  pagina: 1,
  tamanoPagina: 20,
  totalPaginas: 1,
  tieneSiguiente: false,
})

describe('useMisReservas (HU-15: consultar reservas sin conexión)', () => {
  beforeEach(() => {
    misReservas.mockReset()
    localStorage.clear()
  })

  it('guarda las reservas en caché al cargarlas con éxito', async () => {
    misReservas.mockResolvedValue(pagina([reserva('1')]))
    const { reservas, sinConexion, cargar } = useMisReservas()

    await cargar()

    expect(reservas.value).toHaveLength(1)
    expect(sinConexion.value).toBe(false)
    expect(localStorage.getItem('karider.misReservas')).toContain('KAR-UTTT-2026-000001')
  })

  it('sin conexión y con caché previa, muestra las reservas guardadas', async () => {
    misReservas.mockResolvedValueOnce(pagina([reserva('1')]))
    const primero = useMisReservas()
    await primero.cargar()

    misReservas.mockRejectedValueOnce(
      new ApiError(0, 'SIN_CONEXION', 'No hay conexión con el servidor.'),
    )
    const { reservas, sinConexion, error, cargar } = useMisReservas()
    await cargar()

    expect(sinConexion.value).toBe(true)
    expect(error.value).toBeNull()
    expect(reservas.value[0]!.folio).toBe('KAR-UTTT-2026-000001')
  })

  it('sin conexión y sin caché previa, muestra el error normal', async () => {
    misReservas.mockRejectedValue(new ApiError(0, 'SIN_CONEXION', 'No hay conexión.'))
    const { reservas, sinConexion, error, cargar } = useMisReservas()

    await cargar()

    expect(sinConexion.value).toBe(false)
    expect(error.value?.code).toBe('SIN_CONEXION')
    expect(reservas.value).toEqual([])
  })

  it('un error que no es de conexión no usa la caché', async () => {
    misReservas.mockResolvedValueOnce(pagina([reserva('1')]))
    const primero = useMisReservas()
    await primero.cargar()

    misReservas.mockRejectedValueOnce(new ApiError(500, 'ERROR_SERVIDOR', 'Error interno.'))
    const { sinConexion, error, cargar } = useMisReservas()
    await cargar()

    expect(sinConexion.value).toBe(false)
    expect(error.value?.code).toBe('ERROR_SERVIDOR')
  })
})
