<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { env } from '@/core/config/env'
import AlertMessage from '@/shared/components/AlertMessage.vue'
import BaseButton from '@/shared/components/BaseButton.vue'
import BaseInput from '@/shared/components/BaseInput.vue'
import PasswordInput from '@/shared/components/PasswordInput.vue'
import { mensajeDeError } from '@/shared/composables/useApiError'
import { useFormulario } from '@/shared/composables/useFormulario'
import { CODIGOS_ERROR_VERIFICACION, cuenta } from '../../application/cuenta'
import { correoEsquema, restablecerEsquema } from '../../domain/esquemas'
import CodigoVerificacionInput from '../components/CodigoVerificacionInput.vue'

const route = useRoute()
const router = useRouter()

/** Paso 1: pedir el código. Paso 2: capturar código y nueva contraseña. */
const paso = ref<1 | 2>(1)
const aviso = ref('')

const solicitud = useFormulario(correoEsquema, {
  correoInstitucional: typeof route.query.correo === 'string' ? route.query.correo : '',
})

const cambio = useFormulario(restablecerEsquema, {
  correoInstitucional: '',
  codigo: '',
  nuevaPassword: '',
  confirmarPassword: '',
})

const solicitudValores = solicitud.valores
const cambioValores = cambio.valores

function solicitarCodigo() {
  return solicitud.enviar(async (datos) => {
    const r = await cuenta.olvideContrasena(datos.correoInstitucional)
    aviso.value = r.mensaje
    cambioValores.value.correoInstitucional = datos.correoInstitucional
    paso.value = 2
  })
}

function restablecer() {
  return cambio.enviar(
    async (datos) => {
      await cuenta.restablecerContrasena(datos)
      await router.replace({
        name: 'login',
        query: { correo: datos.correoInstitucional, restablecida: '1' },
      })
    },
    {
      campoPorCodigo: Object.fromEntries(CODIGOS_ERROR_VERIFICACION.map((c) => [c, 'codigo'])),
    },
  )
}
</script>

<template>
  <main class="pantalla">
    <header>
      <h1 class="pantalla__titulo">Recuperar contraseña</h1>
      <p class="pantalla__subtitulo">
        {{
          paso === 1
            ? 'Te enviaremos un código a tu correo institucional.'
            : 'Escribe el código que recibiste y tu nueva contraseña.'
        }}
      </p>
    </header>

    <form v-if="paso === 1" class="formulario tarjeta" novalidate @submit.prevent="solicitarCodigo">
      <BaseInput
        v-model="solicitudValores.correoInstitucional"
        etiqueta="Correo institucional"
        :error="solicitud.errores.value.correoInstitucional"
        type="email"
        inputmode="email"
        autocomplete="username"
        autocapitalize="off"
        :placeholder="`matricula@${env.dominio}`"
      />
      <AlertMessage v-if="solicitud.errorGeneral.value" tipo="error">
        {{ mensajeDeError(solicitud.errorGeneral.value) }}
      </AlertMessage>
      <BaseButton type="submit" bloque :cargando="solicitud.enviando.value">
        ENVIAR CÓDIGO
      </BaseButton>
    </form>

    <form v-else class="formulario tarjeta" novalidate @submit.prevent="restablecer">
      <AlertMessage v-if="aviso" tipo="info">{{ aviso }}</AlertMessage>
      <CodigoVerificacionInput
        v-model="cambioValores.codigo"
        :error="cambio.errores.value.codigo"
      />
      <PasswordInput
        v-model="cambioValores.nuevaPassword"
        etiqueta="Nueva contraseña"
        nueva
        :error="cambio.errores.value.nuevaPassword"
        ayuda="Mínimo 8 caracteres con mayúscula, minúscula, número y carácter especial."
      />
      <PasswordInput
        v-model="cambioValores.confirmarPassword"
        etiqueta="Confirma la nueva contraseña"
        nueva
        :error="cambio.errores.value.confirmarPassword"
      />
      <AlertMessage v-if="cambio.errorGeneral.value" tipo="error">
        {{ mensajeDeError(cambio.errorGeneral.value) }}
      </AlertMessage>
      <BaseButton type="submit" bloque :cargando="cambio.enviando.value">
        CAMBIAR CONTRASEÑA
      </BaseButton>
      <BaseButton variante="texto" @click="paso = 1">Solicitar otro código</BaseButton>
    </form>

    <p class="centrado">
      <RouterLink :to="{ name: 'login' }">Volver a iniciar sesión</RouterLink>
    </p>
  </main>
</template>
