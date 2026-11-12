<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { env } from '@/core/config/env'
import AlertMessage from '@/shared/components/AlertMessage.vue'
import BaseButton from '@/shared/components/BaseButton.vue'
import BaseInput from '@/shared/components/BaseInput.vue'
import LogoKarider from '@/shared/components/LogoKarider.vue'
import { ArrowLeft, KeyRound, Mail, Send } from 'lucide-vue-next'
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
  <main class="flex flex-col min-h-full flex-1 bg-white text-[#1D2D44]">
    <header
      class="pt-4 px-5 pb-3 bg-gradient-to-b from-[#EAF2F8] to-white border-b border-[#C9DCE8]/60 flex flex-col items-center text-center"
    >
      <div class="w-full flex items-center justify-between mb-2">
        <RouterLink
          :to="{ name: 'login' }"
          class="text-xs text-[#3E5C76] hover:text-[#1D2D44] font-semibold flex items-center gap-1"
        >
          <ArrowLeft class="w-3.5 h-3.5" aria-hidden="true" />
          <span>Iniciar Sesión</span>
        </RouterLink>
        <span
          class="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#1D2D44] text-white"
        >
          Recuperar acceso
        </span>
      </div>
      <LogoKarider variant="horizontal" size="sm" class="my-1" />
      <h1 class="text-lg font-black text-[#1D2D44] mt-1">Recuperar Contraseña</h1>
      <p class="text-xs text-[#3E5C76]">
        {{
          paso === 1
            ? 'Te enviaremos un código a tu correo institucional.'
            : 'Escribe el código que recibiste y tu nueva contraseña.'
        }}
      </p>
    </header>

    <div class="p-5 flex-1 flex flex-col justify-between max-w-md mx-auto w-full">
      <form v-if="paso === 1" class="space-y-4" novalidate @submit.prevent="solicitarCodigo">
        <BaseInput
          v-model="solicitudValores.correoInstitucional"
          :etiqueta="`Correo Institucional (@${env.dominio})`"
          :error="solicitud.errores.value.correoInstitucional"
          :icono="Mail"
          type="email"
          inputmode="email"
          autocomplete="username"
          autocapitalize="off"
          :placeholder="`tunombre.apellido@${env.dominio}`"
        />
        <AlertMessage v-if="solicitud.errorGeneral.value" tipo="error">
          {{ mensajeDeError(solicitud.errorGeneral.value) }}
        </AlertMessage>
        <BaseButton type="submit" bloque :cargando="solicitud.enviando.value">
          <Send class="w-4 h-4" aria-hidden="true" />
          <span>Enviar código</span>
        </BaseButton>
      </form>

      <form v-else class="space-y-4" novalidate @submit.prevent="restablecer">
        <div
          class="w-16 h-16 rounded-2xl bg-[#EAF2F8] text-[#1D2D44] flex items-center justify-center mx-auto border-2 border-[#8AA9C4]"
        >
          <KeyRound class="w-8 h-8 text-[#0284C7]" aria-hidden="true" />
        </div>
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
          Cambiar contraseña
        </BaseButton>
        <button
          type="button"
          class="text-xs text-[#3E5C76] hover:underline block mx-auto"
          @click="paso = 1"
        >
          Solicitar otro código
        </button>
      </form>

      <div class="mt-4 pt-3 border-t border-[#EDEDED] text-center">
        <span class="text-xs text-[#4B5563]">¿Ya recordaste tu contraseña? </span>
        <RouterLink
          :to="{ name: 'login' }"
          class="text-xs font-bold text-[#0284C7] hover:underline"
        >
          Iniciar Sesión
        </RouterLink>
      </div>
    </div>
  </main>
</template>
