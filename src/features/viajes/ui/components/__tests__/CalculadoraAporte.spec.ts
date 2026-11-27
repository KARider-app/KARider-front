import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import CalculadoraAporte from '../CalculadoraAporte.vue'

function montar(gasto: number | string, asientos: number) {
  return mount(CalculadoraAporte, { props: { modelValue: gasto, asientos } })
}

describe('CalculadoraAporte (HU-21)', () => {
  it('divide el gasto solo entre los pasajeros, sin contar al conductor', () => {
    const wrapper = montar(150, 3)

    expect(wrapper.text()).toContain('$50 MXN')
    expect(wrapper.text()).toContain('Dividido entre 3 pasajeros')
    expect(wrapper.text()).not.toContain('personas')
  })

  it('con un solo asiento, ese pasajero cubre todo el gasto', () => {
    const wrapper = montar('80', 1)

    expect(wrapper.text()).toContain('$80 MXN')
    expect(wrapper.text()).toContain('Dividido entre 1 pasajero')
  })

  it('recalcula al cambiar los asientos', async () => {
    const wrapper = montar(160, 4)
    expect(wrapper.text()).toContain('$40 MXN')

    await wrapper.setProps({ asientos: 2 })

    expect(wrapper.text()).toContain('$80 MXN')
    expect(wrapper.text()).toContain('Dividido entre 2 pasajeros')
  })
})
