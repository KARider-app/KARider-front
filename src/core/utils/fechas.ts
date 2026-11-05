/** Une una fecha "AAAA-MM-DD" y una hora "HH:mm" capturadas en hora local. */
export function fechaLocal(fecha: string, hora: string): Date {
  return new Date(`${fecha}T${hora}:00`)
}

/** Convierte la fecha y hora local a ISO 8601 (UTC) para la API. */
export function aIsoUtc(fecha: string, hora: string): string {
  return fechaLocal(fecha, hora).toISOString()
}

const dosDigitos = (n: number) => String(n).padStart(2, '0')

/** "AAAA-MM-DD" en hora local, para los atributos min/max de input type="date". */
export function aFechaInput(d: Date): string {
  return `${d.getFullYear()}-${dosDigitos(d.getMonth() + 1)}-${dosDigitos(d.getDate())}`
}

export function sumarDias(d: Date, dias: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + dias)
  return r
}

/** Convierte el ISO que manda la API en la fecha y hora locales de los inputs. */
export function aFechaYHoraLocal(iso: string): { fecha: string; hora: string } {
  const d = new Date(iso)
  return {
    fecha: aFechaInput(d),
    hora: `${dosDigitos(d.getHours())}:${dosDigitos(d.getMinutes())}`,
  }
}
