import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, type VueWrapper } from '@vue/test-utils'
import { errorApi, instalarApiFalsa, montar } from '@/__tests__/apoyo/montaje'
import RecuperarContrasenaView from '../RecuperarContrasenaView.vue'
import RegistroView from '../RegistroView.vue'
import VerificarCorreoView from '../VerificarCorreoView.vue'

afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

/** Escribe en el campo cuya etiqueta es `etiqueta`. */
async function escribir(wrapper: VueWrapper, etiqueta: string, valor: string) {
  const label = wrapper.findAll('label').find((l) => l.text() === etiqueta)!
  await wrapper.get(`#${label.attributes('for')}`).setValue(valor)
}

describe('RegistroView (HU-01)', () => {
  it('pide los datos del auto cuando el rol es Conductor', async () => {
    instalarApiFalsa([['/catalogos/carreras', [{ id: 1, nombre: 'Ing. en Software' }]]])
    const { wrapper } = await montar(RegistroView, {
      ruta: '/registro?rol=Conductor',
      nombre: 'registro',
    })
    expect(wrapper.text()).toContain('Registro y Validación Institucional')
    expect(wrapper.text()).toContain('Datos del Auto del Conductor:')
    expect(wrapper.text()).toContain('Ing. en Software')
    await escribir(wrapper, 'Placas', 'hnx421bcd')
    expect(
      (wrapper.get('input[placeholder="Placas (ej. HNX421BCD)"]').element as HTMLInputElement)
        .value,
    ).toBe('HNX421BCD')
  })

  it('valida, avisa del correo duplicado y del fallo de carreras', async () => {
    instalarApiFalsa([
      ['/catalogos/carreras', errorApi(500, 'ERROR_SERVIDOR')],
      ['/auth/registro', errorApi(409, 'USUARIO_CORREO_DUPLICADO')],
    ])
    const { wrapper } = await montar(RegistroView, { ruta: '/registro', nombre: 'registro' })
    expect(wrapper.text()).toContain('No pudimos cargar las carreras.')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(wrapper.findAll('[role="alert"]').length).toBeGreaterThan(0)
  })
})

describe('VerificarCorreoView (HU-01)', () => {
  it('verifica el código y vuelve al login', async () => {
    const verificar = vi.fn<() => { mensaje: string }>(() => ({ mensaje: 'ok' }))
    instalarApiFalsa([['/auth/verificar-correo', verificar]])
    const { wrapper, router } = await montar(VerificarCorreoView, {
      ruta: '/verificar-correo?correo=ana@uttt.edu.mx&enviado=1',
      nombre: 'verificar',
    })
    expect(wrapper.text()).toContain('ana@uttt.edu.mx')
    expect(wrapper.text()).toContain('Reenviar código en')
    await wrapper.get('input[autocomplete="one-time-code"]').setValue('12a3456')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(verificar).toHaveBeenCalled()
    expect(router.currentRoute.value.name).toBe('login')
  })

  it('pide el correo si no viene en la URL y permite reenviar el código', async () => {
    const reenviar = vi.fn<() => { mensaje: string }>(() => ({
      mensaje: 'Te enviamos un nuevo código.',
    }))
    instalarApiFalsa([['/auth/reenviar-codigo', reenviar]])
    const { wrapper } = await montar(VerificarCorreoView, {
      ruta: '/verificar-correo',
      nombre: 'verificar',
    })
    await escribir(wrapper, 'Correo institucional', 'ana@uttt.edu.mx')
    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Reenviar código')!
      .trigger('click')
    await flushPromises()
    expect(reenviar).toHaveBeenCalled()
    expect(wrapper.text()).toContain('Te enviamos un nuevo código.')
  })

  it('muestra el error del reenvío y del código', async () => {
    instalarApiFalsa([
      ['/auth/reenviar-codigo', errorApi(429, 'LIMITE_SOLICITUDES_EXCEDIDO')],
      ['/auth/verificar-correo', errorApi(400, 'AUTH_CODIGO_INVALIDO')],
    ])
    const { wrapper } = await montar(VerificarCorreoView, {
      ruta: '/verificar-correo?correo=ana@uttt.edu.mx',
      nombre: 'verificar',
    })
    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Reenviar código')!
      .trigger('click')
    await flushPromises()
    await wrapper.get('input[autocomplete="one-time-code"]').setValue('123456')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(wrapper.findAll('[role="alert"]').length).toBeGreaterThan(0)
  })

  it('si el correo ya estaba verificado, regresa al login', async () => {
    instalarApiFalsa([['/auth/verificar-correo', errorApi(409, 'AUTH_CORREO_YA_VERIFICADO')]])
    const { wrapper, router } = await montar(VerificarCorreoView, {
      ruta: '/verificar-correo?correo=ana@uttt.edu.mx',
      nombre: 'verificar',
    })
    await wrapper.get('input[autocomplete="one-time-code"]').setValue('123456')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('login')
  })
})

describe('RecuperarContrasenaView', () => {
  it('pide el código y luego cambia la contraseña', async () => {
    const restablecer = vi.fn<() => { mensaje: string }>(() => ({ mensaje: 'ok' }))
    instalarApiFalsa([
      ['/auth/olvide-contrasena', { mensaje: 'Si el correo existe, te enviamos un código.' }],
      ['/auth/restablecer-contrasena', restablecer],
    ])
    const { wrapper, router } = await montar(RecuperarContrasenaView, {
      ruta: '/recuperar-contrasena?correo=ana@uttt.edu.mx',
      nombre: 'recuperar',
    })
    expect(wrapper.text()).toContain('Recuperar Contraseña')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(wrapper.text()).toContain('Si el correo existe, te enviamos un código.')

    await wrapper.get('input[autocomplete="one-time-code"]').setValue('123456')
    await escribir(wrapper, 'Nueva contraseña', 'Clave#2026a')
    await escribir(wrapper, 'Confirma la nueva contraseña', 'Clave#2026a')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(restablecer).toHaveBeenCalled()
    expect(router.currentRoute.value.name).toBe('login')
  })

  it('muestra los errores y permite pedir otro código', async () => {
    instalarApiFalsa([
      ['/auth/olvide-contrasena', { mensaje: 'Enviado' }],
      ['/auth/restablecer-contrasena', errorApi(400, 'ERROR_SERVIDOR')],
    ])
    const { wrapper } = await montar(RecuperarContrasenaView, {
      ruta: '/recuperar-contrasena?correo=ana@uttt.edu.mx',
      nombre: 'recuperar',
    })
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    await wrapper.get('input[autocomplete="one-time-code"]').setValue('123456')
    await escribir(wrapper, 'Nueva contraseña', 'Clave#2026a')
    await escribir(wrapper, 'Confirma la nueva contraseña', 'Clave#2026a')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(wrapper.findAll('[role="alert"]').length).toBeGreaterThan(0)

    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Solicitar otro código')!
      .trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('Enviar código')
  })

  it('muestra el error al solicitar el código', async () => {
    instalarApiFalsa([['/auth/olvide-contrasena', errorApi(500, 'ERROR_SERVIDOR')]])
    const { wrapper } = await montar(RecuperarContrasenaView, {
      ruta: '/recuperar-contrasena?correo=ana@uttt.edu.mx',
      nombre: 'recuperar',
    })
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
  })
})
