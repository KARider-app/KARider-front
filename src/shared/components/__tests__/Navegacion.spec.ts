import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, h, type Component } from 'vue'
import { montar, usuario } from '@/__tests__/apoyo/montaje'
import BottomNav from '../BottomNav.vue'
import TopNav from '../TopNav.vue'

/** Monta una barra dentro de una ruta concreta, para comprobar la opción activa. */
function conBarra(barra: typeof BottomNav | typeof TopNav, props: Record<string, unknown>) {
  return defineComponent({
    emits: ['salir'],
    setup:
      (_, { emit }) =>
      () =>
        h(barra as Component, { ...props, onSalir: () => emit('salir') }),
  })
}

describe('Barras de navegación', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('BottomNav sin sesión ofrece Login y marca Consultar como activa', async () => {
    const { wrapper } = await montar(
      conBarra(BottomNav, { autenticado: false, esConductor: false }),
      { ruta: '/viajes', nombre: 'buscar' },
    )
    expect(wrapper.text()).toContain('Login')
    expect(wrapper.text()).not.toContain('Publicar')
    expect(wrapper.get('a[href="/viajes"]').classes()).toContain('text-[#0284C7]')
  })

  it('BottomNav del conductor incluye Publicar y el botón Salir', async () => {
    const { wrapper } = await montar(
      conBarra(BottomNav, { autenticado: true, esConductor: true }),
      { ruta: '/perfil', nombre: 'perfil' },
    )
    expect(wrapper.text()).toContain('Publicar')
    expect(wrapper.get('a[href="/perfil"]').classes()).toContain('text-[#1D2D44]')
    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Salir')!
      .trigger('click')
    expect(wrapper.emitted('salir')).toHaveLength(1)
  })

  it('TopNav sin sesión invita a crear cuenta', async () => {
    const { wrapper } = await montar(
      conBarra(TopNav, { autenticado: false, esConductor: false, usuario: null }),
      { ruta: '/login', nombre: 'login' },
    )
    expect(wrapper.text()).toContain('Crear cuenta')
    expect(wrapper.get('a[href="/login"]').classes()).toContain('bg-[#0284C7]')
  })

  it('TopNav con sesión muestra al usuario, su rol y Salir', async () => {
    const { wrapper } = await montar(
      conBarra(TopNav, { autenticado: true, esConductor: true, usuario: usuario('Conductor') }),
      { ruta: '/publicar', nombre: 'publicar-1' },
    )
    const texto = wrapper.text()
    expect(texto).toContain('Carlos Mendoza López')
    expect(texto).toContain('Conductor')
    expect(texto).toContain('CM')
    expect(wrapper.get('a[href="/publicar"]').classes()).toContain('bg-[#0284C7]')
    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Salir')!
      .trigger('click')
    expect(wrapper.emitted('salir')).toHaveLength(1)
  })

  it('TopNav usa la foto del usuario cuando la tiene', async () => {
    const conFoto = { ...usuario('Pasajero'), fotoUrl: 'https://example.com/foto.png' }
    const { wrapper } = await montar(
      conBarra(TopNav, { autenticado: true, esConductor: false, usuario: conFoto }),
      { ruta: '/perfil', nombre: 'perfil' },
    )
    expect(wrapper.get('img[alt="Carlos Mendoza López"]').attributes('src')).toBe(
      'https://example.com/foto.png',
    )
  })
})
