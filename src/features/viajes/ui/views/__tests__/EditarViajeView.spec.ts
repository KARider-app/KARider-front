import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { ApiError } from '@/core/http/apiError'
import { useCatalogosStore } from '@/features/catalogos/application/useCatalogosStore'
import { viajesApi } from '../../../api/viajesApi'
import type { EditarViajeRequest, ViajeDetalle } from '../../../domain/tipos'
import EditarViajeView from '../EditarViajeView.vue'

vi.mock('../../../api/viajesApi', () => ({
  viajesApi: {
    detalle: vi.fn<(id: string) => Promise<ViajeDetalle>>(),
    editar: vi.fn<(id: string, p: EditarViajeRequest) => Promise<ViajeDetalle>>(),
  },
}))

const detalle = vi.mocked(viajesApi.detalle)
const editar = vi.mocked(viajesApi.editar)

const Vacia = { template: '<div />' }

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
    paradas: [],
    fechaSalida: '2026-12-01T20:30:00.000Z',
    gastoTotal: 160,
    aportePorAsiento: 40,
    asientosDisponibles: 1,
    asientosOfrecidos: 3,
    notas: '',
    estado: 'Programado',
    esPropietario: true,
    miReserva: null,
    ...p,
  }
}

async function montar() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/viajes/:id', name: 'viaje', component: Vacia },
      { path: '/viajes/:id/editar', name: 'viaje-editar', component: EditarViajeView },
    ],
  })
  await router.push('/viajes/v1/editar')
  await router.isReady()

  const catalogos = useCatalogosStore()
  catalogos.puntosEncuentro = [
    { id: 1, nombre: 'Entrada UTTT', descripcion: 'Caseta principal', latitud: 0, longitud: 0 },
  ]

  const wrapper = mount(EditarViajeView, { global: { plugins: [router] } })
  await flushPromises()
  return { wrapper, router }
}

function campoPor(wrapper: ReturnType<typeof mount>, etiqueta: string) {
  const label = wrapper.findAll('label.campo__etiqueta').find((l) => l.text() === etiqueta)
  const id = label!.attributes('for')
  return wrapper.get(`#${id}`)
}

describe('EditarViajeView (HU-09)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    detalle.mockReset()
    editar.mockReset()
  })

  it('carga el viaje y muestra el formulario con los datos actuales', async () => {
    detalle.mockResolvedValue(viaje())
    const { wrapper } = await montar()

    expect(wrapper.find('form').exists()).toBe(true)
    expect((campoPor(wrapper, 'Destino final').element as HTMLInputElement).value).toBe(
      'Centro de Tula',
    )
    expect(wrapper.text()).not.toContain('serán notificados')
  })

  it('avisa que se notificará a los pasajeros al cambiar un dato relevante con asientos reservados', async () => {
    detalle.mockResolvedValue(viaje({ asientosOfrecidos: 3, asientosDisponibles: 1 }))
    const { wrapper } = await montar()

    await campoPor(wrapper, 'Hora de salida').setValue('21:00')

    expect(wrapper.text()).toContain('2 asientos reservados')
    expect(wrapper.text()).toContain('serán notificados')
  })

  it('no avisa si el cambio no afecta a los pasajeros (ej. notas)', async () => {
    detalle.mockResolvedValue(viaje({ asientosOfrecidos: 3, asientosDisponibles: 1 }))
    const { wrapper } = await montar()

    await wrapper.get('#notas').setValue('Favor de llegar puntual')

    expect(wrapper.text()).not.toContain('serán notificados')
  })

  it('no deja editar un viaje que ya arrancó o terminó', async () => {
    detalle.mockResolvedValue(viaje({ estado: 'EnCurso' }))
    const { wrapper } = await montar()

    expect(wrapper.text()).toContain('Este viaje ya no se puede editar.')
    expect(wrapper.find('form').exists()).toBe(false)
  })

  it('guarda los cambios y regresa al detalle del viaje', async () => {
    detalle.mockResolvedValue(viaje())
    editar.mockResolvedValue(viaje({ destino: 'Nuevo destino' }))
    const { wrapper, router } = await montar()

    await campoPor(wrapper, 'Destino final').setValue('Nuevo destino')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(editar).toHaveBeenCalledWith('v1', expect.objectContaining({ destino: 'Nuevo destino' }))
    expect(router.currentRoute.value.name).toBe('viaje')
    expect(router.currentRoute.value.query.editado).toBe('1')
  })

  it('muestra el error general si la API rechaza el guardado', async () => {
    detalle.mockResolvedValue(viaje())
    editar.mockRejectedValue(new ApiError(409, 'VIAJE_SIN_CUPO', 'Ya no hay cupo suficiente.'))
    const { wrapper } = await montar()

    await campoPor(wrapper, 'Destino final').setValue('Nuevo destino')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Ya no hay cupo suficiente.')
  })
})
