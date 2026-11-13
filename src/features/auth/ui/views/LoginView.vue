<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { env } from '@/core/config/env'
import AlertMessage from '@/shared/components/AlertMessage.vue'
import BaseButton from '@/shared/components/BaseButton.vue'
import BaseInput from '@/shared/components/BaseInput.vue'
import PasswordInput from '@/shared/components/PasswordInput.vue'
import RoleSelector from '@/shared/components/RoleSelector.vue'
import LogoKarider from '@/shared/components/LogoKarider.vue'
import DisenoAuth from '../components/DisenoAuth.vue'
import { ArrowRight, Mail, ShieldCheck, UserPlus } from 'lucide-vue-next'
import { mensajeDeError } from '@/shared/composables/useApiError'
import { useCountdown } from '@/shared/composables/useCountdown'
import { useFormulario } from '@/shared/composables/useFormulario'
import { useAuthStore } from '../../application/useAuthStore'
import { loginEsquema } from '../../domain/esquemas'
import type { RolIngreso } from '../../domain/tipos'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const espera = useCountdown()

const correoInicial = typeof route.query.correo === 'string' ? route.query.correo : ''
const verificado = route.query.verificado === '1'
const restablecida = route.query.restablecida === '1'

const { valores, errores, errorGeneral, enviando, validarCampo, enviar } = useFormulario(
  loginEsquema,
  {
    correoInstitucional: correoInicial,
    password: '',
    rol: 'Pasajero' as RolIngreso,
    recordarme: false,
  },
)

const codigoError = computed(() => errorGeneral.value?.code)

/** Solo rutas internas: evita redirecciones abiertas con ?volver=https://… */
function destinoSeguro(): string {
  const volver = route.query.volver
  return typeof volver === 'string' && volver.startsWith('/') && !volver.startsWith('//')
    ? volver
    : '/'
}

function iniciarSesion() {
  return enviar(
    async (datos) => {
      await auth.login(datos)
      await router.replace(destinoSeguro())
    },
    {
      alError: (e) => {
        if (e.code === 'AUTH_CORREO_NO_VERIFICADO') {
          void router.push({
            name: 'verificar',
            query: { correo: valores.value.correoInstitucional.trim() },
          })
          return true
        }
        if (e.code === 'LIMITE_SOLICITUDES_EXCEDIDO') espera.iniciar(e.retryAfter ?? 60)
        return false
      },
    },
  )
}

function entrarComoPasajero() {
  valores.value.rol = 'Pasajero'
  void iniciarSesion()
}
</script>

<template>
  <DisenoAuth>
    <main class="flex flex-col min-h-full flex-1 bg-white text-[#1D2D44]">
      <header
        class="pt-6 px-6 pb-5 bg-gradient-to-b from-[#EAF2F8] to-white border-b border-[#C9DCE8]/60 flex flex-col items-center text-center"
      >
        <div class="w-full flex items-center justify-between mb-3">
          <span
            class="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#1D2D44] text-white"
          >
            Login Institucional
          </span>
          <div
            class="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200"
          >
            <ShieldCheck class="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
            <span>UTTT 2026</span>
          </div>
        </div>
        <div class="my-1 py-1 lg:hidden">
          <LogoKarider variant="full" size="lg" />
        </div>
        <h1 class="text-xl font-black text-[#1D2D44] mt-2 tracking-tight">Iniciar Sesión</h1>
        <p class="text-xs text-[#3E5C76] max-w-xs mt-0.5">
          Red de Carpooling Universitario de la <strong class="text-[#1D2D44]">UTTT</strong>
        </p>
      </header>

      <div class="p-5 flex-1 flex flex-col justify-between max-w-md mx-auto w-full">
        <div class="space-y-3 mb-4" v-if="verificado || restablecida">
          <AlertMessage v-if="verificado" tipo="exito">
            Tu correo quedó verificado. Ya puedes iniciar sesión.
          </AlertMessage>
          <AlertMessage v-if="restablecida" tipo="exito">
            Tu contraseña se actualizó. Inicia sesión con la nueva.
          </AlertMessage>
        </div>

        <form class="space-y-4" novalidate @submit.prevent="iniciarSesion">
          <RoleSelector v-model="valores.rol" etiqueta="Ingresar con rol de:" />

          <div>
            <BaseInput
              v-model="valores.correoInstitucional"
              :etiqueta="`Correo Institucional (@${env.dominio})`"
              :error="errores.correoInstitucional"
              :icono="Mail"
              type="email"
              inputmode="email"
              autocomplete="username"
              autocapitalize="off"
              :placeholder="`tunombre.apellido@${env.dominio}`"
              @blur="validarCampo('correoInstitucional')"
            />
            <span v-if="!errores.correoInstitucional" class="text-[10px] text-[#4B5563] mt-1 block">
              🔒 Verificación activa: solo dominios oficiales de la universidad.
            </span>
          </div>

          <PasswordInput
            v-model="valores.password"
            etiqueta="Contraseña Institucional"
            :error="errores.password"
            placeholder="Contraseña del portal UTTT"
          >
            <template #etiqueta-extra>
              <RouterLink
                :to="{ name: 'recuperar' }"
                class="text-[11px] font-semibold text-[#0284C7] hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </RouterLink>
            </template>
          </PasswordInput>

          <div class="flex items-center justify-between text-xs pt-0.5">
            <label class="flex items-center gap-2 cursor-pointer text-[#4B5563]">
              <input v-model="valores.recordarme" type="checkbox" class="rounded" />
              <span>Recordar mis credenciales</span>
            </label>
          </div>

          <AlertMessage v-if="errorGeneral" tipo="error">
            <template v-if="codigoError === 'AUTH_ROL_NO_AUTORIZADO'">
              <span>Tu cuenta no es de conductor. Registra un vehículo o entra como pasajero.</span>
              <BaseButton variante="secundario" @click="entrarComoPasajero">
                Entrar como Pasajero
              </BaseButton>
            </template>
            <template v-else>
              <span>{{ mensajeDeError(errorGeneral) }}</span>
              <RouterLink
                v-if="codigoError === 'AUTH_CUENTA_BLOQUEADA'"
                :to="{ name: 'recuperar' }"
                class="font-bold underline"
              >
                Recuperar mi contraseña
              </RouterLink>
            </template>
          </AlertMessage>

          <BaseButton type="submit" bloque :cargando="enviando" :disabled="espera.activo.value">
            <template v-if="espera.activo.value">Espera {{ espera.restante.value }} s</template>
            <template v-else>
              <span>Iniciar Sesión en {{ env.appNombre }}</span>
              <ArrowRight class="w-4 h-4" aria-hidden="true" />
            </template>
          </BaseButton>
        </form>

        <div class="mt-4 pt-3 border-t border-[#EDEDED] text-center">
          <p class="text-xs text-[#4B5563]">
            ¿Eres nuevo en la Universidad Tecnológica de Tula-Tepeji?
          </p>
          <RouterLink
            :to="{ name: 'registro', query: { rol: valores.rol } }"
            class="mt-2 w-full py-2.5 px-4 rounded-xl border-2 border-[#1D2D44] text-[#1D2D44] font-bold text-xs hover:bg-[#EAF2F8] transition-all flex items-center justify-center gap-2"
          >
            <UserPlus class="w-4 h-4" aria-hidden="true" />
            <span>Crear Cuenta / Registrarme con Correo UTTT</span>
          </RouterLink>
        </div>
      </div>
    </main>
  </DisenoAuth>
</template>
