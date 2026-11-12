import { env } from '@/core/config/env'

const moneda = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })
const monedaEntera = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 0,
})

/** Pesos mexicanos; sin centavos cuando la cantidad es entera, como en los mockups («$45»). */
export const mxn = (v: number) => (Number.isInteger(v) ? monedaEntera : moneda).format(v)

export const fechaHora = (iso: string) =>
  new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: env.zonaHoraria,
  }).format(new Date(iso))

/** Hora corta de salida, como en los mockups: «14:30 hrs». */
export const horaCorta = (iso: string) =>
  `${new Intl.DateTimeFormat('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: env.zonaHoraria,
  }).format(new Date(iso))} hrs`

const diaZona = (d: Date) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: env.zonaHoraria }).format(d) // AAAA-MM-DD

/** Fecha corta como en los mockups: «Hoy, 20 Sep 2026», «Mañana, 21 Sep 2026» o «18 Sep 2026». */
export const fechaCorta = (iso: string) => {
  const fecha = new Date(iso)
  const partes = new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: env.zonaHoraria,
  }).formatToParts(fecha)
  const parte = (t: Intl.DateTimeFormatPartTypes) => partes.find((p) => p.type === t)?.value ?? ''
  const mes = parte('month').replace('.', '')
  const texto = `${parte('day')} ${mes.charAt(0).toUpperCase()}${mes.slice(1)} ${parte('year')}`

  const hoy = new Date()
  const manana = new Date(hoy.getTime() + 86_400_000)
  if (diaZona(fecha) === diaZona(hoy)) return `Hoy, ${texto}`
  if (diaZona(fecha) === diaZona(manana)) return `Mañana, ${texto}`
  return texto
}
