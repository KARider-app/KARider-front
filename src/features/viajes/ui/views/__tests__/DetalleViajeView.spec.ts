import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { viajesApi } from '../../../api/viajesApi'
import type { ViajeDetalle } from '../../../domain/tipos'
import DetalleViajeView from '../DetalleViajeView.vue'

vi.mock('../../../api/viajesApi', () => ({
  viajesApi: {
    detalle: vi.fn<(id: string) => Promise<ViajeDetalle>>(),
    publicarBorrador: vi.fn<(id: string) => Promise<ViajeDetalle>>(),
    iniciar: vi.fn<(id: string) => Promise<ViajeDetalle>>(),
    finalizar: vi.fn<(id: string) => Promise<ViajeDetalle>>(),
  },
}))

const detalle = vi.mocked(viajesApi.detalle)
const iniciar = vi.mocked(viajesApi.iniciar)
const finalizar = vi.mocked(viajesApi.finalizar)

const Vacia = { template: '<div />' }

function viaje(p: Partial<ViajeDetalle> = {}): ViajeDetalle {
  return {
    id: 'v1',
    conductor: {
      id: 'c1',
      nombreCompleto: 'Dueño',
      carrera: 'ISC',
      fotoUrl: null,
      calificacion: 0,
      totalCalificaciones: 0,
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
    asientosDisponibles: 3,
    asientosOfrecidos: 3,
    notas: null,
    estado: 'Programado',
    esPropietario: true,
    miReserva: null,
    ...p,
  }
}

async function montar(query = '') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'inicio', component: Vacia },
      { path: '/viajes/:id', name: 'viaje', component: DetalleViajeView },
      { path: '/viajes/:id/editar', name: 'viaje-editar', component: Vacia },
      { path: '/viajes', name: 'buscar', component: Vacia },
    ],
  })
  await router.push(`/viajes/v1${query}`)
  await router.isReady()

  const wrapper = mount(DetalleViajeView, { global: { plugins: [router] } })
  await flushPromises()
  return { wrapper, router }
}

describe('DetalleViajeView (HU-09: entrada a edición)', () => {
  beforeEach(() => {
    detalle.mockReset()
  })

  it('el dueño ve EDITAR VIAJE en un viaje programado y lo lleva a la edición', async () => {
    detalle.mockResolvedValue(viaje())
    const { wrapper, router } = await montar()

    const boton = wrapper.findAll('button').find((b) => b.text() === 'EDITAR VIAJE')
    expect(boton).toBeTruthy()

    await boton!.trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('viaje-editar')
  })

  it('no muestra EDITAR VIAJE si el viaje ya no se puede modificar', async () => {
    detalle.mockResolvedValue(viaje({ estado: 'EnCurso' }))
    const { wrapper } = await montar()

    expect(wrapper.findAll('button').find((b) => b.text() === 'EDITAR VIAJE')).toBeUndefined()
  })

  it('no muestra EDITAR VIAJE a quien no es el dueño del viaje', async () => {
    detalle.mockResolvedValue(viaje({ esPropietario: false }))
    const { wrapper } = await montar()

    expect(wrapper.findAll('button').find((b) => b.text() === 'EDITAR VIAJE')).toBeUndefined()
  })

  it('avisa "Cambios guardados." al volver de editar con ?editado=1', async () => {
    detalle.mockResolvedValue(viaje())
    const { wrapper } = await montar('?editado=1')

    expect(wrapper.text()).toContain('Cambios guardados.')
  })
})

describe('DetalleViajeView (HU-11: iniciar y finalizar viaje)', () => {
  beforeEach(() => {
    detalle.mockReset()
    iniciar.mockReset()
    finalizar.mockReset()
  })

  it('el dueño ve Iniciar viaje en un viaje programado y lo pasa a En curso', async () => {
    detalle.mockResolvedValue(viaje({ estado: 'Programado' }))
    iniciar.mockResolvedValue(viaje({ estado: 'EnCurso' }))
    const { wrapper } = await montar()

    const boton = wrapper.findAll('button').find((b) => b.text() === 'Iniciar viaje')
    expect(boton).toBeTruthy()

    await boton!.trigger('click')
    await flushPromises()
    expect(iniciar).toHaveBeenCalledWith('v1')
    expect(wrapper.text()).toContain('En curso')
  })

  it('no muestra Iniciar viaje a quien no es el dueño', async () => {
    detalle.mockResolvedValue(viaje({ estado: 'Programado', esPropietario: false }))
    const { wrapper } = await montar()

    expect(wrapper.findAll('button').find((b) => b.text() === 'Iniciar viaje')).toBeUndefined()
  })

  it('el dueño ve Finalizar viaje en un viaje en curso y lo marca como completado', async () => {
    detalle.mockResolvedValue(viaje({ estado: 'EnCurso' }))
    finalizar.mockResolvedValue(viaje({ estado: 'Completado' }))
    const { wrapper } = await montar()

    const boton = wrapper.findAll('button').find((b) => b.text() === 'Finalizar viaje')
    expect(boton).toBeTruthy()

    await boton!.trigger('click')
    await flushPromises()
    expect(finalizar).toHaveBeenCalledWith('v1')
    expect(wrapper.text()).toContain('Completado')
  })

  it('no muestra Finalizar viaje en un viaje programado', async () => {
    detalle.mockResolvedValue(viaje({ estado: 'Programado' }))
    const { wrapper } = await montar()

    expect(wrapper.findAll('button').find((b) => b.text() === 'Finalizar viaje')).toBeUndefined()
  })
})
