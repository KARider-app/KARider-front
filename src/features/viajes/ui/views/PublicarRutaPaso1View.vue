<script setup lang="ts">
// Importa las funciones de Vue para crear valores calculados
// y ejecutar acciones cuando el componente se monta.
import { computed, onMounted } from 'vue'

// Permite acceder de forma reactiva al estado del store de Pinia.
import { storeToRefs } from 'pinia'

// Permite navegar entre las pantallas de la aplicación.
import { useRouter } from 'vue-router'

// Funciones auxiliares para convertir fechas y sumar días.
import { aFechaInput, sumarDias } from '@/core/utils/fechas'

// Componentes reutilizables para mostrar mensajes, botones,
// campos de texto y listas de selección.
import AlertMessage from '@/shared/components/AlertMessage.vue'
import BaseButton from '@/shared/components/BaseButton.vue'
import BaseInput from '@/shared/components/BaseInput.vue'
import BaseSelect from '@/shared/components/BaseSelect.vue'
import EncabezadoPantalla from '@/shared/components/EncabezadoPantalla.vue'
import TarjetaSeccion from '@/shared/components/TarjetaSeccion.vue'
import { ArrowRight, Calendar, Clock, MapPin } from 'lucide-vue-next'

// Función que transforma errores técnicos en mensajes comprensibles.
import { mensajeDeError } from '@/shared/composables/useApiError'

// Composable que administra los valores, errores y validaciones del formulario.
import { useFormulario } from '@/shared/composables/useFormulario'

// Store que proporciona el catálogo de puntos de encuentro.
import { useCatalogosStore } from '@/features/catalogos/application/useCatalogosStore'

// Store que administra el proceso de publicación del viaje.
import { usePublicarViajeStore } from '../../application/usePublicarViajeStore'

// Define las reglas de validación y la anticipación máxima permitida.
import { DIAS_MAX_ANTICIPACION, paso1Esquema } from '../../domain/esquemas'

// Componentes para mostrar las paradas y seleccionar los asientos.
import ParadasChips from '../components/ParadasChips.vue'
import SelectorAsientos from '../components/SelectorAsientos.vue'

// Inicializa el enrutador para cambiar de pantalla.
const router = useRouter()

// Obtiene los stores que contienen los catálogos y los datos del viaje.
const catalogos = useCatalogosStore()
const store = usePublicarViajeStore()

// Extrae el borrador como referencia reactiva para conservar los cambios.
const { borrador } = storeToRefs(store)

// Configura los valores y las validaciones correspondientes al paso 1.
const { valores, errores, validar, validarCampo } = useFormulario(paso1Esquema, borrador)

// Establece la fecha actual como límite mínimo para seleccionar la salida.
const hoy = new Date()
const fechaMin = aFechaInput(hoy)

// Calcula la fecha máxima permitida según la anticipación configurada.
const fechaMax = aFechaInput(sumarDias(hoy, DIAS_MAX_ANTICIPACION))

// Convierte los puntos de encuentro en opciones compatibles con BaseSelect.
const opcionesPunto = computed(() =>
  catalogos.puntosEncuentro.map((p) => ({ valor: p.id, texto: p.nombre })),
)

// Busca el punto de encuentro seleccionado para mostrar su descripción.
const puntoSeleccionado = computed(() =>
  catalogos.puntosEncuentro.find((p) => p.id === Number(valores.value.puntoEncuentroId)),
)

// Detecta si la carga de vehículos terminó y no existen vehículos disponibles.
const sinVehiculo = computed(() => store.vehiculosCargados && store.vehiculos.length === 0)

// Al montar la pantalla, solicita los puntos de encuentro y los vehículos.
onMounted(() => {
  void catalogos.cargarPuntosEncuentro()
  void store.cargarVehiculos()
})

// Valida los datos del paso 1 y continúa al segundo paso si son correctos.
function continuar() {
  if (validar()) void router.push({ name: 'publicar-2' })
}
</script>

