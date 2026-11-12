
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
const { valores, errores, validar, validarCampo } = useFormulario(
  paso1Esquema,
  borrador,
)

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
  catalogos.puntosEncuentro.find(
    (p) => p.id === Number(valores.value.puntoEncuentroId),
  ),
)

// Detecta si la carga de vehículos terminó y no existen vehículos disponibles.
const sinVehiculo = computed(
  () => store.vehiculosCargados && store.vehiculos.length === 0,
)

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
  <main class="pantalla">
    <header class="encabezado">
      <div class="encabezado__fila">
        <RouterLink :to="{ name: 'inicio' }" class="encabezado__volver">← Volver</RouterLink>
        <span class="encabezado__titulo">PUBLICAR RUTA</span>
        <span class="encabezado__paso">Paso 1 de 2</span>
      </div>
      <p class="encabezado__subtitulo">
        Indica de dónde sales, a dónde vas y cuántos lugares ofreces.
      </p>
    </header>

    <!-- Informa al usuario cuando no tiene vehículos disponibles. -->
    <AlertMessage v-if="sinVehiculo" tipo="aviso">
      Aún no tienes un vehículo registrado. Necesitas uno activo para publicar viajes.
    </AlertMessage>

    <!-- Muestra los errores relacionados con la carga de vehículos. -->
    <AlertMessage v-if="store.errorVehiculos" tipo="error">
      {{ mensajeDeError(store.errorVehiculos) }}
    </AlertMessage>

    <!-- Informa si ocurrió un problema al cargar los puntos de encuentro. -->
    <AlertMessage v-if="catalogos.error" tipo="error">
      No pudimos cargar los puntos de encuentro.
      {{ mensajeDeError(catalogos.error) }}
    </AlertMessage>

    <!-- Evita que el formulario recargue la página al enviarse. -->
    <form class="formulario" novalidate @submit.prevent="continuar">

      <!-- Sección para configurar el recorrido del viaje. -->
      <section class="formulario tarjeta" aria-label="Ruta">

        <!-- Permite elegir el punto de encuentro de salida. -->
        <BaseSelect
          v-model="valores.puntoEncuentroId"
          etiqueta="Punto de encuentro en el campus"
          placeholder="Selecciona el punto de encuentro"
          :opciones="opcionesPunto"
          :error="errores.puntoEncuentroId"
          :ayuda="puntoSeleccionado?.descripcion"
          @change="validarCampo('puntoEncuentroId')"
        />

        <!-- Campo para introducir el destino final del recorrido. -->
        <BaseInput
          v-model="valores.destino"
          etiqueta="Destino final"
          :error="errores.destino"
          maxlength="150"
          placeholder="Ej. Centro de Tula"
          @blur="validarCampo('destino')"
        />

        <!-- Permite agregar y administrar las paradas intermedias. -->
        <ParadasChips
          v-model="valores.paradas"
          :error="errores.paradas"
        />
      </section>

      <!-- Sección para establecer la fecha, hora y capacidad del viaje. -->
      <section class="formulario tarjeta" aria-label="Horario y capacidad">
        <div class="fila">

          <!-- El usuario selecciona una fecha dentro del rango permitido. -->
          <BaseInput
            v-model="valores.fecha"
            etiqueta="Fecha"
            type="date"
            :min="fechaMin"
            :max="fechaMax"
            :error="errores.fecha"
          />

          <!-- Campo para indicar la hora de salida. -->
          <BaseInput
            v-model="valores.hora"
            etiqueta="Hora de salida"
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
      </section>

      <!-- Envía al paso 2; se desactiva si no hay vehículos disponibles. -->
      <BaseButton type="submit" bloque :disabled="sinVehiculo">
        CONTINUAR
      </BaseButton>
    </form>
  </main>
</template>

<style scoped>
.encabezado {
  padding: var(--espacio-4) var(--espacio-4) var(--espacio-5);
  border-radius: var(--radio-lg);
  background: var(--color-primario);
  color: #fff;
  display: flex;
  flex-direction: column;
  gap: var(--espacio-1);
}

.encabezado__fila {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--espacio-2);
}

.encabezado__volver {
  color: #c6d2e3;
  font-size: 0.8125rem;
  font-weight: 600;
  text-decoration: none;
}

.encabezado__titulo {
  font-size: 0.8125rem;
  font-weight: 800;
  letter-spacing: 0.04em;
}

.encabezado__paso {
  padding: 2px var(--espacio-2);
  border-radius: var(--radio-pill);
  background: rgb(255 255 255 / 12%);
  color: #c6d2e3;
  font-size: 0.6875rem;
  font-weight: 600;
}

.encabezado__subtitulo {
  color: #c6d2e3;
  font-size: 0.8125rem;
  line-height: 1.5;
}
</style>
