import { afterEach, describe, expect, it } from 'vitest'
import { montar } from '@/__tests__/apoyo/montaje'
import { useAuthStore } from '../../../application/useAuthStore'
import InicioView from '../InicioView.vue'

const abrir = (rol: 'Pasajero' | 'Conductor' | null) =>
  montar(InicioView, { ruta: '/', nombre: 'inicio', rol })

describe('InicioView', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('sin sesión muestra el flujo oficial del MVP y los compromisos', async () => {
    const { wrapper } = await abrir(null)
    const texto = wrapper.text()
    expect(texto).toContain('Carpooling Universitario UTTT')
    expect(texto).toContain('1. Iniciar Sesión (Login)')
    expect(texto).toContain('5. Perfil con Calificación Mutua')
    expect(texto).toContain('Compromiso Institucional UTTT')
    expect(wrapper.find('a[href="/login"]').exists()).toBe(true)
    expect(wrapper.find('a[href="/registro?rol=Conductor"]').exists()).toBe(true)
  })

  it('el pasajero ve sus acciones rápidas (sin publicar)', async () => {
    const { wrapper } = await abrir('Pasajero')
    const texto = wrapper.text()
    expect(texto).toContain('Carlos Mendoza López')
    expect(texto).toContain('Acciones Rápidas')
    expect(texto).toContain('Explorar Viajes')
    expect(texto).not.toContain('Publicar Ruta')
    expect(texto).toContain('Pasajero')
  })

  it('el conductor también puede publicar y ver sus borradores', async () => {
    const { wrapper } = await abrir('Conductor')
    const texto = wrapper.text()
    expect(texto).toContain('Publicar Ruta')
    expect(texto).toContain('Mis Borradores')
    expect(wrapper.find('a[href="/publicar/borradores"]').exists()).toBe(true)
  })

  it('HU-17: el conductor cambia a modo pasajero desde el indicador de modo', async () => {
    const { wrapper } = await abrir('Conductor')
    await wrapper.get('button[aria-label="Modo Conductor. Cambiar a Pasajero"]').trigger('click')

    expect(useAuthStore().modoActivo).toBe('Pasajero')
    expect(wrapper.text()).not.toContain('Publicar Ruta')
  })

  it('HU-17: el pasajero sin vehículo no tiene botón para cambiar de modo', async () => {
    const { wrapper } = await abrir('Pasajero')
    expect(wrapper.find('button[aria-label^="Modo"]').exists()).toBe(false)
  })
})
