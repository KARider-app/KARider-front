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
const {
  valores,
  errores,
  errorGeneral,
  enviando,
  enviar,
  validarCampo,
} = useFormulario(paso2Esquema, borrador)

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
      await (
        publicar
          // Si se publicó, abre el detalle del viaje.
          ? router.push({
              name: 'viaje',
              params: { id: viaje.id },
              query: { publicado: '1' },
            })
          // Si se guardó como borrador, abre la lista de borradores.
          : router.push({
              name: 'borradores',
              query: { guardado: '1' },
            })
      )
    },
    {
      // Intercepta los errores para identificar si corresponden al paso 1.
      alError: (e) => {
        // Obtiene los nombres de los campos que reportaron errores.
        const llaves = Object.keys(e.errors)

        // Comprueba si el error es del paso 1 por su código
        // o porque afecta campos que no pertenecen al paso 2.
        const esDelPaso1 =
          CODIGOS_PASO_1.includes(e.code) ||
          llaves.some((k) => !CAMPOS_PASO_2.includes(k))

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
  <main class="pantalla">
    <header>
      <!-- Identifica el segundo paso del proceso de publicación. -->
      <p class="texto-suave">Paso 2 de 2</p>
      <h1 class="pantalla__titulo">Aporte solidario</h1>
      <p class="pantalla__subtitulo">
        Calcula cuánto aporta cada pasajero y publica tu viaje.
      </p>
    </header>

    <!-- El formulario publica el viaje cuando se envía. -->
    <form class="formulario" novalidate @submit.prevent="guardar(true)">

      <!-- Calcula el aporte usando el gasto total y los asientos disponibles. -->
      <CalculadoraAporte
        v-model="valores.gastoTotal"
        :asientos="valores.asientos"
        :error="errores.gastoTotal"
        @validar="validarCampo('gastoTotal')"
      />

      <!-- Sección que muestra o permite seleccionar el vehículo. -->
      <section class="formulario tarjeta" aria-labelledby="titulo-vehiculo">
        <h2 id="titulo-vehiculo" class="seccion-titulo">
          Vehículo registrado
        </h2>

        <!-- Informa que los vehículos todavía se están cargando. -->
        <p
          v-if="!store.vehiculosCargados && !store.errorVehiculos"
          class="texto-suave"
        >
          Cargando tu vehículo…
        </p>

        <!-- Si solo hay un vehículo disponible, muestra su información. -->
        <TarjetaVehiculo
          v-else-if="store.vehiculos.length === 1 && store.vehiculo"
          v-bind="store.vehiculo"
        />

        <!-- Si hay varios vehículos, permite seleccionar uno. -->
        <fieldset v-else-if="store.vehiculos.length > 1" class="vehiculos">
          <legend class="sr-only">Elige el vehículo del viaje</legend>

          <!-- Genera una opción seleccionable para cada vehículo. -->
          <label
            v-for="v in store.vehiculos"
            :key="v.id"
            class="vehiculos__opcion"
            :class="{
              'vehiculos__opcion--activa': valores.vehiculoId === v.id,
            }"
          >
            <!-- Guarda el identificador del vehículo seleccionado. -->
            <input
              v-model="valores.vehiculoId"
              type="radio"
              :value="v.id"
              class="sr-only"
            />

            <!-- Nombre accesible de la opción: el lector de pantalla lo anuncia al elegir el vehículo. -->
            <span class="sr-only">
              {{ v.modelo }} {{ v.color }}, placas {{ v.placas }},
              {{ v.verificado ? 'verificado' : 'sin verificar' }}
            </span>

            <!-- Presenta los datos del vehículo de esta opción (solo visual; el texto accesible está arriba). -->
            <span class="vehiculos__tarjeta" aria-hidden="true">
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
      </section>

      <!-- Sección para escribir indicaciones adicionales a los pasajeros. -->
      <section class="tarjeta notas">
        <label for="notas" class="seccion-titulo">
          Notas para los pasajeros
        </label>

        <!-- Campo de texto con un límite máximo de caracteres. -->
        <textarea
          id="notas"
          v-model="valores.notas"
          rows="4"
          :maxlength="MAX_NOTAS"
          placeholder="Ej. Salgo puntual; espero 5 minutos en el punto de encuentro."
          :aria-invalid="!!errores.notas"
        ></textarea>

        <!-- Muestra el error de validación y el contador de caracteres. -->
        <p class="notas__pie">
          <span v-if="errores.notas" class="notas__error" role="alert">
            {{ errores.notas }}
          </span>
          <span class="texto-suave">
            {{ valores.notas.length }}/{{ MAX_NOTAS }}
          </span>
        </p>
      </section>

      <!-- Muestra errores que deben corregirse en el primer paso. -->
      <AlertMessage v-if="errorPaso1" tipo="error">
        <span v-for="m in mensajesPaso1" :key="m">{{ m }}</span>

        <!-- Permite regresar a corregir la ruta o el horario. -->
        <RouterLink :to="{ name: 'publicar-1' }">
          Corregir ruta y horario
        </RouterLink>
      </AlertMessage>

      <!-- Muestra errores generales del envío del formulario. -->
      <AlertMessage v-if="errorGeneral" tipo="error">
        {{ mensajeDeError(errorGeneral) }}
      </AlertMessage>

      <!-- Botón principal para publicar el viaje. -->
      <BaseButton
        type="submit"
        variante="acento"
        bloque
        :cargando="enviando && accion === 'publicar'"
        :disabled="enviando"
      >
        PUBLICAR RUTA EN CAMPUS UTTT
      </BaseButton>

      <!-- Permite guardar los datos sin publicar todavía el viaje. -->
      <BaseButton
        variante="secundario"
        bloque
        :cargando="enviando && accion === 'borrador'"
        :disabled="enviando"
        @click="guardar(false)"
      >
        Cancelar y guardar borrador
      </BaseButton>

      <!-- Enlace para regresar al primer paso sin enviar el formulario. -->
      <RouterLink :to="{ name: 'publicar-1' }" class="centrado">
        Volver al paso 1
      </RouterLink>
    </form>
  </main>
</template>

<style scoped>
/* Organiza verticalmente las opciones de vehículos. */
.vehiculos {
  display: flex;
  flex-direction: column;
  gap: var(--espacio-2);
  margin: 0;
  padding: 0;
  border: 0;
}

/* Define el aspecto de cada opción de vehículo. */
.vehiculos__opcion {
  padding: var(--espacio-3);
  border: 2px solid var(--color-borde);
  border-radius: var(--radio-md);
  cursor: pointer;
}

/* Resalta visualmente el vehículo seleccionado. */
.vehiculos__opcion--activa {
  border-color: var(--color-acento);
  background: var(--color-acento-claro);
}

/* Muestra un contorno cuando una opción recibe el foco del teclado. */
.vehiculos__opcion:has(input:focus-visible) {
  outline: 3px solid var(--color-acento);
  outline-offset: 2px;
}

/* Organiza los elementos del apartado de notas en una columna. */
.notas {
  display: flex;
  flex-direction: column;
  gap: var(--espacio-2);
}

/* Da estilo al campo de texto de las notas. */
.notas textarea {
  width: 100%;
  padding: var(--espacio-3);
  border: 1px solid var(--color-borde);
  border-radius: var(--radio-sm);
  resize: vertical;
}

/* Distribuye el mensaje de validación y el contador de caracteres. */
.notas__pie {
  display: flex;
  justify-content: space-between;
  gap: var(--espacio-2);
}

/* Resalta los mensajes de error del campo de notas. */
.notas__error {
  font-size: 0.8125rem;
  color: var(--color-error);
}

.vehiculos__tarjeta {
  display: block;
}
</style>
