import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/core/http/apiError'
import { reservasApi } from '../../api/reservasApi'
import type { Reserva } from '../../domain/tipos'
import { useReservar } from '../useReservar'

vi.mock('../../api/reservasApi', () => ({
  reservasApi: {
    crear: vi.fn<(viajeId: string, asientos: number) => Promise<Reserva>>(),
  },
}))

const crear = vi.mocked(reservasApi.crear)

describe('useReservar (HU-07)', () => {
  beforeEach(() => {
    crear.mockReset()
  })

  it('rechaza en el cliente 2 asientos si solo queda 1, sin llamar a la API', async () => {
    const { asientos, error, reservar } = useReservar()
    asientos.value = 2

    const resultado = await reservar('viaje-1', 1)

    expect(resultado).toBeNull()
    expect(error.value?.detail).toBe('Solo queda 1 asiento disponible')
    expect(crear).not.toHaveBeenCalled()
  })

  it('crea la reserva con los asientos elegidos', async () => {
    const reserva = { id: 'r1', folio: 'KAR-UTTT-2026-000123', estado: 'Confirmada' } as Reserva
    crear.mockResolvedValue(reserva)
    const { asientos, error, reservar } = useReservar()
    asientos.value = 1

    const resultado = await reservar('viaje-1', 2)

    expect(resultado).toEqual(reserva)
    expect(crear).toHaveBeenCalledWith('viaje-1', 1)
    expect(error.value).toBeNull()
  })

  it('expone el error 409 cuando otro pasajero se quedó con el último asiento', async () => {
    crear.mockRejectedValue(
      new ApiError(409, 'VIAJE_SIN_CUPO', 'El viaje ya no tiene asientos disponibles.'),
    )
    const { error, reservando, reservar } = useReservar()

    const resultado = await reservar('viaje-1', 1)

    expect(resultado).toBeNull()
    expect(error.value?.code).toBe('VIAJE_SIN_CUPO')
    expect(reservando.value).toBe(false)
  })
})
