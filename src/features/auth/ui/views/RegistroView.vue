<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { env } from '@/core/config/env'
import AlertMessage from '@/shared/components/AlertMessage.vue'
import BaseButton from '@/shared/components/BaseButton.vue'
import RoleSelector from '@/shared/components/RoleSelector.vue'
import { mensajeDeError } from '@/shared/composables/useApiError'
import { useFormulario } from '@/shared/composables/useFormulario'
import { useCatalogosStore } from '@/features/catalogos/application/useCatalogosStore'
import { campoPorCodigoRegistro, cuenta } from '../../application/cuenta'
import { registroEsquema } from '../../domain/esquemas'
import type { RolIngreso } from '../../domain/tipos'
import FormDatosPersonales, { type DatosPersonales } from '../components/FormDatosPersonales.vue'
import FormVehiculo, { type DatosVehiculo } from '../components/FormVehiculo.vue'

const route = useRoute()
const router = useRouter()
const catalogos = useCatalogosStore()

interface RegistroValores extends DatosPersonales {
  rol: RolIngreso
  vehiculo: DatosVehiculo
}

const { valores, errores, errorGeneral, enviando, validarCampo, enviar } = useFormulario(
  registroEsquema,
  {
    rol: route.query.rol === 'Conductor' ? 'Conductor' : 'Pasajero',
    nombreCompleto: '',
    matricula: '',
    telefono: '',
    carreraId: '',
    cuatrimestre: '',
    correoInstitucional: '',
    password: '',
    confirmarPassword: '',
    vehiculo: { modelo: '', color: '', anio: '', placas: '', capacidad: '' },
  } as RegistroValores,
  // El bloque del vehículo solo cuenta si el rol es Conductor (P4)
  { preparar: (v) => ({ ...v, vehiculo: v.rol === 'Conductor' ? v.vehiculo : undefined }) },
)

const esConductor = computed(() => valores.value.rol === 'Conductor')
/** Muestra el enlace «Iniciar sesión» junto al error de correo duplicado. */
const correoDuplicado = ref(false)

// Binding dinámico: una ruta estática aquí haría que el compilador de Vue la trate
// como un asset a resolver en build, y falla en Windows por ser absoluta a public/.
const iconoSrc = '/logo-karider.png'

onMounted(catalogos.cargarCarreras)

function registrar() {
  correoDuplicado.value = false
  return enviar(
    async (datos) => {
      const r = await cuenta.registrar(datos)
      await router.push({
        name: 'verificar',
        query: { correo: r.correoInstitucional, enviado: '1' },
      })
    },
    {
      campoPorCodigo: campoPorCodigoRegistro,
      alError: (e) => {
        correoDuplicado.value = e.code === 'USUARIO_CORREO_DUPLICADO'
        return false
      },
    },
  )
}
</script>

<template>
  <main class="pantalla">
    <header class="encabezado">
      <img class="encabezado__icono" :src="iconoSrc" alt="" aria-hidden="true" width="64" height="64" />
      <h1 class="pantalla__titulo">Registro</h1>
      <p class="pantalla__subtitulo">Crea tu cuenta</p>
    </header>
    <hr class="separador" />

    <form class="formulario" novalidate @submit.prevent="registrar">
      <RoleSelector v-model="valores.rol" etiqueta="¿Cómo usarás KARider principalmente?" />

      <div class="formulario tarjeta">
        <FormDatosPersonales
          v-model="valores"
          :errores="errores"
          :carreras="catalogos.carreras"
          :dominio="env.dominio"
          @validar="validarCampo"
        />
        <p v-if="correoDuplicado && errores.correoInstitucional" class="texto-suave">
          ¿Ya tienes cuenta?
          <RouterLink :to="{ name: 'login', query: { correo: valores.correoInstitucional } }">
            Iniciar sesión
          </RouterLink>
        </p>
      </div>

      <FormVehiculo
        v-if="esConductor"
        v-model="valores.vehiculo"
        :errores="errores"
        @validar="validarCampo"
      />

      <AlertMessage v-if="catalogos.error" tipo="aviso">
        No pudimos cargar las carreras. {{ mensajeDeError(catalogos.error) }}
      </AlertMessage>

      <AlertMessage tipo="info">
        Solo miembros activos de la universidad con dominio @{{ env.dominio }}
      </AlertMessage>

      <AlertMessage v-if="errorGeneral" tipo="error">
        {{ mensajeDeError(errorGeneral) }}
      </AlertMessage>

      <BaseButton type="submit" bloque :cargando="enviando">
        VERIFICAR CON CORREO INSTITUCIONAL
      </BaseButton>
    </form>

    <p class="centrado">
      ¿Ya tienes cuenta? <RouterLink :to="{ name: 'login' }">Inicia sesión</RouterLink>
    </p>
  </main>
</template>

<style scoped>
.encabezado {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--espacio-2);
  padding: var(--espacio-5) 0 var(--espacio-2);
  text-align: center;
}

.encabezado__icono {
  width: 64px;
  height: 64px;
  object-fit: contain;
}

.separador {
  height: 1px;
  margin: 0 calc(-1 * var(--espacio-4));
  border: 0;
  background: var(--color-borde);
}
</style>
