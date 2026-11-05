import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import PasswordInput from '../PasswordInput.vue'

describe('PasswordInput: autocompletado del navegador', () => {
  it('usa current-password para iniciar sesión', () => {
    const wrapper = mount(PasswordInput, { props: { etiqueta: 'Contraseña' } })
    const input = wrapper.get('input')
    expect(input.attributes('autocomplete')).toBe('current-password')
    expect(input.attributes('type')).toBe('password')
  })

  it('usa new-password para registrar o cambiar la contraseña', () => {
    const wrapper = mount(PasswordInput, { props: { etiqueta: 'Nueva contraseña', nueva: true } })
    expect(wrapper.get('input').attributes('autocomplete')).toBe('new-password')
  })

  it('el botón muestra y oculta la contraseña sin perder el autocompletado', async () => {
    const wrapper = mount(PasswordInput, { props: { etiqueta: 'Contraseña', nueva: true } })
    await wrapper.get('button').trigger('click')
    const input = wrapper.get('input')
    expect(input.attributes('type')).toBe('text')
    expect(input.attributes('autocomplete')).toBe('new-password')
  })
})
