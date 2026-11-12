<script setup lang="ts">
// Importa funciones reactivas y el ciclo de vida de Vue.
import { computed, onMounted, ref } from 'vue'

// Permite acceder de forma reactiva al store de Pinia.
import { storeToRefs } from 'pinia'

// Permite navegar entre las distintas pantallas.
import { useRouter } from 'vue-router'

// Importa el tipo que representa los errores recibidos de la API.
import type { ApiError } from '@/core/http/apiError'

// Componentes reutilizables para mensajes y botones.
import AlertMessage from '@/shared/components/AlertMessage.vue'
import BaseButton from '@/shared/components/BaseButton.vue'
import EncabezadoPantalla from '@/shared/components/EncabezadoPantalla.vue'
import TarjetaSeccion from '@/shared/components/TarjetaSeccion.vue'
import { Car, Check } from 'lucide-vue-next'

// Convierte errores técnicos en mensajes comprensibles para el usuario.
import { mensajeDeError } from '@/shared/composables/useApiError'

// Administra los valores, la validación y el envío del formulario.
import { useFormulario } from '@/shared/composables/useFormulario'

// Store que conserva y envía los datos del viaje.
import { usePublicarViajeStore } from '../../application/usePublicarViajeStore'

// Esquema con las reglas de validación del segundo paso.
import { paso2Esquema } from '../../domain/esquemas'

// Componentes para calcular el aporte y mostrar la información del vehículo.
import CalculadoraAporte from '../components/CalculadoraAporte.vue'
import TarjetaVehiculo from '../components/TarjetaVehiculo.vue'

// Define el máximo de caracteres permitidos para las notas.
const MAX_NOTAS = 500

// Identifica los campos que pertenecen al formulario del segundo paso.
const CAMPOS_PASO_2 = ['gastoTotal', 'notas', 'vehiculoId']

// Códigos de error que indican problemas con los datos del primer paso.
const CODIGOS_PASO_1 = [
  'VIAJE_FECHA_PASADA',
  'VEHICULO_CAPACIDAD_INSUFICIENTE',
  'VIAJE_PUNTO_ENCUENTRO_INVALIDO',
]

// Inicializa el enrutador y el store de publicación.
const router = useRouter()
const store = usePublicarViajeStore()

// Obtiene una referencia reactiva al borrador del viaje.
const { borrador } = storeToRefs(store)

// Configura el formulario con sus valores, errores y funciones de envío.
const { valores, errores, errorGeneral, enviando, enviar, validarCampo } = useFormulario(
  paso2Esquema,
  borrador,
)

// Conserva el error relacionado con los datos del paso 1, si existe.
const errorPaso1 = ref<ApiError | null>(null)

// Indica si la acción actual consiste en publicar o guardar un borrador.
const accion = ref<'publicar' | 'borrador' | null>(null)

// Obtiene los mensajes individuales que devuelve el error de la API.
const mensajesPaso1 = computed(() => {
  const e = errorPaso1.value

  // Si no hay error del primer paso, no se muestran mensajes.
  if (!e) return []

  // Agrupa los mensajes de validación de todos los campos.
  const mensajes = Object.values(e.errors).flat()

  // Si no hay errores por campo, utiliza el detalle general del error.
  return mensajes.length ? mensajes : [e.detail]
})

// Al cargar la pantalla, verifica que el primer paso esté completo.
onMounted(() => {
  // Si faltan los datos del primer paso, regresa a la pantalla anterior.
  if (!store.paso1Completo) {
    void router.replace({ name: 'publicar-1' })
    return
  }

  // Si los vehículos todavía no se han cargado, solicita su información.
  if (!store.vehiculosCargados) void store.cargarVehiculos()
})

// Gestiona el envío para publicar el viaje o guardarlo como borrador.
function guardar(publicar: boolean) {
  // Limpia los errores anteriores antes de realizar una nueva acción.
  errorPaso1.value = null

  // Registra la acción seleccionada para controlar la interfaz.
  accion.value = publicar ? 'publicar' : 'borrador'

  // Valida el formulario y ejecuta la operación correspondiente.
  return enviar(
    async (datos) => {
      // Envía los datos al store para guardar o publicar el viaje.
      const viaje = await store.enviar(datos, publicar)

      // Redirige a la pantalla correspondiente según el resultado.
      await (publicar
        ? // Si se publicó, abre el detalle del viaje.
          router.push({
            name: 'viaje',
            params: { id: viaje.id },
            query: { publicado: '1' },
          })
        : // Si se guardó como borrador, abre la lista de borradores.
          router.push({
            name: 'borradores',
            query: { guardado: '1' },
          }))
    },
    {
      // Intercepta los errores para identificar si corresponden al paso 1.
      alError: (e) => {
        // Obtiene los nombres de los campos que reportaron errores.
        const llaves = Object.keys(e.errors)

        // Comprueba si el error es del paso 1 por su código
        // o porque afecta campos que no pertenecen al paso 2.
        const esDelPaso1 =
          CODIGOS_PASO_1.includes(e.code) || llaves.some((k) => !CAMPOS_PASO_2.includes(k))

        // Conserva el error para mostrarlo y permitir corregir el paso 1.
        if (esDelPaso1) errorPaso1.value = e

        // Informa si el error fue reconocido como perteneciente al paso 1.
        return esDelPaso1
      },
    },
  )
}
</script>

