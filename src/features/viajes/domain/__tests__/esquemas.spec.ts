import { describe, expect, it } from 'vitest'
import { aFechaInput, sumarDias } from '@/core/utils/fechas'
import { crearEditarEsquema, paso1Esquema, paso2Esquema } from '../esquemas'

const manana = aFechaInput(sumarDias(new Date(), 1))

const valido = {
  puntoEncuentroId: 1,
  destino: 'Centro de Tula',
  paradas: ['Plaza Galerías'],
  fecha: manana,
  hora: '14:30',
  asientos: 3,
}

function erroresDe(datos: unknown) {
  const r = paso1Esquema.safeParse(datos)
  return r.success ? [] : r.error.issues.map((i) => i.path.join('.'))
}

describe('paso1Esquema (HU-04)', () => {
  it('acepta una ruta válida', () => {
    expect(erroresDe(valido)).toEqual([])
  })

  it('rechaza una fecha pasada', () => {
    const ayer = aFechaInput(sumarDias(new Date(), -1))
    expect(erroresDe({ ...valido, fecha: ayer })).toContain('hora')
  })

  it('rechaza una salida a más de 30 días', () => {
    const lejos = aFechaInput(sumarDias(new Date(), 31))
    expect(erroresDe({ ...valido, fecha: lejos })).toContain('hora')
  })

  it('rechaza más de 5 paradas', () => {
    expect(erroresDe({ ...valido, paradas: ['a', 'b', 'c', 'd', 'e', 'f'] })).toContain('paradas')
  })

  it('rechaza 0 asientos', () => {
    expect(erroresDe({ ...valido, asientos: 0 })).toContain('asientos')
  })

  it('exige punto de encuentro del catálogo', () => {
    expect(erroresDe({ ...valido, puntoEncuentroId: '' })).toContain('puntoEncuentroId')
  })
})

describe('paso2Esquema (HU-05)', () => {
  const base = { notas: '', vehiculoId: '' }

  it('acepta un gasto con hasta 2 decimales', () => {
    expect(paso2Esquema.safeParse({ ...base, gastoTotal: '160.50' }).success).toBe(true)
  })

  it('rechaza gasto 0, mayor a $5,000 o con 3 decimales', () => {
    for (const gastoTotal of ['0', '', 5000.01, '10.555']) {
      expect(paso2Esquema.safeParse({ ...base, gastoTotal }).success).toBe(false)
    }
  })

  it('rechaza notas de más de 500 caracteres', () => {
    expect(
      paso2Esquema.safeParse({ ...base, gastoTotal: 100, notas: 'x'.repeat(501) }).success,
    ).toBe(false)
  })
})

describe('crearEditarEsquema (HU-09)', () => {
  const datos = { ...valido, gastoTotal: 160, notas: '', vehiculoId: '' }

  it('acepta los datos de ruta y gastos combinados', () => {
    const esquema = crearEditarEsquema(() => 0)
    expect(esquema.safeParse(datos).success).toBe(true)
  })

  it('rechaza ofrecer menos asientos que los ya reservados', () => {
    const esquema = crearEditarEsquema(() => 3)
    const r = esquema.safeParse({ ...datos, asientos: 2 })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.issues.map((i) => i.path.join('.'))).toContain('asientos')
  })

  it('acepta ofrecer exactamente los asientos ya reservados', () => {
    const esquema = crearEditarEsquema(() => 3)
    expect(esquema.safeParse({ ...datos, asientos: 3 }).success).toBe(true)
  })
})
