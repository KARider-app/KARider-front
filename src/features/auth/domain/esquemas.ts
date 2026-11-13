import { z } from 'zod'
import { env } from '@/core/config/env'

/** Mismas reglas que los validadores de la API (FluentValidation). */

const anioMax = new Date().getFullYear() + 1

/** Convierte "" o null en undefined para campos numéricos opcionales. */
const vacioComoIndefinido = (v: unknown) => (v === '' || v === null ? undefined : v)

export const passwordSegura = z
  .string()
  .min(8, 'Al menos 8 caracteres')
  .max(128, 'Máximo 128 caracteres')
  .regex(/[A-Z]/, 'Incluye una mayúscula')
  .regex(/[a-z]/, 'Incluye una minúscula')
  .regex(/[0-9]/, 'Incluye un número')
  .regex(/[^a-zA-Z0-9]/, 'Incluye un carácter especial (ej. !@#$%)')

export const correoInstitucional = z
  .string()
  .trim()
  .min(1, 'Captura tu correo institucional')
  .max(150, 'Máximo 150 caracteres')
  .pipe(z.email('Correo no válido'))
  .refine((c) => c.toLowerCase().endsWith(`@${env.dominio}`), `Solo correos @${env.dominio}`)

export const codigoEsquema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, 'El código tiene 6 dígitos')

export const vehiculoEsquema = z.object({
  modelo: z
    .string()
    .trim()
    .min(1, 'Captura el modelo (ej. Nissan Versa)')
    .max(20, 'Máximo 20 caracteres')
    .regex(/^[\p{L}\s]+$/u, 'Solo letras (sin números)'),
  color: z.string().trim().min(1, 'Captura el color').max(30),
  anio: z.coerce
    .number<unknown>()
    .int('Año no válido')
    .min(1990, `Entre 1990 y ${anioMax}`)
    .max(anioMax, `Entre 1990 y ${anioMax}`),
  placas: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9]{9}$/, 'Exactamente 9 caracteres alfanuméricos (ej. HNX421BCD)'),
  capacidad: z.coerce.number<unknown>().int().min(1, 'Entre 1 y 4').max(4, 'Entre 1 y 4'),
})

export const registroEsquema = z
  .object({
    rol: z.enum(['Pasajero', 'Conductor']),
    nombreCompleto: z
      .string()
      .trim()
      .length(40, 'Debe tener exactamente 40 letras')
      .regex(/^[\p{L}\s]+$/u, 'Solo letras, como en tu credencial'),
    matricula: z
      .string()
      .trim()
      .regex(/^\d{8}$/, 'Exactamente 8 dígitos'),
    telefono: z
      .string()
      .trim()
      .regex(/^\d{10}$/, 'Exactamente 10 dígitos, sin letras'),
    carreraId: z.coerce.number<unknown>().int().positive('Selecciona tu carrera'),
    cuatrimestre: z.preprocess(
      vacioComoIndefinido,
      z.coerce.number<unknown>().int().min(1, 'Entre 1 y 11').max(11, 'Entre 1 y 11').optional(),
    ),
    correoInstitucional,
    password: passwordSegura,
    confirmarPassword: z.string(),
    vehiculo: vehiculoEsquema.optional(),
  })
  .refine((d) => d.password === d.confirmarPassword, {
    path: ['confirmarPassword'],
    message: 'No coincide con la contraseña',
  })
  .refine((d) => d.rol === 'Pasajero' || !!d.vehiculo, {
    path: ['vehiculo'],
    message: 'Captura los datos de tu vehículo',
  })

export const loginEsquema = z.object({
  correoInstitucional,
  password: z.string().min(1, 'Captura tu contraseña').max(128),
  rol: z.enum(['Pasajero', 'Conductor']),
  recordarme: z.boolean(),
})

export const verificarCorreoEsquema = z.object({
  correoInstitucional,
  codigo: codigoEsquema,
})

export const correoEsquema = z.object({ correoInstitucional })

export const restablecerEsquema = z
  .object({
    correoInstitucional,
    codigo: codigoEsquema,
    nuevaPassword: passwordSegura,
    confirmarPassword: z.string(),
  })
  .refine((d) => d.nuevaPassword === d.confirmarPassword, {
    path: ['confirmarPassword'],
    message: 'No coincide con la nueva contraseña',
  })

export type RegistroForm = z.infer<typeof registroEsquema>
