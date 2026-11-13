import { describe, expect, it } from 'vitest'
import { registroEsquema } from '../esquemas'

const pasajero = {
  rol: 'Pasajero',
  nombreCompleto: 'Kazumi Alejandra Barrera Avila Hernández',
  matricula: '20231234',
  telefono: '7731234567',
  carreraId: 1,
  correoInstitucional: '20231234@uttt.edu.mx',
  password: 'Segura#2026',
  confirmarPassword: 'Segura#2026',
}

const vehiculo = {
  modelo: 'Nissan Versa',
  color: 'Gris',
  anio: 2019,
  placas: 'HNX421BCD',
  capacidad: 4,
}

function erroresDe(datos: unknown) {
  const r = registroEsquema.safeParse(datos)
  return r.success ? [] : r.error.issues.map((i) => i.path.join('.'))
}

describe('registroEsquema (HU-01 / HU-02)', () => {
  it('acepta un pasajero válido y un conductor con vehículo', () => {
    expect(erroresDe(pasajero)).toEqual([])
    expect(erroresDe({ ...pasajero, rol: 'Conductor', vehiculo })).toEqual([])
  })

  it('rechaza correos que no son @uttt.edu.mx', () => {
    expect(erroresDe({ ...pasajero, correoInstitucional: 'kazumi@gmail.com' })).toContain(
      'correoInstitucional',
    )
  })

  it('rechaza una contraseña débil', () => {
    const debil = 'abcdefgh'
    expect(erroresDe({ ...pasajero, password: debil, confirmarPassword: debil })).toContain(
      'password',
    )
  })

  it('rechaza una confirmación distinta', () => {
    expect(erroresDe({ ...pasajero, confirmarPassword: 'Otra#2026' })).toContain(
      'confirmarPassword',
    )
  })

  it('rechaza un conductor sin vehículo', () => {
    expect(erroresDe({ ...pasajero, rol: 'Conductor' })).toContain('vehiculo')
  })

  it('valida los datos anidados del vehículo con llaves con punto', () => {
    expect(
      erroresDe({
        ...pasajero,
        rol: 'Conductor',
        vehiculo: { ...vehiculo, placas: 'X', capacidad: 5 },
      }),
    ).toEqual(expect.arrayContaining(['vehiculo.placas', 'vehiculo.capacidad']))
  })

  it('trata el cuatrimestre vacío como opcional', () => {
    expect(erroresDe({ ...pasajero, cuatrimestre: '' })).toEqual([])
    expect(erroresDe({ ...pasajero, cuatrimestre: 12 })).toContain('cuatrimestre')
  })

  it('rechaza un nombre completo que no sea exactamente 40 letras, o con números/símbolos', () => {
    expect(erroresDe({ ...pasajero, nombreCompleto: 'Ana López' })).toContain('nombreCompleto')
    expect(
      erroresDe({ ...pasajero, nombreCompleto: 'Kazumi Alejandra Barrera Avila Hernández Gómez' }),
    ).toContain('nombreCompleto')
    expect(
      erroresDe({ ...pasajero, nombreCompleto: 'Kazumi Alejandra Barrera Avila #2026' }),
    ).toContain('nombreCompleto')
  })

  it('rechaza una matrícula que no sean exactamente 8 dígitos', () => {
    expect(erroresDe({ ...pasajero, matricula: '2023123' })).toContain('matricula')
    expect(erroresDe({ ...pasajero, matricula: '202312345' })).toContain('matricula')
    expect(erroresDe({ ...pasajero, matricula: '2023123A' })).toContain('matricula')
  })

  it('rechaza un teléfono que no sean exactamente 10 dígitos sin letras', () => {
    expect(erroresDe({ ...pasajero, telefono: '773123456' })).toContain('telefono')
    expect(erroresDe({ ...pasajero, telefono: '773 123 4567' })).toContain('telefono')
    expect(erroresDe({ ...pasajero, telefono: '773123A567' })).toContain('telefono')
  })

  it('rechaza un modelo de vehículo con números o más de 20 caracteres', () => {
    expect(
      erroresDe({
        ...pasajero,
        rol: 'Conductor',
        vehiculo: { ...vehiculo, modelo: 'Nissan Versa 2024' },
      }),
    ).toContain('vehiculo.modelo')
    expect(
      erroresDe({
        ...pasajero,
        rol: 'Conductor',
        vehiculo: { ...vehiculo, modelo: 'Un Modelo Demasiado Largo' },
      }),
    ).toContain('vehiculo.modelo')
  })

  it('rechaza placas que no sean exactamente 9 caracteres alfanuméricos', () => {
    expect(
      erroresDe({ ...pasajero, rol: 'Conductor', vehiculo: { ...vehiculo, placas: 'HNX-421-C' } }),
    ).toContain('vehiculo.placas')
    expect(
      erroresDe({ ...pasajero, rol: 'Conductor', vehiculo: { ...vehiculo, placas: 'HNX421BC' } }),
    ).toContain('vehiculo.placas')
  })
})
