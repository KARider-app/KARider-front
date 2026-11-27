<script setup lang="ts">
import { computed, ref } from 'vue'
import { Car, CircleCheck } from 'lucide-vue-next'
import { z } from 'zod'
import { useAuthStore } from '@/features/auth/application/useAuthStore'
import { vehiculoEsquema } from '@/features/auth/domain/esquemas'
import FormVehiculo, { type DatosVehiculo } from '@/features/auth/ui/components/FormVehiculo.vue'
import AlertMessage from '@/shared/components/AlertMessage.vue'
import BaseButton from '@/shared/components/BaseButton.vue'
import RoleSelector from '@/shared/components/RoleSelector.vue'
import { mensajeDeError } from '@/shared/composables/useApiError'
import { useFormulario } from '@/shared/composables/useFormulario'
import { perfilApi } from '../../api/perfilApi'

/**
 * HU-17: cambiar entre usar KARider como pasajero o como conductor. Si la cuenta aún no tiene
 * vehículo, aquí lo registra y queda como conductor sin crear otra cuenta.
 */
const emit = defineEmits<{ 'ahora-conductor': [] }>()
const auth = useAuthStore()

const modo = computed({
  get: () => auth.modoActivo,
  set: (m) => auth.cambiarModo(m),
})

const mostrarFormulario = ref(false)
const exito = ref('')

const { valores, errores, errorGeneral, enviando, validarCampo, enviar } = useFormulario(
  z.object({ vehiculo: vehiculoEsquema }),
  { vehiculo: { modelo: '', color: '', anio: '', placas: '', capacidad: '' } as DatosVehiculo },
)

function registrar() {
  exito.value = ''
  return enviar(
    async ({ vehiculo }) => {
      await perfilApi.registrarVehiculo({ ...vehiculo, placas: vehiculo.placas.toUpperCase() })
      await auth.convertirEnConductor()
      mostrarFormulario.value = false
      exito.value =
        '¡Listo! Ya puedes publicar rutas. Cambia de modo cuando quieras viajar como pasajero.'
      emit('ahora-conductor')
    },
    {
      campoPorCodigo: { VEHICULO_PLACAS_DUPLICADAS: 'vehiculo.placas' },
      // La API nombra los campos sin el prefijo «vehiculo.» que usa el formulario.
      alError: (e) => {
        const llaves = Object.keys(e.errors)
        if (llaves.length === 0) return false
        errores.value = Object.fromEntries(
          llaves.map((k) => [`vehiculo.${k}`, e.errors[k]?.[0] ?? e.detail]),
        )
        return true
      },
    },
  )
}
</script>

<template>
  <section
    class="p-4 rounded-2xl bg-white border border-[#C9DCE8] shadow-xs space-y-3"
    aria-labelledby="modo-uso-titulo"
  >
    <div class="flex items-center gap-2">
      <Car class="w-4 h-4 text-[#0284C7]" aria-hidden="true" />
      <h2 id="modo-uso-titulo" class="text-sm font-bold text-[#1D2D44] font-sans">Modo de uso</h2>
    </div>

    <AlertMessage v-if="exito" tipo="exito">{{ exito }}</AlertMessage>

    <template v-if="auth.esConductor">
      <RoleSelector v-model="modo" etiqueta="Usar KARider como:" />
      <p class="text-[11px] text-[#4B5563]">
        <template v-if="auth.modoConductor">
          Ves «Publicar» y el mapa de tus rutas. Cambia a Pasajero para buscar viajes y ver tus
          reservas.
        </template>
        <template v-else>
          Ves tus reservas como pasajero. Cambia a Conductor para publicar o administrar tus rutas.
        </template>
      </p>
    </template>

    <template v-else>
      <p class="text-xs text-[#4B5563]">
        Usas KARider como <strong>pasajero</strong>. ¿Vas a llevar tu carro? Registra tu vehículo y
        podrás publicar rutas con la misma cuenta.
      </p>
      <BaseButton v-if="!mostrarFormulario" variante="secundario" @click="mostrarFormulario = true">
        Quiero ser conductor
      </BaseButton>
      <form v-else class="space-y-3" novalidate @submit.prevent="registrar">
        <FormVehiculo v-model="valores.vehiculo" :errores="errores" @validar="validarCampo" />
        <AlertMessage v-if="errorGeneral" tipo="error">{{
          mensajeDeError(errorGeneral)
        }}</AlertMessage>
        <div class="flex gap-2">
          <BaseButton type="submit" :cargando="enviando">
            <CircleCheck class="w-4 h-4" aria-hidden="true" />
            <span>Registrar vehículo</span>
          </BaseButton>
          <BaseButton variante="texto" @click="mostrarFormulario = false">Cancelar</BaseButton>
        </div>
      </form>
    </template>
  </section>
</template>