<template>
  <!-- Contenedor principal de la pantalla. -->
  <main class="flex flex-col min-h-full flex-1 bg-[#F3F7FA] text-[#1D2D44]">
    <EncabezadoPantalla
      titulo="Publicar Ruta (Conductor)"
      :volver="{ name: 'publicar-1' }"
      etiqueta="Paso 2 de 2"
    >
      <p class="text-xs text-[#C9DCE8]">Calcula cuánto aporta cada pasajero y publica tu viaje.</p>
    </EncabezadoPantalla>

    <!-- El formulario publica el viaje cuando se envía. -->
    <form class="p-5 space-y-4 flex-1" novalidate @submit.prevent="guardar(true)">
      <!-- Calcula el aporte usando el gasto total y los asientos disponibles. -->
      <CalculadoraAporte
        v-model="valores.gastoTotal"
        :asientos="valores.asientos"
        :error="errores.gastoTotal"
        @validar="validarCampo('gastoTotal')"
      />

      <!-- Sección que muestra o permite seleccionar el vehículo, y las notas. -->
      <TarjetaSeccion titulo="4. Vehículo Registrado" :icono="Car">
        <!-- Informa que los vehículos todavía se están cargando. -->
        <p v-if="!store.vehiculosCargados && !store.errorVehiculos" class="text-xs text-[#4B5563]">
          Cargando tu vehículo…
        </p>

        <!-- Si solo hay un vehículo disponible, muestra su información. -->
        <TarjetaVehiculo
          v-else-if="store.vehiculos.length === 1 && store.vehiculo"
          v-bind="store.vehiculo"
        />

        <!-- Si hay varios vehículos, permite seleccionar uno. -->
        <fieldset v-else-if="store.vehiculos.length > 1" class="space-y-2">
          <legend class="sr-only">Elige el vehículo del viaje</legend>

          <!-- Genera una opción seleccionable para cada vehículo. -->
          <label
            v-for="v in store.vehiculos"
            :key="v.id"
            class="vehiculos__opcion block rounded-xl cursor-pointer transition-all has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#0284C7]"
            :class="
              valores.vehiculoId === v.id ? 'ring-2 ring-[#1D2D44]' : 'opacity-80 hover:opacity-100'
            "
          >
            <!-- Guarda el identificador del vehículo seleccionado. -->
            <input v-model="valores.vehiculoId" type="radio" :value="v.id" class="sr-only" />

            <!-- Nombre accesible de la opción: el lector de pantalla lo anuncia al elegir el vehículo. -->
            <span class="sr-only">
              {{ v.modelo }} {{ v.color }}, placas {{ v.placas }},
              {{ v.verificado ? 'verificado' : 'sin verificar' }}
            </span>

            <!-- Presenta los datos del vehículo de esta opción (solo visual; el texto accesible está arriba). -->
            <span class="vehiculos__tarjeta block" aria-hidden="true">
              <TarjetaVehiculo v-bind="v" />
            </span>
          </label>
        </fieldset>

        <!-- Avisa si terminó la carga y no hay vehículos activos. -->
        <AlertMessage v-else-if="store.vehiculosCargados" tipo="aviso">
          No tienes vehículos activos registrados.
        </AlertMessage>

        <!-- Muestra errores que ocurrieron al cargar los vehículos. -->
        <AlertMessage v-if="store.errorVehiculos" tipo="error">
          {{ mensajeDeError(store.errorVehiculos) }}
        </AlertMessage>

        <!-- Indicaciones adicionales a los pasajeros. -->
        <div>
          <label for="notas" class="block text-xs font-semibold text-[#3E5C76] mb-1">
            Indicaciones o Notas para los Pasajeros
          </label>
          <textarea
            id="notas"
            v-model="valores.notas"
            rows="2"
            :maxlength="MAX_NOTAS"
            placeholder="Ej. Espacio en cajuela, salgo puntual terminando clase..."
            class="w-full p-2.5 text-xs rounded-xl border bg-white outline-none resize-none focus:border-[#1D2D44]"
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

      <!-- Muestra errores que deben corregirse en el primer paso. -->
      <AlertMessage v-if="errorPaso1" tipo="error">
        <span v-for="m in mensajesPaso1" :key="m">{{ m }}</span>

        <!-- Permite regresar a corregir la ruta o el horario. -->
        <RouterLink :to="{ name: 'publicar-1' }" class="font-bold underline">
          Corregir ruta y horario
        </RouterLink>
      </AlertMessage>

      <!-- Muestra errores generales del envío del formulario. -->
      <AlertMessage v-if="errorGeneral" tipo="error">
        {{ mensajeDeError(errorGeneral) }}
      </AlertMessage>

      <div class="pt-2 space-y-2">
        <!-- Botón principal para publicar el viaje. -->
        <BaseButton
          type="submit"
          bloque
          class="!font-bold"
          :cargando="enviando && accion === 'publicar'"
          :disabled="enviando"
        >
          <Check v-if="!(enviando && accion === 'publicar')" class="w-4 h-4" aria-hidden="true" />
          <span>Publicar Ruta en Campus UTTT</span>
        </BaseButton>

        <!-- Permite guardar los datos sin publicar todavía el viaje. -->
        <button
          type="button"
          class="w-full py-2 rounded-xl text-xs font-semibold text-[#4B5563] hover:text-[#1D2D44] disabled:opacity-55 flex items-center justify-center gap-2"
          :disabled="enviando"
          @click="guardar(false)"
        >
          <span
            v-if="enviando && accion === 'borrador'"
            class="w-3.5 h-3.5 border-2 border-current border-r-transparent rounded-full animate-spin"
            aria-hidden="true"
          />
          Cancelar y Guardar Borrador
        </button>

        <!-- Enlace para regresar al primer paso sin enviar el formulario. -->
        <RouterLink
          :to="{ name: 'publicar-1' }"
          class="block text-center text-xs text-[#3E5C76] hover:underline"
        >
          Volver al paso 1
        </RouterLink>
      </div>
    </form>
  </main>
</template>
