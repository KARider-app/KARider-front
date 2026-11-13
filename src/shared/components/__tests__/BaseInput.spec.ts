import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseInput from '../BaseInput.vue'

describe('BaseInput: filtrado de caracteres mientras se escribe', () => {
  it('filtro="letras" bloquea números y símbolos, pero permite espacios y acentos', async () => {
    const wrapper = mount(BaseInput, { props: { etiqueta: 'Nombre', filtro: 'letras' } })
    const input = wrapper.get('input')

    await input.setValue('José Pérez123!')

    expect(input.element.value).toBe('José Pérez')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['José Pérez'])
  })

  it('filtro="numeros" bloquea letras y símbolos', async () => {
    const wrapper = mount(BaseInput, { props: { etiqueta: 'Teléfono', filtro: 'numeros' } })
    const input = wrapper.get('input')

    await input.setValue('773-abc-1234')

    expect(input.element.value).toBe('7731234')
  })

  it('filtro="alfanumerico" bloquea guiones y otros símbolos', async () => {
    const wrapper = mount(BaseInput, { props: { etiqueta: 'Placas', filtro: 'alfanumerico' } })
    const input = wrapper.get('input')

    await input.setValue('HNX-421-C!')

    expect(input.element.value).toBe('HNX421C')
  })

  it('mayusculas y filtro se pueden combinar (placas)', async () => {
    const wrapper = mount(BaseInput, {
      props: { etiqueta: 'Placas', filtro: 'alfanumerico', mayusculas: true },
    })
    const input = wrapper.get('input')

    await input.setValue('hnx-421c')

    expect(input.element.value).toBe('HNX421C')
  })

  it('sin filtro, el campo acepta cualquier caracter (comportamiento previo)', async () => {
    const wrapper = mount(BaseInput, { props: { etiqueta: 'Libre' } })
    const input = wrapper.get('input')

    await input.setValue('abc123!@#')

    expect(input.element.value).toBe('abc123!@#')
  })
})
