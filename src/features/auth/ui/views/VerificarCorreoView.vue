<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { env } from '@/core/config/env'
import { comoApiError } from '@/core/http/apiError'
import AlertMessage from '@/shared/components/AlertMessage.vue'
import BaseButton from '@/shared/components/BaseButton.vue'
import BaseInput from '@/shared/components/BaseInput.vue'
import LogoKarider from '@/shared/components/LogoKarider.vue'
import { ArrowLeft, CircleCheck, KeyRound, Mail, ShieldCheck } from 'lucide-vue-next'
import { mensajeDeError } from '@/shared/composables/useApiError'
import { useCountdown } from '@/shared/composables/useCountdown'
import { useFormulario } from '@/shared/composables/useFormulario'
import { CODIGOS_ERROR_VERIFICACION, cuenta } from '../../application/cuenta'
import { verificarCorreoEsquema } from '../../domain/esquemas'
import CodigoVerificacionInput from '../components/CodigoVerificacionInput.vue'

/** La API ignora reenvíos más frecuentes que esto. */
const SEGUNDOS_REENVIO = 60

const route = useRoute()
const router = useRouter()
const reenvio = useCountdown()

const correoQuery = typeof route.query.correo === 'string' ? route.query.correo : ''

const { valores, errores, errorGeneral, enviando, validarCampo, enviar } = useFormulario(
  verificarCorreoEsquema,
  { correoInstitucional: correoQuery, codigo: '' },
)

const avisoReenvio = ref('')
const reenviando = ref(false)

// Si venimos del registro, el código acaba de enviarse
if (route.query.enviado === '1') reenvio.iniciar(SEGUNDOS_REENVIO)

function verificar() {
  return enviar(
    async (datos) => {
      await cuenta.verificarCorreo(datos.correoInstitucional, datos.codigo)
      await router.replace({
        name: 'login',
        query: { correo: datos.correoInstitucional, verificado: '1' },
      })
    },
    {
      campoPorCodigo: Object.fromEntries(CODIGOS_ERROR_VERIFICACION.map((c) => [c, 'codigo'])),
      alError: (e) => {
        if (e.code !== 'AUTH_CORREO_YA_VERIFICADO') return false
        void router.replace({
          name: 'login',
          query: { correo: valores.value.correoInstitucional.trim() },
        })
        return true
      },
    },
  )
}

async function reenviar() {
  validarCampo('correoInstitucional')
  if (errores.value.correoInstitucional || reenvio.activo.value) return
  reenviando.value = true
  avisoReenvio.value = ''
  errorGeneral.value = null
  try {
    const r = await cuenta.reenviarCodigo(valores.value.correoInstitucional.trim())
    avisoReenvio.value = r.mensaje
    reenvio.iniciar(SEGUNDOS_REENVIO)
  } catch (err) {
    const e = comoApiError(err)
    errorGeneral.value = e
    if (e.retryAfter) reenvio.iniciar(e.retryAfter)
  } finally {
    reenviando.value = false
  }
}
</script>

<template>
  <main class="flex flex-col min-h-full flex-1 bg-white text-[#1D2D44]">
    <header
      class="pt-4 px-5 pb-3 bg-gradient-to-b from-[#EAF2F8] to-white border-b border-[#C9DCE8]/60 flex flex-col items-center text-center"
    >
      <div class="w-full flex items-center justify-between mb-2">
        <RouterLink
          :to="{ name: 'registro' }"
          class="text-xs text-[#3E5C76] hover:text-[#1D2D44] font-semibold flex items-center gap-1"
        >
          <ArrowLeft class="w-3.5 h-3.5" aria-hidden="true" />
          <span>Modificar registro</span>
        </RouterLink>
        <span
          class="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#1D2D44] text-white"
        >
          Registro UTTT
        </span>
      </div>
      <LogoKarider variant="horizontal" size="sm" class="my-1" />
      <h1 class="text-lg font-black text-[#1D2D44] mt-1">Verificación de Correo Estudiantil</h1>
      <p class="text-xs text-[#3E5C76]">
        Hemos enviado un token de seguridad a {{ correoQuery || `tu correo @${env.dominio}` }}
      </p>
    </header>

    <div class="p-5 flex-1 flex flex-col justify-between max-w-md mx-auto w-full">
      <form class="space-y-4 text-center py-4" novalidate @submit.prevent="verificar">
        <div
          class="w-16 h-16 rounded-2xl bg-[#EAF2F8] text-[#1D2D44] flex items-center justify-center mx-auto border-2 border-[#8AA9C4]"
        >
          <KeyRound class="w-8 h-8 text-[#0284C7]" aria-hidden="true" />
        </div>
        <div>
          <h2 class="text-sm font-bold text-[#1D2D44]">Código de Autenticación UTTT</h2>
          <p class="text-xs text-[#4B5563] mt-1">
            Ingresa los 6 dígitos que enviamos a tu buzón oficial institucional:
          </p>
          <span
            v-if="correoQuery"
            class="font-mono font-bold text-xs text-[#1D2D44] bg-[#EAF2F8] px-2 py-0.5 rounded mt-1 inline-block break-all"
          >
            {{ correoQuery }}
          </span>
        </div>

        <div v-if="!correoQuery" class="text-left">
          <BaseInput
            v-model="valores.correoInstitucional"
            etiqueta="Correo institucional"
            :error="errores.correoInstitucional"
            :icono="Mail"
            type="email"
            inputmode="email"
            autocomplete="email"
            autocapitalize="off"
            :placeholder="`tu.correo@${env.dominio}`"
            @blur="validarCampo('correoInstitucional')"
          />
        </div>

        <CodigoVerificacionInput v-model="valores.codigo" :error="errores.codigo" />

        <div
          class="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 text-left flex items-start gap-2"
        >
          <ShieldCheck class="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
          <span>
            Al validar tu correo institucional, tu cuenta obtendrá la insignia oficial de
            <strong>Usuario Verificado UTTT</strong> con acceso a carpooling seguro.
          </span>
        </div>

        <AlertMessage v-if="avisoReenvio" tipo="exito" class="text-left">{{
          avisoReenvio
        }}</AlertMessage>
        <AlertMessage v-if="errorGeneral" tipo="error" class="text-left">{{
          mensajeDeError(errorGeneral)
        }}</AlertMessage>

        <div class="space-y-2 pt-2">
          <BaseButton type="submit" bloque :cargando="enviando" class="font-black">
            <template v-if="enviando">Validando con Servidor UTTT...</template>
            <template v-else>
              <CircleCheck class="w-4 h-4 text-emerald-400" aria-hidden="true" />
              <span>Confirmar y Completar Registro</span>
            </template>
          </BaseButton>
          <BaseButton
            variante="texto"
            class="mx-auto !text-xs !text-[#3E5C76]"
            :cargando="reenviando"
            :disabled="reenvio.activo.value"
            @click="reenviar"
          >
            {{
              reenvio.activo.value
                ? `Reenviar código en ${reenvio.restante.value} s`
                : 'Reenviar código'
            }}
          </BaseButton>
        </div>
      </form>

      <div class="mt-4 pt-3 border-t border-[#EDEDED] text-center">
        <span class="text-xs text-[#4B5563]">¿Ya tienes tu cuenta universitaria? </span>
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
