const soloDigitos = (telefono: string) => telefono.replace(/\D/g, '')

/** Número en formato internacional para wa.me (los de 10 dígitos se asumen de México). */
export function numeroInternacional(telefono: string): string {
  const d = soloDigitos(telefono)
  return d.length === 10 ? `52${d}` : d
}

export function enlaceLlamada(telefono: string): string {
  return `tel:+${numeroInternacional(telefono)}`
}

export function enlaceWhatsApp(telefono: string, mensaje?: string): string {
  const base = `https://wa.me/${numeroInternacional(telefono)}`
  return mensaje ? `${base}?text=${encodeURIComponent(mensaje)}` : base
}
