import { afterEach, describe, expect, it, vi } from 'vitest'
import { errorApi, pagina, viajeResumen } from '@/__tests__/apoyo/montaje'
import { viajesApi } from '../../api/viajesApi'
import type { ViajeResumen } from '../../domain/tipos'
import { useBuscarViajes } from '../useBuscarViajes'

const filtros = { orden: 'Horario' as const }
const viajes = (...ids: string[]) => ids.map((id) => viajeResumen(id) as unknown as ViajeResumen)
const respuesta = (items: ViajeResumen[], p: Partial<ReturnType<typeof pagina>> = {}) =>
  ({ ...pagina(items), ...p }) as Awaited<ReturnType<typeof viajesApi.buscar>>

describe('useBuscarViajes · actualización automática (HU-18)', () => {
  afterEach(() => vi.restoreAllMocks())

  it('agrega los viajes recién publicados sin indicador de carga y los cuenta como nuevos', async () => {
    const buscar = vi.spyOn(viajesApi, 'buscar').mockResolvedValue(respuesta(viajes('v1')))
    const b = useBuscarViajes()
    await b.buscar(filtros)

    buscar.mockResolvedValue(respuesta(viajes('v2', 'v1')))
    const pendiente = b.actualizar(filtros)
    expect(b.cargando.value).toBe(false)
    await pendiente

    expect(b.viajes.value.map((v) => v.id)).toEqual(['v2', 'v1'])
    expect(b.total.value).toBe(2)
    expect(b.nuevos.value).toBe(1)
  })

  it('una nueva búsqueda reinicia el aviso de viajes nuevos', async () => {
    const buscar = vi.spyOn(viajesApi, 'buscar').mockResolvedValue(respuesta(viajes('v1')))
    const b = useBuscarViajes()
    await b.buscar(filtros)
    buscar.mockResolvedValue(respuesta(viajes('v2', 'v1')))
    await b.actualizar(filtros)

    await b.buscar(filtros)

    expect(b.nuevos.value).toBe(0)
  })

  it('conserva las páginas que ya se cargaron, sin repetir viajes', async () => {
    const primera = viajes(...Array.from({ length: 20 }, (_, i) => `a${i}`))
    const buscar = vi
      .spyOn(viajesApi, 'buscar')
      .mockResolvedValue(respuesta(primera, { tieneSiguiente: true, total: 22 }))
    const b = useBuscarViajes()
    await b.buscar(filtros)
    buscar.mockResolvedValue(respuesta(viajes('b1', 'b2'), { pagina: 2, total: 22 }))
    await b.cargarMas(filtros)
    expect(b.viajes.value).toHaveLength(22)

    // Se publicó «n1»: la primera página ahora empieza con él y «a19» bajó a la segunda.
    const nuevaPrimera = [...viajes('n1'), ...primera.slice(0, 19)]
    buscar.mockResolvedValue(respuesta(nuevaPrimera, { tieneSiguiente: true, total: 23 }))
    await b.actualizar(filtros)

    const ids = b.viajes.value.map((v) => v.id)
    expect(ids[0]).toBe('n1')
    expect(ids).toContain('b1')
    expect(new Set(ids).size).toBe(ids.length)
    expect(b.total.value).toBe(23)
  })

  it('si falla (p. ej. sin conexión) conserva la lista sin mostrar error', async () => {
    const buscar = vi.spyOn(viajesApi, 'buscar').mockResolvedValue(respuesta(viajes('v1')))
    const b = useBuscarViajes()
    await b.buscar(filtros)

    buscar.mockRejectedValue(errorApi(0, 'SIN_CONEXION'))
    await b.actualizar(filtros)

    expect(b.viajes.value.map((v) => v.id)).toEqual(['v1'])
    expect(b.error.value).toBeNull()
  })

  it('si la primera búsqueda falló, la actualización vuelve a buscar y quita el error', async () => {
    const buscar = vi.spyOn(viajesApi, 'buscar').mockRejectedValue(errorApi(500, 'ERROR'))
    const b = useBuscarViajes()
    await b.buscar(filtros)
    expect(b.error.value).not.toBeNull()

    buscar.mockResolvedValue(respuesta(viajes('v1')))
    await b.actualizar(filtros)

    expect(b.error.value).toBeNull()
    expect(b.viajes.value).toHaveLength(1)
  })

  it('no actualiza mientras hay una búsqueda en curso', async () => {
    const buscar = vi.spyOn(viajesApi, 'buscar').mockResolvedValue(respuesta(viajes('v1')))
    const b = useBuscarViajes()
    const enCurso = b.buscar(filtros)

    await b.actualizar(filtros)
    await enCurso

    expect(buscar).toHaveBeenCalledTimes(1)
  })

  it('descarta la actualización si mientras tanto se hizo otra búsqueda', async () => {
    const buscar = vi.spyOn(viajesApi, 'buscar').mockResolvedValue(respuesta(viajes('v1')))
    const b = useBuscarViajes()
    await b.buscar(filtros)

    let responder: (v: Awaited<ReturnType<typeof viajesApi.buscar>>) => void = () => {}
    buscar.mockImplementationOnce(() => new Promise((r) => (responder = r)))
    const actualizacion = b.actualizar(filtros)
    buscar.mockResolvedValue(respuesta(viajes('x1')))
    await b.buscar({ ...filtros, destino: 'Tula' })
    responder(respuesta(viajes('viejo')))
    await actualizacion

    expect(b.viajes.value.map((v) => v.id)).toEqual(['x1'])
  })
})
