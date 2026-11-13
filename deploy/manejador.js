// Lógica del servidor estático de la SPA (la usa server.js). Sin dependencias.
//
// Seguridad: al arrancar se indexan los archivos de dist/ (no cambian mientras corre). Cada petición solo
// busca su ruta en ese índice; el texto que manda el navegador nunca se usa para abrir archivos. Así no hay
// recorrido de carpetas (../), ni archivos privados expuestos, ni caídas por rutas inválidas (p. ej. %00).
import fs from 'node:fs'
import path from 'node:path'

export const API = 'https://karider-back-b5e7cchwaragg5cq.northcentralus-01.azurewebsites.net'

export const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
}

export const CABECERAS = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    // tile.openstreetmap.org: el service worker descarga los mosaicos del mapa (HU-08)
    `connect-src 'self' ${API} https://tile.openstreetmap.org`,
    "worker-src 'self'",
    "manifest-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '),
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self)',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
}

/** Archivos del servidor que nunca se entregan al navegador. */
export const PRIVADOS = new Set(['/server.js', '/manejador.js', '/package.json'])

/** Los assets llevan hash en el nombre; index.html y el service worker deben revalidarse siempre. */
export function cacheDe(ruta) {
  return ruta.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache'
}

/** Índice ruta URL ("/assets/app.js") → archivo en disco, con todos los archivos públicos de la carpeta. */
export function indexarArchivos(raiz) {
  const indice = new Map()
  const recorrer = (carpeta) => {
    for (const entrada of fs.readdirSync(carpeta, { withFileTypes: true })) {
      const absoluta = path.join(carpeta, entrada.name)
      if (entrada.isDirectory()) {
        recorrer(absoluta)
      } else if (entrada.isFile()) {
        const url = '/' + path.relative(raiz, absoluta).split(path.sep).join('/')
        if (!PRIVADOS.has(url))
          indice.set(url, { ruta: absoluta, tamano: fs.statSync(absoluta).size })
      }
    }
  }
  recorrer(raiz)
  return indice
}

/** Ruta de la URL ya decodificada ("/assets/app.js"), o null si la URL no es válida. */
export function rutaDe(url) {
  try {
    return decodeURIComponent(new URL(url ?? '/', 'http://localhost').pathname)
  } catch {
    return null
  }
}

function responder(res, estado, extra = {}) {
  res.writeHead(estado, { ...CABECERAS, 'Content-Type': 'text/plain; charset=utf-8', ...extra })
  res.end(estado === 404 ? 'No encontrado' : undefined)
}

function enviar(res, archivo, rutaUrl, metodo) {
  res.writeHead(200, {
    ...CABECERAS,
    'Content-Type': TIPOS[path.extname(archivo.ruta).toLowerCase()] || 'application/octet-stream',
    'Content-Length': archivo.tamano,
    'Cache-Control': cacheDe(rutaUrl),
  })
  if (metodo === 'HEAD') return res.end()
  fs.createReadStream(archivo.ruta)
    .on('error', () => res.destroy())
    .pipe(res)
}

/** Manejador HTTP: archivos de la carpeta, rutas del router → index.html, y cabeceras de seguridad. */
export function crearManejador(raiz) {
  const indice = indexarArchivos(raiz)
  const indexHtml = indice.get('/index.html')

  return (req, res) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return responder(res, 405, { Allow: 'GET, HEAD' })
    }

    const ruta = rutaDe(req.url)
    if (ruta === null) return responder(res, 400)

    const archivo = indice.get(ruta)
    if (archivo) return enviar(res, archivo, ruta, req.method)

    // Un archivo con extensión que no existe es 404; cualquier otra ruta es del router de Vue.
    if (path.posix.extname(ruta) || !indexHtml) return responder(res, 404)
    return enviar(res, indexHtml, '/index.html', req.method)
  }
}
