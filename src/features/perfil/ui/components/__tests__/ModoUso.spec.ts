import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, type VueWrapper } from '@vue/test-utils'
import { apiClient } from '@/core/http/apiClient'
import { ApiError } from '@/core/http/apiError'
import { errorApi, instalarApiFalsa, montar, vehiculo } from '@/__tests__/apoyo/montaje'
import { useAuthStore } from '@/features/auth/application/useAuthStore'
import ModoUso from '../ModoUso.vue'

const abrir = (rol: 'Pasajero' | 'Conductor') =>
  montar(ModoUso, { ruta: '/perfil', nombre: 'perfil', rol })

const boton = (wrapper: VueWrapper, texto: string) =>
  wrapper.findAll('button').find((b) => b.text() === texto)!

async function llenarVehiculo(wrapper: VueWrapper) {
  await boton(wrapper, 'Quiero ser conductor').trigger('click')
  const inputs = wrapper.findAll('input')
  await inputs[0]!.setValue('Nissan Versa')
  await inputs[1]!.setValue('HNX421BCD')
  await inputs[2]!.setValue('Gris')
  await inputs[3]!.setValue('2020')
  await wrapper.get('select').setValue('3')
}

async function enviar(wrapper: VueWrapper) {
  await wrapper.get('form').trigger('submit')
  await flushPromises()
}

describe('ModoUso (HU-17)', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    document.body.innerHTML = ''
  })

  it('un conductor cambia entre modo conductor y pasajero', async () => {
    const { wrapper } = await abrir('Conductor')
    expect(wrapper.text()).toContain('Ves «Publicar»')

    await wrapper.get('input[value="Pasajero"]').setValue(true)

    expect(useAuthStore().modoActivo).toBe('Pasajero')
    expect(wrapper.text()).toContain('Ves tus reservas como pasajero')
  })

  it('un pasajero registra su vehículo y queda como conductor', async () => {
    instalarApiFalsa([['/vehiculos', vehiculo]])
    const { wrapper } = await abrir('Pasajero')
    expect(wrapper.text()).toContain('Usas KARider como pasajero')

    await llenarVehiculo(wrapper)
    await enviar(wrapper)

    expect(apiClient.post).toHaveBeenCalledWith(
      '/vehiculos',
      expect.objectContaining({ modelo: 'Nissan Versa', placas: 'HNX421BCD', capacidad: 3 }),
    )
    const auth = useAuthStore()
    expect(auth.esConductor).toBe(true)
    expect(auth.modoConductor).toBe(true)
    expect(wrapper.text()).toContain('¡Listo! Ya puedes publicar rutas.')
    expect(wrapper.emitted('ahora-conductor')).toHaveLength(1)
  })

  it('no envía el vehículo si faltan datos', async () => {
    instalarApiFalsa([])
    const { wrapper } = await abrir('Pasajero')
    await boton(wrapper, 'Quiero ser conductor').trigger('click')

    await enviar(wrapper)

    expect(apiClient.post).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Captura el modelo')
  })

  it('muestra las placas duplicadas debajo del campo', async () => {
    instalarApiFalsa([
      [
        '/vehiculos',
        new ApiError(409, 'VEHICULO_PLACAS_DUPLICADAS', 'Ya existe un vehículo con esas placas.'),
      ],
    ])
    const { wrapper } = await abrir('Pasajero')

    await llenarVehiculo(wrapper)
    await enviar(wrapper)

    expect(wrapper.text()).toContain('Ya existe un vehículo con esas placas.')
    expect(useAuthStore().esConductor).toBe(false)
  })

  it('pinta los errores de validación de la API en su campo', async () => {
    instalarApiFalsa([
      [
        '/vehiculos',
        new ApiError(400, 'VALIDACION', 'Datos inválidos', { color: ['Color no válido'] }),
      ],
    ])
    const { wrapper } = await abrir('Pasajero')

    await llenarVehiculo(wrapper)
    await enviar(wrapper)

    expect(wrapper.text()).toContain('Color no válido')
  })

  it('muestra un error general si la API falla', async () => {
    instalarApiFalsa([['/vehiculos', errorApi(500, 'ERROR_SERVIDOR')]])
    const { wrapper } = await abrir('Pasajero')

    await llenarVehiculo(wrapper)
    await enviar(wrapper)

    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
    expect(useAuthStore().esConductor).toBe(false)
  })

  it('se puede cancelar el registro del vehículo', async () => {
    const { wrapper } = await abrir('Pasajero')
    await boton(wrapper, 'Quiero ser conductor').trigger('click')

    await boton(wrapper, 'Cancelar').trigger('click')

    expect(wrapper.find('form').exists()).toBe(false)
  })
})
