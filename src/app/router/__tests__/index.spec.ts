import { describe, expect, it } from 'vitest'
import router from '../index'

describe('router (HU-09: ruta de editar viaje)', () => {
  it('resuelve /viajes/:id/editar al componente de edición, sin que la caiga el comodín', () => {
    const resuelta = router.resolve('/viajes/v1/editar')

    expect(resuelta.name).toBe('viaje-editar')
    expect(resuelta.params.id).toBe('v1')
    expect(resuelta.meta).toMatchObject({ requiereSesion: true, soloConductor: true })
  })

  it('no interfiere con la ruta de detalle del viaje', () => {
    expect(router.resolve('/viajes/v1').name).toBe('viaje')
  })
})
