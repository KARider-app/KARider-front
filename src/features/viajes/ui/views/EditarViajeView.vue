<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { aFechaInput, sumarDias } from '@/core/utils/fechas'
import AlertMessage from '@/shared/components/AlertMessage.vue'
import BaseButton from '@/shared/components/BaseButton.vue'
import BaseInput from '@/shared/components/BaseInput.vue'
import BaseSelect from '@/shared/components/BaseSelect.vue'
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
  <main class="pantalla">
    <header>
      <h1 class="pantalla__titulo">Editar viaje</h1>
      <p class="pantalla__subtitulo">Modifica los datos de tu ruta publicada.</p>
    </header>

    <p v-if="cargando && !viaje" class="texto-suave centrado">Cargando viaje…</p>

    <AlertMessage v-if="errorCarga" tipo="error">{{ mensajeDeError(errorCarga) }}</AlertMessage>

    <AlertMessage v-if="viaje && !editable" tipo="aviso">
      Este viaje ya no se puede editar.
      <RouterLink :to="{ name: 'viaje', params: { id } }">Volver al detalle</RouterLink>
    </AlertMessage>

    <form v-if="viaje && editable" class="formulario" novalidate @submit.prevent="guardarCambios">
      <!-- Aviso clave de la HU-09: los cambios importantes se notifican a los pasajeros. -->
      <AlertMessage v-if="reservados > 0 && cambiosRelevantes" tipo="aviso">
        Este viaje ya tiene {{ reservados }}
        {{ reservados === 1 ? 'asiento reservado' : 'asientos reservados' }}. Al guardar, los
        pasajeros serán notificados de los cambios.
      </AlertMessage>

      <section class="formulario tarjeta" aria-label="Ruta">
        <BaseSelect
          v-model="valores.puntoEncuentroId"
          etiqueta="Punto de encuentro en el campus"
          placeholder="Selecciona el punto de encuentro"
          :opciones="opcionesPunto"
          :error="errores.puntoEncuentroId"
          :ayuda="puntoSeleccionado?.descripcion"
          @change="validarCampo('puntoEncuentroId')"
        />
        <BaseInput
          v-model="valores.destino"
          etiqueta="Destino final"
          :error="errores.destino"
          maxlength="150"
          @blur="validarCampo('destino')"
        />
        <ParadasChips v-model="valores.paradas" :error="errores.paradas" />
      </section>

      <section class="formulario tarjeta" aria-label="Horario y capacidad">
        <div class="fila">
          <BaseInput
            v-model="valores.fecha"
            etiqueta="Fecha"
            type="date"
            :min="fechaMin"
            :max="fechaMax"
            :error="errores.fecha"
          />
          <BaseInput
            v-model="valores.hora"
            etiqueta="Hora de salida"
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
      </section>

      <CalculadoraAporte
        v-model="valores.gastoTotal"
        :asientos="valores.asientos"
        :error="errores.gastoTotal"
        @validar="validarCampo('gastoTotal')"
      />

      <section class="tarjeta notas">
        <label for="notas" class="seccion-titulo">Notas para los pasajeros</label>
        <textarea
          id="notas"
          v-model="valores.notas"
          rows="4"
          :maxlength="MAX_NOTAS"
          :aria-invalid="!!errores.notas"
        ></textarea>
        <p class="notas__pie">
          <span v-if="errores.notas" class="notas__error" role="alert">{{ errores.notas }}</span>
          <span class="texto-suave">{{ valores.notas.length }}/{{ MAX_NOTAS }}</span>
        </p>
      </section>

      <AlertMessage v-if="errorGeneral" tipo="error">
        {{ mensajeDeError(errorGeneral) }}
      </AlertMessage>

      <BaseButton
        type="submit"
        variante="acento"
        bloque
        :cargando="enviando"
        :disabled="!hayCambios || enviando"
      >
        GUARDAR CAMBIOS
      </BaseButton>
      <RouterLink :to="{ name: 'viaje', params: { id } }" class="centrado">Cancelar</RouterLink>
    </form>
  </main>
</template>

<style scoped>
.notas {
  display: flex;
  flex-direction: column;
  gap: var(--espacio-2);
}

.notas textarea {
  width: 100%;
  padding: var(--espacio-3);
  border: 1px solid var(--color-borde);
  border-radius: var(--radio-sm);
  resize: vertical;
}

.notas__pie {
  display: flex;
  justify-content: space-between;
  gap: var(--espacio-2);
}

.notas__error {
  font-size: 0.8125rem;
  color: var(--color-error);
}
</style>
