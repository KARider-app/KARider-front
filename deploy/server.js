// Servidor estático para Azure App Service (Linux, Node). Sin dependencias.
// Azure lo arranca con `npm start` (deploy/package.json). Sirve la SPA:
// archivos de dist/, rutas del router → index.html y cabeceras de seguridad.
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = path.dirname(fileURLToPath(import.meta.url))
const PUERTO = process.env.PORT || 8080
const API = 'https://karider-back-b5e7cchwaragg5cq.northcentralus-01.azurewebsites.net'

const TIPOS = {
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

const CABECERAS = {
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

// Archivos del servidor que nunca se entregan al navegador
const PRIVADOS = new Set(['/server.js', '/package.json'])

function cacheDe(ruta) {
  // Los assets llevan hash en el nombre; index.html y el service worker deben revalidarse siempre
  if (ruta.startsWith('/assets/')) return 'public, max-age=31536000, immutable'
  return 'no-cache'
}

function enviar(res, archivo, rutaUrl, metodo) {
  fs.stat(archivo, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, { ...CABECERAS, 'Content-Type': 'text/plain; charset=utf-8' })
      return res.end('No encontrado')
    }
    res.writeHead(200, {
      ...CABECERAS,
      'Content-Type': TIPOS[path.extname(archivo).toLowerCase()] || 'application/octet-stream',
      'Content-Length': stat.size,
      'Cache-Control': cacheDe(rutaUrl),
    })
    if (metodo === 'HEAD') return res.end()
    fs.createReadStream(archivo).pipe(res)
  })
}

http
  .createServer((req, res) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { ...CABECERAS, Allow: 'GET, HEAD' })
      return res.end()
    }

    let rutaUrl
    try {
      rutaUrl = decodeURIComponent(new URL(req.url, 'http://localhost').pathname)
    } catch {
      res.writeHead(400, CABECERAS)
      return res.end()
    }

    // Evita salir de la carpeta (../)
    const archivo = path.join(RAIZ, path.normalize(rutaUrl))
    const dentro = archivo === RAIZ || archivo.startsWith(RAIZ + path.sep)
    const relativa = '/' + path.relative(RAIZ, archivo).split(path.sep).join('/')
    if (!dentro || PRIVADOS.has(relativa)) {
      res.writeHead(404, CABECERAS)
      return res.end()
    }

    fs.stat(archivo, (err, stat) => {
      if (!err && stat.isFile()) return enviar(res, archivo, rutaUrl, req.method)
      // Un archivo con extensión que no existe es 404; cualquier otra ruta es del router de Vue
      if (path.extname(rutaUrl)) return enviar(res, '', rutaUrl, req.method)
      enviar(res, path.join(RAIZ, 'index.html'), '/index.html', req.method)
    })
  })
  .listen(PUERTO, () => {
    process.stdout.write(`KARider front escuchando en el puerto ${PUERTO}\n`)
  })
