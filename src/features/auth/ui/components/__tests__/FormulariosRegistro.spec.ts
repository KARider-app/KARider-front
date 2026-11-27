import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import FormDatosPersonales, { type DatosPersonales } from '../FormDatosPersonales.vue'
import FormVehiculo, { type DatosVehiculo } from '../FormVehiculo.vue'

const datos = (): DatosPersonales => ({
  nombreCompleto: '',
  matricula: '',
  telefono: '',
  carreraId: '',
  cuatrimestre: '',
  correoInstitucional: '',
  password: '',
  confirmarPassword: '',
})

function montarDatos(errores: Record<string, string> = {}) {
  return mount(FormDatosPersonales, {
    props: { modelValue: datos(), errores, carreras: [], dominio: 'uttt.edu.mx' },
  })
}

const validados = (w: ReturnType<typeof montarDatos>) =>
  (w.emitted('validar') ?? []).map(([campo]) => campo)

describe('FormDatosPersonales (HU-16)', () => {
  it('avisa al momento cuando el nombre rebasa 60 letras', async () => {
    const w = montarDatos()
    const nombre = w.get('input[autocomplete="name"]')
    expect(nombre.attributes('maxlength')).toBe('70')

    await nombre.setValue('Ana López')
    expect(validados(w)).toEqual([])

    await nombre.setValue('A'.repeat(61))
    expect(validados(w)).toEqual(['nombreCompleto'])
  })

  it('al corregir un nombre con error lo vuelve a validar mientras se escribe', async () => {
    const w = montarDatos({ nombreCompleto: 'Máximo 60 letras' })
    await w.get('input[autocomplete="name"]').setValue('Ana López')
    expect(validados(w)).toEqual(['nombreCompleto'])
  })

  it('avisa al momento cuando la contraseña rebasa 30 caracteres', async () => {
    const w = montarDatos()
    const password = w.findAll('input[type="password"]')[0]!
    expect(password.attributes('maxlength')).toBe('40')
    expect(w.text()).toContain('De 8 a 30 caracteres')

    await password.setValue('Segura#2026')
    expect(validados(w)).toEqual([])

    await password.setValue('Segura#2026'.repeat(3))
    expect(validados(w)).toEqual(['password'])
  })
})

describe('FormVehiculo (HU-16)', () => {
  const vehiculo = (): DatosVehiculo => ({
    modelo: '',
    color: '',
    anio: '',
    placas: '',
    capacidad: '',
  })

  it('el color solo acepta letras y el año solo 4 números', async () => {
    const w = mount(FormVehiculo, { props: { modelValue: vehiculo(), errores: {} } })
    const inputs = w.findAll('input')
    const color = inputs[2]!
    const anio = inputs[3]!

    expect(color.attributes('maxlength')).toBe('15')
    await color.setValue('Azul 2!')
    expect((color.element as HTMLInputElement).value).toBe('Azul ')

    expect(anio.attributes('type')).toBe('text')
    expect(anio.attributes('maxlength')).toBe('4')
    await anio.setValue('20a9')
    expect((anio.element as HTMLInputElement).value).toBe('209')
    expect(w.text()).toContain('4 números')
  })

  it('valida cada campo del vehículo al salir de él', async () => {
    const w = mount(FormVehiculo, { props: { modelValue: vehiculo(), errores: {} } })
    for (const input of w.findAll('input')) await input.trigger('blur')

    expect((w.emitted('validar') ?? []).map(([c]) => c)).toEqual([
      'vehiculo.modelo',
      'vehiculo.placas',
      'vehiculo.color',
      'vehiculo.anio',
    ])
  })

  it('muestra el error general del vehículo', () => {
    const w = mount(FormVehiculo, {
      props: { modelValue: vehiculo(), errores: { vehiculo: 'Captura los datos de tu vehículo' } },
    })
    expect(w.text()).toContain('Captura los datos de tu vehículo')
  })
})
