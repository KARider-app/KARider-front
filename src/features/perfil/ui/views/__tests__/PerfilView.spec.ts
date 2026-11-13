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
  vehiculo,
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

  it('muestra el estado vacío del historial', async () => {
    instalarApiFalsa(base([['/perfil/historial', pagina([])]]))
    const { wrapper } = await abrir()
    expect(wrapper.text()).toContain('No hay viajes en esta categoría todavía.')
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

  describe('HU-12 · Credenciales UTTT', () => {
    async function abrirCredenciales(extra: MapaApi) {
      instalarApiFalsa(base(extra))
      const { wrapper } = await abrir()
      await pestana(wrapper, 'Credenciales UTTT')
      return wrapper
    }

    it('criterio 1: el pasajero solo ve su ficha institucional, sin bloque de vehículo', async () => {
      // Aunque llegara un vehículo, la regla 1 dice que solo se muestra a conductores.
      const wrapper = await abrirCredenciales([
        ['/perfil', perfil('Pasajero')],
        ['/perfil/credenciales', credenciales(true)],
      ])
      const texto = wrapper.text()
      expect(texto).toContain('carlos.mendoza@uttt.edu.mx')
      expect(texto).toContain('22300630')
      expect(texto).toContain('Ing. en Desarrollo y Gestión de Software')
      expect(texto).toContain('Alumno Regular Activo')
      expect(texto).not.toContain('Vehículo para Carpooling')
      expect(texto).not.toContain('Aún no tienes un vehículo registrado')
    })

    it('criterio 2: el conductor ve el vehículo con la insignia Verificado', async () => {
      const wrapper = await abrirCredenciales([])
      const texto = wrapper.text()
      expect(texto).toContain('Vehículo para Carpooling')
      expect(texto).toContain('Nissan Versa Sense (Azul Acero)')
      expect(texto).toContain('4 Pasajeros + Conductor')
      expect(texto).toContain('Verificado')
      expect(texto).not.toContain('Pendiente')
    })

    it('criterio 3: un vehículo pendiente muestra «Pendiente» sin ocultar sus datos', async () => {
      const wrapper = await abrirCredenciales([
        [
          '/perfil/credenciales',
          { ...credenciales(), vehiculos: [{ ...vehiculo, verificado: false }] },
        ],
      ])
      const bloque = wrapper.findAll('section').find((s) => s.text().includes('Vehículo'))!
      expect(bloque.text()).toContain('Pendiente')
      expect(bloque.text()).not.toContain('Verificado')
      expect(bloque.text()).toContain('HNX-421-C')
      expect(bloque.text()).toContain('2022')
    })

    it('avisa al conductor que aún no registra vehículo', async () => {
      const wrapper = await abrirCredenciales([['/perfil/credenciales', credenciales(false)]])
      expect(wrapper.text()).toContain('Aún no tienes un vehículo registrado para carpooling.')
    })

    it('regla 2: el estatus refleja un correo aún no verificado', async () => {
      const wrapper = await abrirCredenciales([
        [
          '/perfil/credenciales',
          {
            ...credenciales(),
            estatus: 'Pendiente de verificación',
            correoVerificado: false,
          },
        ],
      ])
      const ficha = wrapper.findAll('section').find((s) => s.text().includes('Ficha'))!
      expect(ficha.text()).toContain('Pendiente de verificación')
      expect(ficha.text()).not.toContain('✓ Verificado')
    })
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
