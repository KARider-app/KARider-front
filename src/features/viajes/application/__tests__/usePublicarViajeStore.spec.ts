import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { aFechaInput, sumarDias } from '@/core/utils/fechas'
import { viajesApi } from '../../api/viajesApi'
import type { PublicarViajeRequest, Vehiculo, ViajeDetalle } from '../../domain/tipos'
import { usePublicarViajeStore } from '../usePublicarViajeStore'

vi.mock('../../api/viajesApi', () => ({
  viajesApi: {
    publicar: vi.fn<(p: PublicarViajeRequest) => Promise<ViajeDetalle>>(),
    misVehiculos: vi.fn<() => Promise<Vehiculo[]>>(),
  },
}))

const publicar = vi.mocked(viajesApi.publicar)

describe('usePublicarViajeStore (HU-22)', () => {
  beforeEach(() => {
    sessionStorage.clear()
    setActivePinia(createPinia())
    publicar.mockReset()
    publicar.mockResolvedValue({ id: 'v1' } as ViajeDetalle)
  })

  function llenarPaso1(coordenadas: {
    destinoLatitud: number | null
    destinoLongitud: number | null
  }) {
    const store = usePublicarViajeStore()
    Object.assign(store.borrador, {
      puntoEncuentroId: 1,
      destino: 'Tula Centro',
      ...coordenadas,
      paradas: [],
      fecha: aFechaInput(sumarDias(new Date(), 1)),
      hora: '14:30',
      asientos: 3,
    })
    return store
  }

  it('envía a la API las coordenadas del lugar elegido en el mapa', async () => {
    const store = llenarPaso1({ destinoLatitud: 20.0539, destinoLongitud: -99.3412 })

    await store.enviar({ gastoTotal: 150, notas: '', vehiculoId: 'veh1' }, true)

    expect(publicar).toHaveBeenCalledWith(
      expect.objectContaining({
        destino: 'Tula Centro',
        destinoLatitud: 20.0539,
        destinoLongitud: -99.3412,
        publicar: true,
      }),
    )
    // Al terminar, el borrador queda vacío y sin ubicación.
    expect(store.borrador.destinoLatitud).toBeNull()
  })

  it('sin lugar elegido envía null y la API ubica el texto', async () => {
    const store = llenarPaso1({ destinoLatitud: null, destinoLongitud: null })

    await store.enviar({ gastoTotal: 150, notas: '', vehiculoId: '' }, false)

    expect(publicar).toHaveBeenCalledWith(
      expect.objectContaining({ destinoLatitud: null, destinoLongitud: null, publicar: false }),
    )
  })

  it('un borrador guardado antes de la HU-22 se recupera sin ubicación', () => {
    sessionStorage.setItem('karider.borrador-viaje', JSON.stringify({ destino: 'Tula' }))

    const store = usePublicarViajeStore()

    expect(store.borrador.destino).toBe('Tula')
    expect(store.borrador.destinoLatitud).toBeNull()
    expect(store.borrador.destinoLongitud).toBeNull()
  })
})
