<script setup lang="ts">
import { ref } from 'vue'
import AlertMessage from '@/shared/components/AlertMessage.vue'
import { CircleCheck, MessageSquare, Star } from 'lucide-vue-next'
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
  <button
    type="button"
    class="text-[11px] font-bold text-[#0284C7] hover:underline flex items-center gap-1"
    @click="abierto = true"
  >
    <MessageSquare class="w-3 h-3" aria-hidden="true" />
    <span>Evaluar compañero</span>
  </button>

  <Teleport to="body">
    <div
      v-if="abierto"
      class="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50"
      @click.self="!enviando && (abierto = false)"
    >
      <form
        class="w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl border border-[#C9DCE8] space-y-4 text-[#1D2D44]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-evaluar"
        @submit.prevent="enviar"
      >
        <div class="flex items-center justify-between pb-2 border-b border-[#EDEDED]">
          <div class="flex items-center gap-2">
            <Star class="w-4 h-4 text-amber-500 fill-amber-500" aria-hidden="true" />
            <h3 id="titulo-evaluar" class="text-sm font-extrabold text-[#1D2D44] font-sans">
              Calificación Mutua de Viaje
            </h3>
          </div>
          <button
            type="button"
            class="text-xs text-[#4B5563] hover:text-[#1D2D44]"
            aria-label="Cerrar"
            :disabled="enviando"
            @click="abierto = false"
          >
            ✕
          </button>
        </div>

        <div class="space-y-3 text-xs">
          <div>
            <span class="text-[11px] text-[#4B5563] block">Evaluando a:</span>
            <span class="font-extrabold text-[#1D2D44] text-sm">{{ evaluadoNombre }}</span>
          </div>

          <div>
            <span class="text-[11px] font-bold text-[#3E5C76] uppercase block mb-1">
              Puntuación general:
            </span>
            <div
              class="flex items-center gap-2"
              role="radiogroup"
              aria-label="Calificación en estrellas"
            >
              <button
                v-for="n in 5"
                :key="n"
                type="button"
                class="text-2xl transition-transform hover:scale-110"
                :class="n <= estrellas ? 'text-amber-400' : 'text-slate-300'"
                role="radio"
                :aria-checked="n === estrellas"
                :aria-label="`${n} de 5 estrellas`"
                @click="estrellas = n"
              >
                ★
              </button>
              <span class="text-xs font-black text-[#1D2D44] ml-2">{{ estrellas }}.0 / 5.0</span>
            </div>
          </div>

          <div>
            <span class="text-[11px] font-bold text-[#3E5C76] uppercase block mb-1">
              Etiquetas:
            </span>
            <div class="flex flex-wrap gap-1">
              <button
                v-for="e in ETIQUETAS_CALIFICACION"
                :key="e"
                type="button"
                class="text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-colors"
                :class="
                  etiquetas.includes(e)
                    ? 'bg-[#1D2D44] text-white border-[#1D2D44]'
                    : 'bg-[#EAF2F8] text-[#1D2D44] border-[#C9DCE8]'
                "
                :aria-pressed="etiquetas.includes(e)"
                @click="alternarEtiqueta(e)"
              >
                {{ e }}
              </button>
            </div>
          </div>

          <div>
            <label
              for="comentario-evaluacion"
              class="text-[11px] font-bold text-[#3E5C76] uppercase block mb-1"
            >
              Comentario institucional:
            </label>
            <textarea
              id="comentario-evaluacion"
              v-model="comentario"
              rows="3"
              maxlength="500"
              placeholder="Describe la puntualidad, respeto y experiencia..."
              class="w-full p-2.5 rounded-xl border border-[#C9DCE8] text-xs outline-none focus:border-[#1D2D44]"
            />
          </div>

          <AlertMessage v-if="error" tipo="error">{{ mensajeDeError(error) }}</AlertMessage>

          <div class="grid grid-cols-2 gap-2 pt-2">
            <button
              type="button"
              class="py-2.5 rounded-xl border border-[#C9DCE8] text-xs font-bold text-[#4B5563] hover:bg-[#F3F7FA] disabled:opacity-55"
              :disabled="enviando"
              @click="abierto = false"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="py-2.5 rounded-xl bg-[#1D2D44] text-white text-xs font-bold hover:bg-[#3E5C76] shadow-md flex items-center justify-center gap-1.5 disabled:opacity-55 disabled:cursor-not-allowed"
              :disabled="estrellas < 1 || enviando"
              :aria-busy="enviando"
            >
              <span
                v-if="enviando"
                class="w-4 h-4 border-2 border-current border-r-transparent rounded-full animate-spin"
                aria-hidden="true"
              />
              <CircleCheck v-else class="w-4 h-4" aria-hidden="true" />
              <span>Guardar Calificación</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  </Teleport>
</template>
