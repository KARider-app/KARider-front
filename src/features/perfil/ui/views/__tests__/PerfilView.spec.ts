import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import {
  credenciales,
  errorApi,
  historial,
  instalarApiFalsa,
  montar,
  pagina,
  pendientes,
  perfil,
  reputacion,
  type MapaApi,
} from '@/__tests__/apoyo/montaje'
import PerfilView from '../PerfilView.vue'

const base = (extra: MapaApi = []): MapaApi => [
  ...extra,
  ['/perfil', perfil('Conductor')],
  ['/perfil/historial', pagina(historial)],
  ['/perfil/calificaciones', reputacion],
  ['/perfil/credenciales', credenciales()],
  ['/calificaciones/pendientes', pendientes],
  ['/calificaciones', null],
]

const abrir = () => montar(PerfilView, { ruta: '/perfil', nombre: 'perfil', rol: 'Conductor' })

async function pestana(wrapper: Awaited<ReturnType<typeof abrir>>['wrapper'], texto: string) {
  await wrapper
    .findAll('button')
    .find((b) => b.text() === texto)!
    .trigger('click')
  await flushPromises()
}

describe('PerfilView (P13-P15)', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    document.body.innerHTML = ''
  })

  it('muestra los datos, estadísticas e historial del usuario', async () => {
    instalarApiFalsa(base())
    const { wrapper } = await abrir()
    const texto = wrapper.text()
    expect(texto).toContain('Carlos Mendoza López')
    expect(texto).toContain('Matrícula: 22300630')
    expect(texto).toContain('7° Cuatrimestre')
    expect(texto).toContain('Viajes Hechos')
    expect(texto).toContain('Registro Histórico de Viajes (2)')
    expect(texto).toContain('Como pasajero')
    expect(texto).toContain('Como conductor')
    expect(texto).toContain('Aporte de combustible liquidado')
  })

  it('filtra el historial por rol', async () => {
    const historialPorRol = vi.fn<() => unknown>(() => pagina([historial[1]]))
    instalarApiFalsa(base([['/perfil/historial', historialPorRol]]))
    const { wrapper } = await abrir()
    await pestana(wrapper, 'Conductor')
    expect(historialPorRol).toHaveBeenCalledTimes(2)
    expect(wrapper.text()).toContain('Registro Histórico de Viajes (1)')
  })

  it('HU-10 criterio 3: sin viajes muestra el estado vacío y las estadísticas en cero', async () => {
    const sinViajes = {
      ...perfil('Conductor'),
      estadisticas: {
        viajesRealizados: 0,
        viajesComoConductor: 0,
        viajesComoPasajero: 0,
        ahorroCombustible: 0,
        co2EvitadoKg: 0,
      },
    }
    instalarApiFalsa(
      base([
        ['/perfil', sinViajes],
        ['/perfil/historial', pagina([])],
      ]),
    )
    const { wrapper } = await abrir()
    const texto = wrapper.text()
    expect(texto).toContain('Aún no tienes viajes registrados')
    expect(texto).toContain('Registro Histórico de Viajes (0)')
    const estadisticas = wrapper.get('[aria-label="Estadísticas"]').text()
    expect(estadisticas).toContain('0Viajes Hechos')
    expect(estadisticas).toContain('$0')
    expect(estadisticas).toContain('0 kg')
  })

  it('HU-10 criterio 2: el vacío de un filtro concreto nombra el rol', async () => {
    instalarApiFalsa(base([['/perfil/historial', pagina([])]]))
    const { wrapper } = await abrir()
    await pestana(wrapper, 'Pasajero')
    expect(wrapper.text()).toContain('Aún no tienes viajes como pasajero')
  })

  it('HU-10 criterio 1: las tarjetas muestran rol, fecha, monto, origen, destino y compañeros', async () => {
    instalarApiFalsa(base())
    const { wrapper } = await abrir()
    const [pasajero, conductor] = wrapper.findAll('li')
    expect(pasajero!.text()).toContain('Como pasajero')
    expect(pasajero!.text()).toContain('$45 MXN')
    expect(pasajero!.text()).toContain('Campus UTTT (Puerta 1)')
    expect(pasajero!.text()).toContain('Pachuca de Soto (Galerías)')
    expect(pasajero!.text()).toContain('Con: Valeria Gómez R. (Nissan Versa Azul)')
    expect(conductor!.text()).toContain('Como conductor')
    expect(conductor!.text()).toContain('Con: Marco Morales S., Ana Ruiz T.')
  })

  it('HU-10 regla 1: etiqueta los viajes cancelados y en curso sin ocultarlos', async () => {
    instalarApiFalsa(
      base([
        [
          '/perfil/historial',
          pagina([
            {
              ...historial[0],
              viajeId: 'x1',
              estadoViaje: 'Cancelado',
              estadoReserva: 'Cancelada',
            },
            { ...historial[1], viajeId: 'x2', estadoViaje: 'EnCurso' },
            { ...historial[1], viajeId: 'x3', nombresPasajeros: null, pasajeros: 1 },
            { ...historial[1], viajeId: 'x4', nombresPasajeros: [], pasajeros: 0 },
          ]),
        ],
      ]),
    )
    const { wrapper } = await abrir()
    const tarjetas = wrapper.findAll('li')
    expect(tarjetas).toHaveLength(4)
    expect(tarjetas[0]!.text()).toContain('Cancelado')
    expect(tarjetas[0]!.classes()).toContain('opacity-75')
    expect(tarjetas[0]!.find('.line-through').exists()).toBe(true)
    expect(tarjetas[1]!.text()).toContain('En curso')
    expect(tarjetas[1]!.classes()).not.toContain('opacity-75')
    expect(tarjetas[2]!.text()).toContain('Con: 1 pasajero')
    expect(tarjetas[3]!.text()).toContain('Con: Sin pasajeros')
  })

  it('HU-10 criterio 4: el conductor puede evaluar a cada pasajero pendiente', async () => {
    const dos = [
      { ...pendientes[0], viajeId: 'h2', evaluadoId: 'p1', evaluadoNombre: 'Marco Morales S.' },
      { ...pendientes[0], viajeId: 'h2', evaluadoId: 'p2', evaluadoNombre: 'Ana Ruiz T.' },
    ]
    instalarApiFalsa(base([['/calificaciones/pendientes', dos]]))
    const { wrapper } = await abrir()
    const botones = wrapper.findAll('button').map((b) => b.text())
    expect(botones).toContain('Evaluar a Marco Morales S.')
    expect(botones).toContain('Evaluar a Ana Ruiz T.')
    expect(botones).not.toContain('Evaluar compañero')
  })

  it('muestra la reputación y las reseñas en «Calificación Mutua»', async () => {
    instalarApiFalsa(base())
    const { wrapper } = await abrir()
    await pestana(wrapper, 'Calificación Mutua')
    const texto = wrapper.text()
    expect(texto).toContain('Reputación Institucional UTTT')
    expect(texto).toContain('Basado en 24 evaluaciones mutuas verificadas')
    expect(texto).toContain('Puntual × 12')
    expect(texto).toContain('"Muy puntual."')
  })

  it('avisa cuando aún no hay reseñas', async () => {
    instalarApiFalsa(base([['/perfil/calificaciones', { ...reputacion, resenas: pagina([]) }]]))
    const { wrapper } = await abrir()
    await pestana(wrapper, 'Calificación Mutua')
    expect(wrapper.text()).toContain('Aún no tienes reseñas.')
  })

  it('muestra la ficha institucional y el vehículo en «Credenciales UTTT»', async () => {
    instalarApiFalsa(base())
    const { wrapper } = await abrir()
    await pestana(wrapper, 'Credenciales UTTT')
    const texto = wrapper.text()
    expect(texto).toContain('Ficha Institucional UTTT')
    expect(texto).toContain('Alumno Regular Activo')
    expect(texto).toContain('Vehículo para Carpooling')
    expect(texto).toContain('HNX-421-C')
    expect(texto).toContain('4 Pasajeros + Conductor')
  })

  it('muestra los errores de cada sección', async () => {
    instalarApiFalsa([
      ['/perfil', errorApi(500, 'ERROR_SERVIDOR')],
      ['/perfil/historial', errorApi(500, 'ERROR_SERVIDOR')],
      ['/calificaciones/pendientes', errorApi(500, 'ERROR_SERVIDOR')],
    ])
    const { wrapper } = await abrir()
    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
  })

  it('muestra el error de reputación y de credenciales', async () => {
    instalarApiFalsa(
      base([
        ['/perfil/calificaciones', errorApi(500, 'ERROR_SERVIDOR')],
        ['/perfil/credenciales', errorApi(500, 'ERROR_SERVIDOR')],
      ]),
    )
    const { wrapper } = await abrir()
    await pestana(wrapper, 'Calificación Mutua')
    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
    await pestana(wrapper, 'Credenciales UTTT')
    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
  })

  it('permite evaluar a un compañero desde el historial', async () => {
    const calificar = vi.fn<(url: string, cuerpo?: unknown) => null>(() => null)
    instalarApiFalsa(base([['/calificaciones', calificar]]))
    const { wrapper } = await abrir()

    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Evaluar compañero')!
      .trigger('click')
    await flushPromises()
    const dialogo = document.body.querySelector('[role="dialog"]') as HTMLFormElement
    expect(dialogo.textContent).toContain('Valeria Gómez R.')

    const estrellas = dialogo.querySelectorAll<HTMLButtonElement>('[role="radio"]')
    estrellas[3]!.click()
    const etiqueta = [...dialogo.querySelectorAll<HTMLButtonElement>('button')].find(
      (b) => b.textContent?.trim() === 'Puntual',
    )!
    etiqueta.click()
    etiqueta.click()
    etiqueta.click()
    const comentario = dialogo.querySelector('textarea')!
    comentario.value = 'Excelente'
    comentario.dispatchEvent(new Event('input'))
    await flushPromises()

    dialogo.dispatchEvent(new Event('submit'))
    await flushPromises()

    expect(calificar).toHaveBeenCalledWith(
      '/calificaciones',
      expect.objectContaining({
        viajeId: 'h1',
        evaluadoId: 'c1',
        estrellas: 4,
        etiquetas: ['Puntual'],
      }),
    )
  })

  it('muestra el error al calificar y permite cerrar el diálogo', async () => {
    instalarApiFalsa(base([['/calificaciones', errorApi(409, 'CALIFICACION_DUPLICADA')]]))
    const { wrapper } = await abrir()
    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Evaluar compañero')!
      .trigger('click')
    await flushPromises()
    const dialogo = document.body.querySelector('[role="dialog"]') as HTMLFormElement
    dialogo.querySelectorAll<HTMLButtonElement>('[role="radio"]')[4]!.click()
    await flushPromises()
    dialogo.dispatchEvent(new Event('submit'))
    await flushPromises()
    expect(dialogo.querySelector('[role="alert"]')).not.toBeNull()

    ;[...dialogo.querySelectorAll<HTMLButtonElement>('button')]
      .find((b) => b.textContent?.trim() === 'Cancelar')!
      .click()
    await flushPromises()
    expect(document.body.querySelector('[role="dialog"]')).toBeNull()
  })
})
