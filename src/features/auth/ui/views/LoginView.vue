<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { env } from '@/core/config/env'
import AlertMessage from '@/shared/components/AlertMessage.vue'
import BaseButton from '@/shared/components/BaseButton.vue'
import BaseInput from '@/shared/components/BaseInput.vue'
import PasswordInput from '@/shared/components/PasswordInput.vue'
import RoleSelector from '@/shared/components/RoleSelector.vue'
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
  <main class="pantalla">
    <header>
      <h1 class="pantalla__titulo">Iniciar sesión</h1>
      <p class="pantalla__subtitulo">Accede con tu cuenta {{ env.appNombre }} de la UTTT</p>
    </header>

    <AlertMessage v-if="verificado" tipo="exito">
      Tu correo quedó verificado. Ya puedes iniciar sesión.
    </AlertMessage>
    <AlertMessage v-if="restablecida" tipo="exito">
      Tu contraseña se actualizó. Inicia sesión con la nueva.
    </AlertMessage>

    <form class="formulario tarjeta" novalidate @submit.prevent="iniciarSesion">
      <RoleSelector v-model="valores.rol" etiqueta="¿Cómo quieres entrar?" />

      <BaseInput
        v-model="valores.correoInstitucional"
        etiqueta="Correo institucional"
        :error="errores.correoInstitucional"
        type="email"
        inputmode="email"
        autocomplete="username"
        autocapitalize="off"
        :placeholder="`matricula@${env.dominio}`"
        @blur="validarCampo('correoInstitucional')"
      />
      <PasswordInput v-model="valores.password" etiqueta="Contraseña" :error="errores.password" />

      <div class="opciones-login">
        <label class="recordar">
          <input v-model="valores.recordarme" type="checkbox" />
          Recordar mis credenciales
        </label>
        <RouterLink :to="{ name: 'recuperar' }">¿Olvidaste tu contraseña?</RouterLink>
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
          <RouterLink v-if="codigoError === 'AUTH_CUENTA_BLOQUEADA'" :to="{ name: 'recuperar' }">
            Recuperar mi contraseña
          </RouterLink>
        </template>
      </AlertMessage>

      <BaseButton type="submit" bloque :cargando="enviando" :disabled="espera.activo.value">
        {{ espera.activo.value ? `Espera ${espera.restante.value} s` : 'INICIAR SESIÓN' }}
      </BaseButton>
    </form>

    <p class="centrado">
      ¿Aún no tienes cuenta?
      <RouterLink :to="{ name: 'registro', query: { rol: valores.rol } }">Regístrate</RouterLink>
    </p>
  </main>
</template>

<style scoped>
.opciones-login {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--espacio-2);
  font-size: 0.875rem;
}

.recordar {
  display: inline-flex;
  align-items: center;
  gap: var(--espacio-2);
  cursor: pointer;
}

.recordar input {
  width: 18px;
  height: 18px;
  accent-color: var(--color-primario);
}
</style>
