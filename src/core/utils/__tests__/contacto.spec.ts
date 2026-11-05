import { describe, expect, it } from 'vitest'
import { enlaceLlamada, enlaceWhatsApp, numeroInternacional } from '../contacto'

describe('contacto del conductor (HU-07)', () => {
  it('agrega la lada de México a números de 10 dígitos', () => {
    expect(numeroInternacional('771 123 4567')).toBe('527711234567')
  })

  it('respeta números que ya traen lada', () => {
    expect(numeroInternacional('+52 771 123 4567')).toBe('527711234567')
  })

  it('arma los enlaces de llamada y WhatsApp', () => {
    expect(enlaceLlamada('7711234567')).toBe('tel:+527711234567')
    expect(enlaceWhatsApp('7711234567')).toBe('https://wa.me/527711234567')
    expect(enlaceWhatsApp('7711234567', 'Hola, soy tu pasajero')).toBe(
      'https://wa.me/527711234567?text=Hola%2C%20soy%20tu%20pasajero',
    )
  })
})
