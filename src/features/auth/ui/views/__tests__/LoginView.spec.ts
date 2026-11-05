import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import LoginView from '../LoginView.vue'

const Vacia = { template: '<div />' }

function crearRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'inicio', component: Vacia },
      { path: '/login', name: 'login', component: LoginView },
      { path: '/registro', name: 'registro', component: Vacia },
      { path: '/verificar-correo', name: 'verificar', component: Vacia },
      { path: '/recuperar-contrasena', name: 'recuperar', component: Vacia },
    ],
  })
}

describe('LoginView: autocompletado de credenciales', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('el campo de contraseña pide la contraseña actual al gestor del navegador', async () => {
    const router = crearRouter()
    await router.push('/login')
    await router.isReady()

    const wrapper = mount(LoginView, { global: { plugins: [router] } })

    const password = wrapper.get('input[type="password"]')
    expect(password.attributes('autocomplete')).toBe('current-password')
  })
})