<template>
  <!-- Contenedor principal de la pantalla de publicación. -->
  <main class="flex flex-col min-h-full flex-1 bg-[#F3F7FA] text-[#1D2D44]">
    <EncabezadoPantalla
      titulo="Publicar Ruta (Conductor)"
      :volver="{ name: 'inicio' }"
      etiqueta="Paso 1 de 2"
    >
      <p class="text-xs text-[#C9DCE8]">
        Comparte tu trayecto desde el campus y divide los gastos de combustible.
      </p>
    </EncabezadoPantalla>

    <!-- Evita que el formulario recargue la página al enviarse. -->
    <form
      class="p-5 space-y-4 flex-1 md:px-8 md:py-8 md:max-w-[76rem] md:mx-auto md:w-full md:grid md:grid-cols-2 md:gap-6 md:space-y-0 md:items-start md:content-start"
      novalidate
      @submit.prevent="continuar"
    >
      <!-- Informa al usuario cuando no tiene vehículos disponibles. -->
      <AlertMessage class="md:col-span-2" v-if="sinVehiculo" tipo="aviso">
        Aún no tienes un vehículo registrado. Necesitas uno activo para publicar viajes.
      </AlertMessage>

      <!-- Muestra los errores relacionados con la carga de vehículos. -->
      <AlertMessage class="md:col-span-2" v-if="store.errorVehiculos" tipo="error">
        {{ mensajeDeError(store.errorVehiculos) }}
      </AlertMessage>

      <!-- Informa si ocurrió un problema al cargar los puntos de encuentro. -->
      <AlertMessage class="md:col-span-2" v-if="catalogos.error" tipo="error">
        No pudimos cargar los puntos de encuentro.
        {{ mensajeDeError(catalogos.error) }}
      </AlertMessage>

      <!-- Sección para configurar el recorrido del viaje. -->
      <TarjetaSeccion titulo="1. Puntos de la Ruta" :icono="MapPin" color-icono="text-[#0284C7]">
        <!-- Permite elegir el punto de encuentro de salida. -->
        <BaseSelect
          v-model="valores.puntoEncuentroId"
          etiqueta="Punto de Encuentro en Campus UTTT *"
          placeholder="Selecciona el punto de encuentro"
          suave
          :opciones="opcionesPunto"
          :error="errores.puntoEncuentroId"
          :ayuda="puntoSeleccionado?.descripcion"
          @change="validarCampo('puntoEncuentroId')"
        />

        <!-- Campo para introducir el destino final del recorrido. -->
        <BaseInput
          v-model="valores.destino"
          etiqueta="Destino Final *"
          suave
          :error="errores.destino"
          maxlength="150"
          placeholder="Ej. Pachuca Plaza Galerías / Tula Centro"
          @blur="validarCampo('destino')"
        />

        <!-- Permite agregar y administrar las paradas intermedias. -->
        <ParadasChips v-model="valores.paradas" :error="errores.paradas" />
      </TarjetaSeccion>

      <!-- Sección para establecer la fecha, hora y capacidad del viaje. -->
      <TarjetaSeccion titulo="2. Horario y Capacidad" :icono="Clock">
        <div class="grid grid-cols-2 gap-2.5">
          <!-- El usuario selecciona una fecha dentro del rango permitido. -->
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

          <!-- Campo para indicar la hora de salida. -->
          <BaseInput
            v-model="valores.hora"
            etiqueta="Hora de Salida *"
            suave
            :icono="Clock"
            type="time"
            :error="errores.hora"
          />
        </div>

        <!-- Permite seleccionar cuántos asientos se ofrecen. -->
        <SelectorAsientos
          v-model="valores.asientos"
          :capacidad="store.capacidad"
          :error="errores.asientos"
        />
      </TarjetaSeccion>

      <!-- Envía al paso 2; se desactiva si no hay vehículos disponibles. -->
      <div class="pt-2 space-y-2 md:col-span-2 md:max-w-md md:mx-auto md:w-full">
        <BaseButton type="submit" bloque :disabled="sinVehiculo" class="!font-bold">
          <span>Continuar</span>
          <ArrowRight class="w-4 h-4" aria-hidden="true" />
        </BaseButton>
        <RouterLink
          :to="{ name: 'borradores' }"
          class="block w-full py-2 rounded-xl text-xs font-semibold text-center text-[#4B5563] hover:text-[#1D2D44]"
        >
          Ver mis borradores
        </RouterLink>
      </div>
    </form>
  </main>
</template>
