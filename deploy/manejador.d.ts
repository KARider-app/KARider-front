// Tipos de manejador.js (lo importan las pruebas de src/__tests__).
import type { IncomingMessage, ServerResponse } from 'node:http'

export interface ArchivoPublico {
  ruta: string
  tamano: number
}

export const API: string
export const TIPOS: Record<string, string>
export const CABECERAS: Record<string, string>
export const PRIVADOS: Set<string>
export function cacheDe(ruta: string): string
export function indexarArchivos(raiz: string): Map<string, ArchivoPublico>
export function rutaDe(url: string | undefined): string | null
export function crearManejador(raiz: string): (req: IncomingMessage, res: ServerResponse) => void
