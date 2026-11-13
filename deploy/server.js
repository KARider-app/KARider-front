// Servidor estático para Azure App Service (Linux, Node). Sin dependencias.
// Azure lo arranca con `npm start` (deploy/package.json). Sirve la SPA de dist/ con cabeceras de seguridad;
// la lógica (índice de archivos, router de Vue, caché) está en manejador.js.
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { crearManejador } from './manejador.js'

const RAIZ = path.dirname(fileURLToPath(import.meta.url))
const PUERTO = process.env.PORT || 8080

http.createServer(crearManejador(RAIZ)).listen(PUERTO, () => {
  process.stdout.write(`KARider front escuchando en el puerto ${PUERTO}\n`)
})
