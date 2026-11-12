<script setup lang="ts">
import { ref } from 'vue'
import AlertMessage from '@/shared/components/AlertMessage.vue'
import BaseButton from '@/shared/components/BaseButton.vue'
import { mensajeDeError } from '@/shared/composables/useApiError'
import { comoApiError, type ApiError } from '@/core/http/apiError'
import { perfilApi } from '../../api/perfilApi'
import { ETIQUETAS_CALIFICACION } from '../../domain/tipos'

const props = defineProps<{ viajeId: string; evaluadoId: string; evaluadoNombre: string }>()
const emit = defineEmits<{ calificado: [] }>()

const abierto = ref(false)
const estrellas = ref(0)
const etiquetas = ref<string[]>([])
const comentario = ref('')
const enviando = ref(false)
const error = ref<ApiError | null>(null)

function alternarEtiqueta(e: string) {
  etiquetas.value = etiquetas.value.includes(e)
    ? etiquetas.value.filter((x) => x !== e)
    : [...etiquetas.value, e]
}

async function enviar() {
  if (estrellas.value < 1) return
  enviando.value = true
  error.value = null
  try {
    await perfilApi.calificar({
      viajeId: props.viajeId,
      evaluadoId: props.evaluadoId,
      estrellas: estrellas.value,
      etiquetas: etiquetas.value,
      comentario: comentario.value.trim() || undefined,
    })
    emit('calificado')
  } catch (e) {
    error.value = comoApiError(e)
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <div class="evaluar">
    <button v-if="!abierto" type="button" class="enlace-evaluar" @click="abierto = true">
      💬 Evaluar compañero
    </button>

    <div v-else class="evaluar__panel">
      <p class="evaluar__titulo">Califica a {{ evaluadoNombre }}</p>

      <div class="evaluar__estrellas" role="radiogroup" aria-label="Calificación en estrellas">
        <button
          v-for="n in 5"
          :key="n"
          type="button"
          class="estrella"
          :class="{ 'estrella--activa': n <= estrellas }"
          role="radio"
          :aria-checked="n === estrellas"
          :aria-label="`${n} de 5 estrellas`"
          @click="estrellas = n"
        >
          ★
        </button>
      </div>

      <div class="evaluar__etiquetas">
        <button
          v-for="e in ETIQUETAS_CALIFICACION"
          :key="e"
          type="button"
          class="chip"
          :class="{ 'chip--activa': etiquetas.includes(e) }"
          @click="alternarEtiqueta(e)"
        >
          {{ e }}
        </button>
      </div>

      <textarea
        v-model="comentario"
        class="evaluar__comentario"
        rows="2"
        maxlength="500"
        placeholder="Comentario opcional"
      />

      <AlertMessage v-if="error" tipo="error">{{ mensajeDeError(error) }}</AlertMessage>

      <div class="evaluar__acciones">
        <BaseButton variante="secundario" :disabled="enviando" @click="abierto = false">
          Cancelar
        </BaseButton>
        <BaseButton :disabled="estrellas < 1" :cargando="enviando" @click="enviar">
          Enviar calificación
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.enlace-evaluar {
  align-self: flex-start;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--color-acento);
  font-size: 0.8125rem;
  font-weight: 700;
  cursor: pointer;
}

.evaluar__panel {
  display: flex;
  flex-direction: column;
  gap: var(--espacio-2);
  margin-top: var(--espacio-2);
  padding-top: var(--espacio-2);
  border-top: 1px solid var(--color-borde);
}

.evaluar__titulo {
  font-weight: 700;
}

.evaluar__estrellas {
  display: flex;
  gap: var(--espacio-1);
}

.estrella {
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--color-deshabilitado);
  font-size: 1.75rem;
  line-height: 1;
  cursor: pointer;
}

.estrella--activa {
  color: var(--color-aviso);
}

.evaluar__etiquetas {
  display: flex;
  flex-wrap: wrap;
  gap: var(--espacio-1);
}

.chip {
  padding: var(--espacio-1) var(--espacio-2);
  border: 1px solid var(--color-borde);
  border-radius: var(--radio-pill);
  background: var(--color-superficie);
  color: var(--color-texto-suave);
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
}

.chip--activa {
  border-color: var(--color-primario);
  background: var(--color-primario);
  color: #fff;
}

.evaluar__comentario {
  width: 100%;
  padding: var(--espacio-2) var(--espacio-3);
  border: 1px solid var(--color-borde);
  border-radius: var(--radio-sm);
  background: var(--color-superficie);
  font: inherit;
  resize: vertical;
}

.evaluar__acciones {
  display: flex;
  gap: var(--espacio-2);
}

.evaluar__acciones > * {
  flex: 1;
}
</style>
