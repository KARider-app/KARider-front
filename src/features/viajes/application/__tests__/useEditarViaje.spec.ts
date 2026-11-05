import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/core/http/apiError'
import { viajesApi } from '../../api/viajesApi'
import type { EditarViajeRequest, ViajeDetalle } from '../../domain/tipos'
import { useEditarViaje } from '../useEditarViaje'

vi.mock('../../api/viajesApi', () => ({
  viajesApi: {
    detalle: vi.fn<(id: string) => Promise<ViajeDetalle>>(),
    editar: vi.fn<(id: string, p: EditarViajeRequest) => Promise<ViajeDetalle>>(),
  },
}))

const detalle = vi.mocked(viajesApi.detalle)
const editar = vi.mocked(viajesApi.editar)

function viaje(p: Partial<ViajeDetalle> = {}): ViajeDetalle {
  return {
    id: 'v1',
    conductor: {
      id: 'c1',
      nombreCompleto: 'Dueño',
      carrera: 'ISC',
      fotoUrl: null,
      calificacion: 5,
      totalCalificaciones: 1,
      verificado: true,
      telefono: null,
    },
    vehiculo: { modelo: 'Versa', color: 'Azul', anio: 2022, placas: 'HNX-421-C', verificado: true },
    puntoEncuentro: { id: 1, nombre: 'Entrada UTTT', descripcion: '', latitud: 0, longitud: 0 },
    destino: 'Centro de Tula',
    destinoLatitud: null,
    destinoLongitud: null,
    paradas: [{ orden: 1, nombre: 'Plaza Galerías' }],
    fechaSalida: '2026-12-01T20:30:00.000Z',
    gastoTotal: 160,
    aportePorAsiento: 40,
    asientosDisponibles: 1,
    asientosOfrecidos: 3,
    notas: 'Puntualidad por favor',
    estado: 'Programado',
    esPropietario: true,
    miReserva: null,
    ...p,
  }
}

describe('useEditarViaje (HU-09)', () => {
  beforeEach(() => {
    detalle.mockReset()
    editar.mockReset()
  })

  it('carga el viaje, calcula reservados y deja el formulario sin cambios', async () => {
    detalle.mockResolvedValue(viaje())
    const { cargar, viaje: v, reservados, hayCambios, editable, errorCarga } = useEditarViaje()

    await cargar('v1')

    expect(v.value?.id).toBe('v1')
    expect(reservados.value).toBe(2) // 3 ofrecidos - 1 disponible
    expect(hayCambios.value).toBe(false)
    expect(editable.value).toBe(true)
    expect(errorCarga.value).toBeNull()
  })

  it('expone el error cuando no se puede cargar el viaje', async () => {
    detalle.mockRejectedValue(new ApiError(404, 'VIAJE_NO_ENCONTRADO', 'No existe.'))
    const { cargar, errorCarga, viaje: v } = useEditarViaje()

    await cargar('v1')

    expect(v.value).toBeNull()
    expect(errorCarga.value?.code).toBe('VIAJE_NO_ENCONTRADO')
  })

  it('marca hayCambios al modificar un campo y lo limpia si se vuelve al valor original', async () => {
    detalle.mockResolvedValue(viaje())
    const { cargar, formulario, hayCambios } = useEditarViaje()
    await cargar('v1')

    formulario.valores.value.destino = 'Otro destino'
    expect(hayCambios.value).toBe(true)

    formulario.valores.value.destino = 'Centro de Tula'
    expect(hayCambios.value).toBe(false)
  })

  it('detecta cambios relevantes (horario, punto o ruta) para avisar a los pasajeros', async () => {
    detalle.mockResolvedValue(viaje())
    const { cargar, formulario, cambiosRelevantes } = useEditarViaje()
    await cargar('v1')
    expect(cambiosRelevantes.value).toBe(false)

    formulario.valores.value.hora = '21:00'
    expect(cambiosRelevantes.value).toBe(true)
  })

  it('no marca como relevante un cambio que no afecta a los pasajeros (ej. notas)', async () => {
    detalle.mockResolvedValue(viaje())
    const { cargar, formulario, cambiosRelevantes, hayCambios } = useEditarViaje()
    await cargar('v1')

    formulario.valores.value.notas = 'Nueva nota'
    expect(hayCambios.value).toBe(true)
    expect(cambiosRelevantes.value).toBe(false)
  })

  it('guarda enviando los datos del formulario convertidos a UTC', async () => {
    detalle.mockResolvedValue(viaje())
    editar.mockResolvedValue(viaje({ destino: 'Nuevo destino' }))
    const { cargar, formulario, guardar } = useEditarViaje()
    await cargar('v1')
    formulario.valores.value.destino = 'Nuevo destino'

    const guardado = await guardar()

    expect(guardado).toBe(true)
    expect(editar).toHaveBeenCalledWith(
      'v1',
      expect.objectContaining({ destino: 'Nuevo destino', asientos: 3, gastoTotal: 160 }),
    )
  })

  it('no guarda y expone el error general si la API rechaza la edición', async () => {
    detalle.mockResolvedValue(viaje())
    editar.mockRejectedValue(new ApiError(409, 'VIAJE_SIN_CUPO', 'Ya no hay cupo suficiente.'))
    const { cargar, formulario, guardar } = useEditarViaje()
    await cargar('v1')
    formulario.valores.value.destino = 'Nuevo destino'

    const guardado = await guardar()

    expect(guardado).toBe(false)
    expect(formulario.errorGeneral.value?.code).toBe('VIAJE_SIN_CUPO')
  })
})
