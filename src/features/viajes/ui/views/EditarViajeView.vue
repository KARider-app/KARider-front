<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { aFechaInput, sumarDias } from '@/core/utils/fechas'
import AlertMessage from '@/shared/components/AlertMessage.vue'
import BaseButton from '@/shared/components/BaseButton.vue'
import BaseInput from '@/shared/components/BaseInput.vue'
import BaseSelect from '@/shared/components/BaseSelect.vue'
import EncabezadoPantalla from '@/shared/components/EncabezadoPantalla.vue'
import TarjetaSeccion from '@/shared/components/TarjetaSeccion.vue'
import { Bell, Calendar, Clock, MapPin, Save } from 'lucide-vue-next'
import { mensajeDeError } from '@/shared/composables/useApiError'
import { useCatalogosStore } from '@/features/catalogos/application/useCatalogosStore'
import { useEditarViaje } from '../../application/useEditarViaje'
import { DIAS_MAX_ANTICIPACION } from '../../domain/esquemas'
import CalculadoraAporte from '../components/CalculadoraAporte.vue'
import ParadasChips from '../components/ParadasChips.vue'
import SelectorAsientos from '../components/SelectorAsientos.vue'

const MAX_NOTAS = 500

const route = useRoute()
const router = useRouter()
const catalogos = useCatalogosStore()
const id = String(route.params.id)

const {
  viaje,
  cargando,
  errorCarga,
  reservados,
  editable,
  hayCambios,
  cambiosRelevantes,
  formulario,
  cargar,
  guardar,
} = useEditarViaje()
const { valores, errores, errorGeneral, enviando, validarCampo } = formulario

const hoy = new Date()
const fechaMin = aFechaInput(hoy)
const fechaMax = aFechaInput(sumarDias(hoy, DIAS_MAX_ANTICIPACION))

const opcionesPunto = computed(() =>
  catalogos.puntosEncuentro.map((p) => ({ valor: p.id, texto: p.nombre })),
)
const puntoSeleccionado = computed(() =>
  catalogos.puntosEncuentro.find((p) => p.id === Number(valores.value.puntoEncuentroId)),
)

onMounted(() => {
  void catalogos.cargarPuntosEncuentro()
  void cargar(id)
})

async function guardarCambios() {
  if (await guardar()) {
    await router.push({ name: 'viaje', params: { id }, query: { editado: '1' } })
  }
}
</script>

