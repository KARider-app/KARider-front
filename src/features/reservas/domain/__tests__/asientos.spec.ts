import { describe, expect, it } from 'vitest'
import { maximoReservable, montoEstimado, validarAsientos } from '../asientos'

describe('asientos de una reserva (HU-07)', () => {
  it('limita la reserva a 2 asientos como máximo', () => {
    expect(maximoReservable(4)).toBe(2)
    expect(maximoReservable(2)).toBe(2)
    expect(maximoReservable(1)).toBe(1)
    expect(maximoReservable(0)).toBe(0)
  })

  it('acepta 1 asiento cuando hay 2 disponibles', () => {
    expect(validarAsientos(1, 2)).toBeNull()
  })

  it('rechaza pedir 2 asientos cuando solo queda 1', () => {
    expect(validarAsientos(2, 1)).toBe('Solo queda 1 asiento disponible')
  })

  it('rechaza cuando el viaje está lleno', () => {
    expect(validarAsientos(1, 0)).toBe('Ya no hay asientos disponibles')
  })

  it('rechaza más de 2 asientos o valores inválidos', () => {
    expect(validarAsientos(3, 4)).toContain('entre 1 y 2')
    expect(validarAsientos(0, 4)).toContain('entre 1 y 2')
    expect(validarAsientos(1.5, 4)).toContain('entre 1 y 2')
  })

  it('estima el monto como aporte × asientos', () => {
    expect(montoEstimado(40, 2)).toBe(80)
    expect(montoEstimado(33.33, 2)).toBe(66.66)
  })
})
