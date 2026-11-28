import { env } from '@/core/config/env'
import type { ViajeResumen } from './tipos'

/**
 * HU-24: horas que una ruta programada sigue en «Mapa de mis rutas» después de su hora de salida,
 * por si el conductor sale tarde o aún no toca «Iniciar viaje». Después desaparece de ahí
 * (sigue en Perfil › Historial).
 */
export const HORAS_GRACIA_SALIDA = 3

const MS_POR_HORA = 3_600_000
const MS_POR_DIA = 86_400_000

/** La ruta sirve en el mapa: va en curso, o está programada y aún no pasa su tiempo de gracia. */
export function esRutaActiva(
  viaje: Pick<ViajeResumen, 'estado' | 'fechaSalida'>,
  ahora = new Date(),
) {
  if (viaje.estado === 'EnCurso') return true
  if (viaje.estado !== 'Programado') return false
  const salida = new Date(viaje.fechaSalida).getTime()
  return salida >= ahora.getTime() - HORAS_GRACIA_SALIDA * MS_POR_HORA
}

/** Ya pasó la hora de salida de una ruta programada: toca iniciarla. */
export function yaEsHoraDeSalir(
  viaje: Pick<ViajeResumen, 'estado' | 'fechaSalida'>,
  ahora = new Date(),
) {
  return viaje.estado === 'Programado' && new Date(viaje.fechaSalida).getTime() <= ahora.getTime()
}

export interface GrupoRutas {
  clave: string
  titulo: string
  rutas: ViajeResumen[]
}

/** Día AAAA-MM-DD en la zona horaria de la app (no la del dispositivo). */
const diaEnZona = (d: Date) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: env.zonaHoraria }).format(d)

/** «sáb 29 nov» en la zona horaria de la app. */
function diaCorto(d: Date) {
  const partes = new Intl.DateTimeFormat('es-MX', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: env.zonaHoraria,
  }).formatToParts(d)
  const parte = (t: Intl.DateTimeFormatPartTypes) =>
    (partes.find((p) => p.type === t)?.value ?? '').replace('.', '')
  return `${parte('weekday')} ${parte('day')} ${parte('month')}`
}

/** Título del grupo de un día: «Hoy», «Mañana · sáb 29 nov», «Ayer» o «lun 1 dic». */
export function tituloDelDia(iso: string, ahora = new Date()) {
  const fecha = new Date(iso)
  const dia = diaEnZona(fecha)
  if (dia === diaEnZona(ahora)) return 'Hoy'
  if (dia === diaEnZona(new Date(ahora.getTime() + MS_POR_DIA)))
    return `Mañana · ${diaCorto(fecha)}`
  if (dia === diaEnZona(new Date(ahora.getTime() - MS_POR_DIA))) return 'Ayer'
  return diaCorto(fecha)
}

/**
 * HU-24: rutas activas para «Mapa de mis rutas». Primero las que van en curso; luego las
 * programadas de la más próxima a la más lejana, agrupadas por día.
 */
export function agruparRutasActivas(viajes: ViajeResumen[], ahora = new Date()): GrupoRutas[] {
  const activas = viajes.filter((v) => esRutaActiva(v, ahora))
  const grupos: GrupoRutas[] = []

  const enCurso = activas
    .filter((v) => v.estado === 'EnCurso')
    .sort((a, b) => a.fechaSalida.localeCompare(b.fechaSalida))
  if (enCurso.length) grupos.push({ clave: 'en-curso', titulo: 'En curso', rutas: enCurso })

  const programadas = activas
    .filter((v) => v.estado === 'Programado')
    .sort((a, b) => new Date(a.fechaSalida).getTime() - new Date(b.fechaSalida).getTime())
  for (const ruta of programadas) {
    const clave = diaEnZona(new Date(ruta.fechaSalida))
    const grupo = grupos.find((g) => g.clave === clave)
    if (grupo) grupo.rutas.push(ruta)
    else grupos.push({ clave, titulo: tituloDelDia(ruta.fechaSalida, ahora), rutas: [ruta] })
  }

  return grupos
}
