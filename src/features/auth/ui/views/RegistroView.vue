<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { env } from '@/core/config/env'
import AlertMessage from '@/shared/components/AlertMessage.vue'
import BaseButton from '@/shared/components/BaseButton.vue'
import RoleSelector from '@/shared/components/RoleSelector.vue'
import LogoKarider from '@/shared/components/LogoKarider.vue'
import DisenoAuth from '../components/DisenoAuth.vue'
import { ArrowLeft, ArrowRight } from 'lucide-vue-next'
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
  <DisenoAuth>
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
            Registro UTTT
          </span>
        </div>
        <LogoKarider variant="horizontal" size="sm" class="my-1 lg:hidden" />
        <h1 class="text-lg font-black text-[#1D2D44] mt-1">Registro y Validación Institucional</h1>
        <p class="text-xs text-[#3E5C76]">Crea tu cuenta con tus credenciales de la Universidad</p>
      </header>

      <div class="p-5 flex-1 flex flex-col justify-between max-w-md mx-auto w-full">
        <form class="space-y-3" novalidate @submit.prevent="registrar">
          <RoleSelector
            v-model="valores.rol"
            corto
            :etiqueta="`¿Cómo usarás ${env.appNombre} principalmente?`"
          />

          <FormDatosPersonales
            v-model="valores"
            :errores="errores"
            :carreras="catalogos.carreras"
            :dominio="env.dominio"
            @validar="validarCampo"
          />
          <p v-if="correoDuplicado && errores.correoInstitucional" class="text-xs text-[#4B5563]">
            ¿Ya tienes cuenta?
            <RouterLink
              :to="{ name: 'login', query: { correo: valores.correoInstitucional } }"
              class="font-bold text-[#0284C7] hover:underline"
            >
              Iniciar sesión
            </RouterLink>
          </p>

          <FormVehiculo
            v-if="esConductor"
            v-model="valores.vehiculo"
            :errores="errores"
            @validar="validarCampo"
          />

          <AlertMessage v-if="catalogos.error" tipo="aviso">
            No pudimos cargar las carreras. {{ mensajeDeError(catalogos.error) }}
          </AlertMessage>

          <AlertMessage v-if="errorGeneral" tipo="error">
            {{ mensajeDeError(errorGeneral) }}
          </AlertMessage>

          <BaseButton type="submit" bloque :cargando="enviando" class="mt-2">
            <span>Verificar con Correo Institucional</span>
            <ArrowRight class="w-4 h-4" aria-hidden="true" />
          </BaseButton>
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
  </DisenoAuth>
</template>
