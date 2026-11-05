import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { usePublicarViajeStore } from '../../../application/usePublicarViajeStore'
import PublicarRutaPaso2View from '../PublicarRutaPaso2View.vue'

const Vacia = { template: '<div />' }

describe('PublicarRutaPaso2View: selección accesible del vehículo', () => {
  beforeEach(() => {
    sessionStorage.clear()
    setActivePinia(createPinia())
  })

  it('cada opción de vehículo tiene un nombre accesible con modelo, placas y verificación', async () => {
    const store = usePublicarViajeStore()
    store.vehiculos = [
      {
        id: 'v1',
        modelo: 'Nissan Versa',
        color: 'Azul',
        anio: 2022,
        placas: 'HNX-421-C',
        capacidad: 4,
        verificado: true,
      },
      {
        id: 'v2',
        modelo: 'Chevrolet Aveo',
        color: 'Gris',
        anio: 2019,
        placas: 'HKL-100-A',
        capacidad: 4,
        verificado: false,
      },
    ]
    store.vehiculosCargados = true

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: 'inicio', component: Vacia },
        { path: '/publicar', name: 'publicar-1', component: Vacia },
        { path: '/publicar/paso-2', name: 'publicar-2', component: PublicarRutaPaso2View },
        { path: '/viajes/:id', name: 'viaje', component: Vacia },
        { path: '/borradores', name: 'borradores', component: Vacia },
      ],
    })
    await router.push('/publicar/paso-2')
    await router.isReady()

    const wrapper = mount(PublicarRutaPaso2View, { global: { plugins: [router] } })

    const opciones = wrapper.findAll('label.vehiculos__opcion')
    expect(opciones).toHaveLength(2)
    expect(opciones[0]!.get('span.sr-only').text()).toContain('Nissan Versa Azul, placas HNX-421-C')
    expect(opciones[0]!.get('span.sr-only').text()).toContain('verificado')
    expect(opciones[1]!.get('span.sr-only').text()).toContain('sin verificar')
    expect(opciones[0]!.get('.vehiculos__tarjeta').attributes('aria-hidden')).toBe('true')
  })
})
