import { afterEach, describe, expect, it, vi } from 'vitest'
import { instalarApiFalsa, pendientes } from '@/__tests__/apoyo/montaje'
import { usePerfil } from '../usePerfil'

describe('usePerfil', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('al calificar solo quita de pendientes al compañero evaluado', async () => {
    const dos = [
      { ...pendientes[0]!, viajeId: 'v1', evaluadoId: 'p1' },
      { ...pendientes[0]!, viajeId: 'v1', evaluadoId: 'p2' },
    ]
    instalarApiFalsa([
      ['/calificaciones/pendientes', dos],
      ['/calificaciones', null],
    ])
    const { cargarPendientes, pendientesDe, calificar } = usePerfil()
    await cargarPendientes()
    expect(pendientesDe('v1')).toHaveLength(2)

    await calificar({ viajeId: 'v1', evaluadoId: 'p1', estrellas: 5 })

    expect(pendientesDe('v1').map((p) => p.evaluadoId)).toEqual(['p2'])
    expect(pendientesDe('otro')).toEqual([])
  })
})
