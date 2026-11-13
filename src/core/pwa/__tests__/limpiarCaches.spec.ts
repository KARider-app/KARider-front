import { describe, expect, it, vi } from 'vitest'
import { CACHES_OBSOLETAS, limpiarCachesObsoletas } from '../limpiarCaches'

describe('limpiarCachesObsoletas', () => {
  it('borra la caché vieja del mapa con mosaicos bloqueados', async () => {
    const borrar = vi.fn<(nombre: string) => Promise<boolean>>(() => Promise.resolve(true))
    await limpiarCachesObsoletas({ delete: borrar } as unknown as CacheStorage)
    expect(CACHES_OBSOLETAS).toContain('mapa-osm')
    expect(borrar).toHaveBeenCalledWith('mapa-osm')
  })

  it('no falla si el navegador no tiene Cache Storage o si borrar falla', async () => {
    await expect(limpiarCachesObsoletas(undefined)).resolves.toBeUndefined()
    const falla = { delete: () => Promise.reject(new Error('sin permiso')) }
    await expect(limpiarCachesObsoletas(falla as unknown as CacheStorage)).resolves.toBeUndefined()
  })
})
