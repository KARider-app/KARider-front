// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import fs from 'node:fs'
import http from 'node:http'
import os from 'node:os'
import path from 'node:path'
import type { AddressInfo } from 'node:net'
import {
  CABECERAS,
  cacheDe,
  crearManejador,
  indexarArchivos,
  rutaDe,
} from '../../deploy/manejador.js'

/** Servidor de producción (deploy/) contra una carpeta temporal con un archivo "secreto" fuera de ella. */
let base: string
let sitio: string
let servidor: http.Server
let puerto: number

function pedir(ruta: string, metodo = 'GET') {
  return new Promise<{ estado: number; cuerpo: string; cabeceras: http.IncomingHttpHeaders }>(
    (ok, falla) => {
      const req = http.request(
        { host: '127.0.0.1', port: puerto, path: ruta, method: metodo },
        (res) => {
          let cuerpo = ''
          res.on('data', (d) => (cuerpo += d))
          res.on('end', () => ok({ estado: res.statusCode ?? 0, cuerpo, cabeceras: res.headers }))
        },
      )
      req.on('error', falla)
      req.end()
    },
  )
}

beforeAll(async () => {
  base = fs.mkdtempSync(path.join(os.tmpdir(), 'karider-sitio-'))
  sitio = path.join(base, 'dist')
  fs.mkdirSync(path.join(sitio, 'assets'), { recursive: true })
  fs.writeFileSync(path.join(sitio, 'index.html'), '<html>KARider</html>')
  fs.writeFileSync(path.join(sitio, 'assets', 'app-123.js'), 'console.log(1)')
  fs.writeFileSync(path.join(sitio, 'sw.js'), '// service worker')
  fs.writeFileSync(path.join(sitio, 'server.js'), '// privado')
  fs.writeFileSync(path.join(sitio, 'package.json'), '{}')
  fs.writeFileSync(path.join(base, 'secreto.txt'), 'SECRETO')

  servidor = http.createServer(crearManejador(sitio))
  await new Promise<void>((ok) => servidor.listen(0, '127.0.0.1', ok))
  puerto = (servidor.address() as AddressInfo).port
})

afterAll(async () => {
  await new Promise((ok) => servidor.close(ok))
  fs.rmSync(base, { recursive: true, force: true })
})

describe('servidor estático de producción (deploy/)', () => {
  it('entrega los archivos con su tipo, caché y cabeceras de seguridad', async () => {
    const js = await pedir('/assets/app-123.js')
    expect(js.estado).toBe(200)
    expect(js.cuerpo).toBe('console.log(1)')
    expect(js.cabeceras['content-type']).toBe('text/javascript; charset=utf-8')
    expect(js.cabeceras['cache-control']).toBe('public, max-age=31536000, immutable')
    expect(js.cabeceras['content-security-policy']).toContain('https://tile.openstreetmap.org')
    expect(js.cabeceras['x-frame-options']).toBe('DENY')

    const sw = await pedir('/sw.js')
    expect(sw.cabeceras['cache-control']).toBe('no-cache')
  })

  it('las rutas del router de Vue devuelven index.html', async () => {
    for (const ruta of ['/', '/viajes/123', '/perfil?tab=historial']) {
      const r = await pedir(ruta)
      expect(r.estado).toBe(200)
      expect(r.cuerpo).toBe('<html>KARider</html>')
    }
  })

  it('un archivo con extensión que no existe es 404', async () => {
    expect((await pedir('/assets/no-existe.js')).estado).toBe(404)
  })

  it('no entrega los archivos del propio servidor', async () => {
    expect((await pedir('/server.js')).estado).toBe(404)
    expect((await pedir('/package.json')).estado).toBe(404)
  })

  it.each([
    '/..%2fsecreto.txt',
    '/%2e%2e/secreto.txt',
    '/%2e%2e%2fsecreto.txt',
    '/..%5csecreto.txt',
    '/assets/..%2f..%2fsecreto.txt',
  ])('no permite salir de la carpeta: %s', async (ruta) => {
    const r = await pedir(ruta)
    expect(r.estado).toBe(404)
    expect(r.cuerpo).not.toContain('SECRETO')
  })

  it('un byte nulo (%00) ya no tumba el servidor', async () => {
    expect((await pedir('/%00')).estado).toBe(200)
    expect((await pedir('/%00.js')).estado).toBe(404)
    // Sigue respondiendo después.
    expect((await pedir('/assets/app-123.js')).estado).toBe(200)
  })

  it('una URL mal codificada es 400', async () => {
    expect((await pedir('/%E0%A4%A')).estado).toBe(400)
  })

  it('solo acepta GET y HEAD', async () => {
    const post = await pedir('/', 'POST')
    expect(post.estado).toBe(405)
    expect(post.cabeceras.allow).toBe('GET, HEAD')

    const head = await pedir('/assets/app-123.js', 'HEAD')
    expect(head.estado).toBe(200)
    expect(head.cuerpo).toBe('')
    expect(head.cabeceras['content-length']).toBe('14')
  })
})

describe('utilidades del servidor', () => {
  it('indexa solo archivos públicos', () => {
    const indice = indexarArchivos(sitio)
    expect([...indice.keys()].sort()).toEqual(['/assets/app-123.js', '/index.html', '/sw.js'])
  })

  it('decodifica la ruta o devuelve null si no es válida', () => {
    expect(rutaDe('/assets/a%20b.js?x=1')).toBe('/assets/a b.js')
    expect(rutaDe(undefined)).toBe('/')
    expect(rutaDe('/%E0%A4%A')).toBeNull()
  })

  it('solo los assets con hash se guardan un año en caché', () => {
    expect(cacheDe('/assets/x.js')).toContain('immutable')
    expect(cacheDe('/index.html')).toBe('no-cache')
    expect(CABECERAS['Referrer-Policy']).toBe('no-referrer')
  })

  it('sin index.html las rutas del router son 404', async () => {
    const vacio = fs.mkdtempSync(path.join(os.tmpdir(), 'karider-vacio-'))
    const otro = http.createServer(crearManejador(vacio))
    await new Promise<void>((ok) => otro.listen(0, '127.0.0.1', ok))
    const puertoOtro = (otro.address() as AddressInfo).port
    const estado = await new Promise<number>((ok) =>
      http.get({ host: '127.0.0.1', port: puertoOtro, path: '/viajes' }, (r) => {
        r.resume()
        ok(r.statusCode ?? 0)
      }),
    )
    await new Promise((ok) => otro.close(ok))
    fs.rmSync(vacio, { recursive: true, force: true })
    expect(estado).toBe(404)
  })
})
