import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import {
  errorApi,
  instalarApiFalsa,
  montar,
  pagina,
  punto,
  vehiculo,
  viajeResumen,
} from '@/__tests__/apoyo/montaje'
import BuscarViajesView from '../BuscarViajesView.vue'
import MisBorradoresView from '../MisBorradoresView.vue'
import PublicarRutaPaso1View from '../PublicarRutaPaso1View.vue'

const punto2 = { ...punto, id: 2, nombre: 'Edificio B (IDGS)' }

afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

describe('BuscarViajesView (HU-06)', () => {
  const abrir = (rol: 'Pasajero' | 'Conductor' = 'Pasajero') =>
    montar(BuscarViajesView, { ruta: '/viajes', nombre: 'buscar', rol })

  it('lista los viajes con su conductor, horario, ruta y cupos', async () => {
    instalarApiFalsa([
      ['/catalogos/puntos-encuentro', [punto, punto2]],
      [
        '/viajes',
        pagina([
          viajeResumen('v1'),
          viajeResumen('v2', {
            paradas: [],
            conductor: {
              id: 'c2',
              nombreCompleto: 'Rodrigo Salinas',
              carrera: 'Docente IDGS',
              fotoUrl: 'https://example.com/r.png',
              calificacion: 0,
              totalCalificaciones: 0,
            },
          }),
        ]),
      ],
    ])
    const { wrapper } = await abrir()
    const texto = wrapper.text()
    expect(texto).toContain('2 disponibles')
    expect(texto).toContain('Valeria Gómez Ramírez')
    expect(texto).toContain('★ 4.8')
    expect(texto).toContain('Sin calificaciones')
    expect(texto).toContain('Destino: Pachuca de Soto (Plaza Galerías)')
    expect(texto).toContain('Paradas:')
    expect(texto).toContain('2 de 3 cupos libres')
    expect(texto).toContain('Edificio B (IDGS)')
    expect(wrapper.find('img[alt="Rodrigo Salinas"]').exists()).toBe(true)
  })

  it('vuelve a buscar al cambiar orden, punto de encuentro o destino', async () => {
    const buscar = vi.fn<() => unknown>(() => pagina([viajeResumen()]))
    instalarApiFalsa([
      ['/catalogos/puntos-encuentro', [punto, punto2]],
      ['/viajes', buscar],
    ])
    const { wrapper } = await abrir()
    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Menor Aporte')!
      .trigger('click')
    await flushPromises()
    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Edificio B (IDGS)')!
      .trigger('click')
    await flushPromises()
    await wrapper.get('#buscar-destino').setValue('Tula')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    await wrapper.get('button[aria-label="Limpiar búsqueda"]').trigger('click')
    await flushPromises()
    expect(buscar.mock.calls.length).toBeGreaterThanOrEqual(5)
  })

  it('el conductor sin resultados puede publicar la ruta', async () => {
    instalarApiFalsa([
      ['/catalogos/puntos-encuentro', []],
      ['/viajes', pagina([])],
    ])
    const { wrapper, router } = await abrir('Conductor')
    expect(wrapper.text()).toContain('No se encontraron viajes')
    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Publicar Ruta')!
      .trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('publicar-1')
  })

  it('el pasajero sin resultados ve la sugerencia de cuenta de conductor', async () => {
    instalarApiFalsa([
      ['/catalogos/puntos-encuentro', []],
      ['/viajes', pagina([])],
    ])
    const { wrapper } = await abrir()
    await wrapper.get('#buscar-destino').setValue('Tepeji')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(wrapper.text()).toContain('hacia "Tepeji"')
    expect(wrapper.text()).toContain('Con una cuenta de conductor')
  })

  it('carga más viajes cuando hay otra página', async () => {
    const primera = { ...pagina([viajeResumen('v1')]), tieneSiguiente: true, total: 2 }
    const buscar = vi.fn<(url: string) => unknown>(() => primera)
    instalarApiFalsa([
      ['/catalogos/puntos-encuentro', []],
      ['/viajes', buscar],
    ])
    const { wrapper } = await abrir()
    buscar.mockImplementation(() => ({ ...pagina([viajeResumen('v2')]), total: 2 }))
    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Ver más viajes')!
      .trigger('click')
    await flushPromises()
    expect(wrapper.findAll('li')).toHaveLength(2)
  })

  it('muestra el error de búsqueda', async () => {
    instalarApiFalsa([
      ['/catalogos/puntos-encuentro', []],
      ['/viajes', errorApi(500, 'ERROR_SERVIDOR')],
    ])
    const { wrapper } = await abrir()
    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
  })
})

describe('MisBorradoresView', () => {
  const abrir = (ruta = '/publicar/borradores') =>
    montar(MisBorradoresView, { ruta, nombre: 'borradores', rol: 'Conductor' })

  it('lista los borradores y confirma el guardado', async () => {
    instalarApiFalsa([['/viajes/publicados', pagina([viajeResumen('b1', { estado: 'Borrador' })])]])
    const { wrapper } = await abrir('/publicar/borradores?guardado=1')
    const texto = wrapper.text()
    expect(texto).toContain('Tu viaje se guardó como borrador.')
    expect(texto).toContain('Pachuca de Soto (Plaza Galerías)')
    expect(texto).toContain('3 asientos ofrecidos')
    expect(wrapper.find('a[href="/viajes/b1"]').exists()).toBe(true)
  })

  it('muestra el estado vacío y el error', async () => {
    instalarApiFalsa([['/viajes/publicados', pagina([])]])
    const vacio = await abrir()
    expect(vacio.wrapper.text()).toContain('No tienes borradores guardados')
    vi.restoreAllMocks()

    instalarApiFalsa([['/viajes/publicados', errorApi(500, 'ERROR_SERVIDOR')]])
    const conError = await abrir()
    expect(conError.wrapper.find('[role="alert"]').exists()).toBe(true)
  })
})

describe('PublicarRutaPaso1View (HU-04)', () => {
  const abrir = () =>
    montar(PublicarRutaPaso1View, { ruta: '/publicar', nombre: 'publicar-1', rol: 'Conductor' })

  it('muestra las secciones del formulario y la descripción del punto elegido', async () => {
    instalarApiFalsa([
      ['/catalogos/puntos-encuentro', [punto, punto2]],
      ['/vehiculos', [vehiculo]],
    ])
    const { wrapper } = await abrir()
    expect(wrapper.text()).toContain('1. Puntos de la Ruta')
    expect(wrapper.text()).toContain('2. Horario y Capacidad')
    await wrapper.get('select').setValue('1')
    await flushPromises()
    expect(wrapper.text()).toContain('Junto a la caseta de vigilancia principal.')
  })

  it('valida antes de continuar', async () => {
    instalarApiFalsa([
      ['/catalogos/puntos-encuentro', [punto]],
      ['/vehiculos', [vehiculo]],
    ])
    const { wrapper, router } = await abrir()
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('publicar-1')
    expect(wrapper.findAll('[role="alert"]').length).toBeGreaterThan(0)
  })

  it('avisa si el conductor no tiene vehículo o si fallan los catálogos', async () => {
    instalarApiFalsa([
      ['/catalogos/puntos-encuentro', errorApi(500, 'ERROR_SERVIDOR')],
      ['/vehiculos', []],
    ])
    const { wrapper } = await abrir()
    expect(wrapper.text()).toContain('Aún no tienes un vehículo registrado')
    expect(wrapper.text()).toContain('No pudimos cargar los puntos de encuentro.')
  })
})
