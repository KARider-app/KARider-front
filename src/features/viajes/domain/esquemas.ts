import { z } from 'zod'

/** Mismas reglas que PublicarViajeRequestValidator de la API. */
export const MAX_PARADAS = 5
export const DIAS_MAX_ANTICIPACION = 30
export const GASTO_MAXIMO = 5000

export const paradaEsquema = z
  .string()
  .trim()
  .min(1, 'La parada no puede estar vacía')
  .max(100, 'Máximo 100 caracteres por parada')

export const paso1Esquema = z
  .object({
    puntoEncuentroId: z.coerce.number<unknown>().int().positive('Selecciona el punto de encuentro'),
    destino: z.string().trim().min(3, 'Captura el destino final').max(150, 'Máximo 150 caracteres'),
    paradas: z.array(paradaEsquema).max(MAX_PARADAS, `Máximo ${MAX_PARADAS} paradas`),
    fecha: z.string().min(1, 'Selecciona la fecha'), // "2026-10-20"  (input type="date")
    hora: z.string().min(1, 'Selecciona la hora'), // "14:30"       (input type="time")
    asientos: z.coerce.number<unknown>().int().min(1, 'Entre 1 y 4').max(4, 'Entre 1 y 4'),
  })
  .refine(
    (d) => {
      const salida = new Date(`${d.fecha}T${d.hora}:00`)
      const max = new Date()
      max.setDate(max.getDate() + DIAS_MAX_ANTICIPACION)
      return salida > new Date() && salida <= max
    },
    {
      path: ['hora'],
      message: `La salida debe ser futura y dentro de los próximos ${DIAS_MAX_ANTICIPACION} días`,
    },
  )

export const paso2Esquema = z.object({
  gastoTotal: z.coerce
    .number<unknown>({ error: 'Captura el gasto total' })
    .gt(0, 'El gasto debe ser mayor a $0')
    .max(
      GASTO_MAXIMO,
      `Máximo $${GASTO_MAXIMO.toLocaleString('es-MX')} MXN: el viaje no tiene fines de lucro`,
    )
    .refine((v) => /^\d+(\.\d{1,2})?$/.test(String(v)), 'Máximo 2 decimales'),
  notas: z.string().trim().max(500, 'Máximo 500 caracteres'),
  vehiculoId: z.string().optional(),
})

export type Paso1 = z.infer<typeof paso1Esquema>
export type Paso2 = z.infer<typeof paso2Esquema>

/** HU-09: un solo formulario; no se pueden ofrecer menos asientos que los ya reservados. */
export const crearEditarEsquema = (reservados: () => number) =>
  z.intersection(paso1Esquema, paso2Esquema).refine((d) => d.asientos >= reservados(), {
    path: ['asientos'],
    message: `Ya hay ${reservados()} reservados: ofrece al menos ${reservados()}`,
  })
