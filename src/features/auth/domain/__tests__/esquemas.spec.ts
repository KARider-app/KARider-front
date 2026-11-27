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

  it('acepta nombres de cualquier longitud hasta 60 letras (HU-16)', () => {
    expect(erroresDe({ ...pasajero, nombreCompleto: 'Ana López' })).toEqual([])
    expect(
      erroresDe({
        ...pasajero,
        nombreCompleto: 'Ana Sofía Ximena Guadalupe Hernández Gutiérrez de la Fuentes',
      }),
    ).toEqual([])
  })

  it('rechaza un nombre de más de 60 letras, vacío o con números/símbolos (HU-16)', () => {
    const largo = registroEsquema.safeParse({
      ...pasajero,
      nombreCompleto: 'Ana Sofía Ximena Guadalupe Hernández Gutiérrez de la Fuente Ruiz',
    })
    expect(largo.success).toBe(false)
    expect(largo.error?.issues[0]?.message).toBe('Máximo 60 letras')
    expect(erroresDe({ ...pasajero, nombreCompleto: '' })).toContain('nombreCompleto')
    expect(
      erroresDe({ ...pasajero, nombreCompleto: 'Kazumi Alejandra Barrera Avila #2026' }),
    ).toContain('nombreCompleto')
  })

  it('limita la contraseña a 30 caracteres (HU-16)', () => {
    const treinta = 'Segura#2026Segura#2026Segura#2'
    expect(treinta).toHaveLength(30)
    expect(erroresDe({ ...pasajero, password: treinta, confirmarPassword: treinta })).toEqual([])
    const larga = treinta + 'X'
    expect(erroresDe({ ...pasajero, password: larga, confirmarPassword: larga })).toContain(
      'password',
    )
  })

  it('acepta solo letras en el color, máximo 15 (HU-16)', () => {
    const conColor = (color: string) =>
      erroresDe({ ...pasajero, rol: 'Conductor', vehiculo: { ...vehiculo, color } })
    expect(conColor('Gris Oxford')).toEqual([])
    expect(conColor('Rojo Cereza Mat')).toEqual([])
    expect(conColor('Rojo Cereza Mate')).toContain('vehiculo.color')
    expect(conColor('Azul 2')).toContain('vehiculo.color')
    expect(conColor('Gris-Plata')).toContain('vehiculo.color')
  })

  it('exige un año de exactamente 4 números (HU-16)', () => {
    const conAnio = (anio: unknown) =>
      erroresDe({ ...pasajero, rol: 'Conductor', vehiculo: { ...vehiculo, anio } })
    expect(conAnio('2019')).toEqual([])
    expect(conAnio(2019)).toEqual([])
    expect(conAnio('201')).toContain('vehiculo.anio')
    expect(conAnio('20190')).toContain('vehiculo.anio')
    expect(conAnio('20a9')).toContain('vehiculo.anio')
    expect(conAnio('1985')).toContain('vehiculo.anio')
    expect(conAnio('')).toContain('vehiculo.anio')
  })

  it('entrega el año como número a la API', () => {
    const r = registroEsquema.safeParse({
      ...pasajero,
      rol: 'Conductor',
      vehiculo: { ...vehiculo, anio: '2019' },
    })
    expect(r.success && r.data.vehiculo?.anio).toBe(2019)
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