<template>
  <main class="flex flex-col min-h-full flex-1 bg-[#F3F7FA] text-[#1D2D44]">
    <EncabezadoPantalla
      titulo="Editar Publicación"
      :volver="{ name: 'viaje', params: { id } }"
      volver-texto="Cancelar y volver"
    >
      <p class="text-xs text-[#C9DCE8]">
        Actualiza los datos del viaje. Las modificaciones notificarán automáticamente a tus
        pasajeros.
      </p>
    </EncabezadoPantalla>

    <div class="p-5 space-y-4 flex-1">
      <p v-if="cargando && !viaje" class="py-8 text-center text-xs text-[#4B5563]">
        Cargando viaje…
      </p>

      <AlertMessage v-if="errorCarga" tipo="error">{{ mensajeDeError(errorCarga) }}</AlertMessage>

      <AlertMessage v-if="viaje && !editable" tipo="aviso">
        Este viaje ya no se puede editar.
        <RouterLink :to="{ name: 'viaje', params: { id } }" class="font-bold underline">
          Volver al detalle
        </RouterLink>
      </AlertMessage>

      <form v-if="viaje && editable" class="space-y-4" novalidate @submit.prevent="guardarCambios">
        <!-- Aviso clave de la HU-09: los cambios importantes se notifican a los pasajeros. -->
        <AlertMessage v-if="reservados > 0 && cambiosRelevantes" tipo="aviso">
          Este viaje ya tiene {{ reservados }}
          {{ reservados === 1 ? 'asiento reservado' : 'asientos reservados' }}. Al guardar, los
          pasajeros serán notificados de los cambios.
        </AlertMessage>

        <TarjetaSeccion
          titulo="Punto de Encuentro y Horario"
          :icono="MapPin"
          color-icono="text-[#0284C7]"
        >
          <BaseSelect
            v-model="valores.puntoEncuentroId"
            etiqueta="Punto de Encuentro Campus UTTT:"
            placeholder="Selecciona el punto de encuentro"
            suave
            :opciones="opcionesPunto"
            :error="errores.puntoEncuentroId"
            :ayuda="puntoSeleccionado?.descripcion"
            @change="validarCampo('puntoEncuentroId')"
          />
          <BaseInput
            v-model="valores.destino"
            etiqueta="Destino final"
            suave
            :error="errores.destino"
            maxlength="150"
            @blur="validarCampo('destino')"
          />
          <ParadasChips v-model="valores.paradas" :error="errores.paradas" />
          <div class="grid grid-cols-2 gap-3">
            <BaseInput
              v-model="valores.fecha"
              etiqueta="Fecha"
              suave
              :icono="Calendar"
              type="date"
              :min="fechaMin"
              :max="fechaMax"
              :error="errores.fecha"
            />
            <BaseInput
              v-model="valores.hora"
              etiqueta="Hora de salida"
              suave
              :icono="Clock"
              type="time"
              :error="errores.hora"
            />
          </div>
          <SelectorAsientos
            v-model="valores.asientos"
            :capacidad="4"
            :minimo="Math.max(reservados, 1)"
            :error="errores.asientos"
          />
        </TarjetaSeccion>

        <CalculadoraAporte
          v-model="valores.gastoTotal"
          numero=""
          :asientos="valores.asientos"
          :error="errores.gastoTotal"
          @validar="validarCampo('gastoTotal')"
        />

        <TarjetaSeccion titulo="Aviso en Tiempo Real a Pasajeros" :icono="Bell">
          <p class="text-[11px] text-[#4B5563]">
            Estas notas las verán los compañeros con asiento reservado
            <template v-if="reservados > 0">({{ reservados }} reservados)</template>.
          </p>
          <div>
            <label for="notas" class="sr-only">Notas para los pasajeros</label>
            <textarea
              id="notas"
              v-model="valores.notas"
              rows="3"
              :maxlength="MAX_NOTAS"
              class="w-full p-2.5 text-xs rounded-xl border bg-[#F8FAFC] outline-none resize-none focus:border-[#1D2D44]"
              :class="errores.notas ? 'border-red-300' : 'border-[#C9DCE8]'"
              :aria-invalid="!!errores.notas"
            ></textarea>
            <p class="flex justify-between gap-2 text-[10px]">
              <span v-if="errores.notas" class="font-semibold text-red-600" role="alert">
                {{ errores.notas }}
              </span>
              <span class="ml-auto text-[#4B5563]">{{ valores.notas.length }}/{{ MAX_NOTAS }}</span>
            </p>
          </div>
        </TarjetaSeccion>

        <AlertMessage v-if="errorGeneral" tipo="error">
          {{ mensajeDeError(errorGeneral) }}
        </AlertMessage>

        <div class="pt-2 space-y-2">
          <BaseButton
            type="submit"
            bloque
            class="!font-bold"
            :cargando="enviando"
            :disabled="!hayCambios || enviando"
          >
            <Save v-if="!enviando" class="w-4 h-4" aria-hidden="true" />
            <span>Guardar Cambios y Notificar</span>
          </BaseButton>
          <RouterLink
            :to="{ name: 'viaje', params: { id } }"
            class="block w-full py-2 rounded-xl text-xs font-semibold text-center text-[#4B5563] hover:text-[#1D2D44]"
          >
            Cancelar
          </RouterLink>
        </div>
      </form>
    </div>
  </main>
</template>
