<script setup lang="ts">
import { computed, onMounted, reactive, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/features/auth/application/useAuthStore'
import { useCatalogosStore } from '@/features/catalogos/application/useCatalogosStore'
import AlertMessage from '@/shared/components/AlertMessage.vue'
import BaseButton from '@/shared/components/BaseButton.vue'
import { ArrowLeft, Car, Search, SlidersHorizontal, X } from 'lucide-vue-next'
import { mensajeDeError } from '@/shared/composables/useApiError'
import { useBuscarViajes, type FiltrosViajes } from '../../application/useBuscarViajes'
import type { OrdenViajes } from '../../domain/tipos'
import TarjetaViaje from '../components/TarjetaViaje.vue'

const router = useRouter()
const auth = useAuthStore()
const catalogos = useCatalogosStore()
const { viajes, total, tieneSiguiente, cargando, cargandoMas, buscado, error, buscar, cargarMas } =
  useBuscarViajes()

const filtros = reactive<{
  destino: string
  puntoEncuentroId: string | number
  orden: OrdenViajes
}>({
  destino: '',
  puntoEncuentroId: 0,
  orden: 'Horario',
})

const ordenes: { valor: OrdenViajes; texto: string }[] = [
  { valor: 'Horario', texto: 'Horario' },
  { valor: 'MenorAporte', texto: 'Menor Aporte' },
  { valor: 'Calificacion', texto: '★ Estrellas' },
]

// Catálogo controlado de puntos de encuentro (regla 4): no es texto libre.
const opcionesPuntos = computed(() => [
  { valor: 0, texto: 'Todos' },
  ...catalogos.puntosEncuentro.map((p) => ({ valor: p.id, texto: p.nombre })),
])

function filtrosActuales(): FiltrosViajes {
  return {
    destino: filtros.destino,
    puntoEncuentroId: Number(filtros.puntoEncuentroId) || undefined,
    orden: filtros.orden,
  }
}

const ejecutar = () => buscar(filtrosActuales())

// Cambiar el orden o el punto de encuentro vuelve a consultar sin recargar la página.
watch(() => [filtros.orden, filtros.puntoEncuentroId], ejecutar)

onMounted(() => {
  void catalogos.cargarPuntosEncuentro()
  void ejecutar()
})

const textoContador = computed(
  () => `${total.value} ${total.value === 1 ? 'viaje disponible' : 'viajes disponibles'}`,
)
const sinResultados = computed(
  () => buscado.value && !cargando.value && !error.value && viajes.value.length === 0,
)

function limpiarDestino() {
  filtros.destino = ''
  void ejecutar()
}
</script>

<template>
  <main class="flex flex-col min-h-full flex-1 bg-[#F3F7FA] text-[#1D2D44]">
    <form
      class="bg-[#1D2D44] text-white px-5 pt-4 pb-4 rounded-b-2xl shadow-sm"
      role="search"
      @submit.prevent="ejecutar"
    >
      <div class="flex items-center justify-between mb-3">
        <RouterLink
          :to="{ name: 'inicio' }"
          class="flex items-center gap-1.5 text-xs text-[#C9DCE8] hover:text-white"
        >
          <ArrowLeft class="w-4 h-4" aria-hidden="true" />
          <span>Volver</span>
        </RouterLink>
        <h1 class="text-xs font-bold tracking-wide font-sans">Viajes Universitarios</h1>
        <span
          class="text-[11px] font-semibold bg-white/10 px-2.5 py-0.5 rounded-full text-[#C9DCE8]"
          role="status"
          aria-live="polite"
        >
          {{ total }} disponibles
        </span>
      </div>

      <div class="relative">
        <label for="buscar-destino" class="sr-only">Destino</label>
        <Search class="w-4 h-4 text-[#8AA9C4] absolute left-3 top-3" aria-hidden="true" />
        <input
          id="buscar-destino"
          v-model="filtros.destino"
          type="search"
          placeholder="Buscar destino (Pachuca, Tula, Tepeji, Actopan)..."
          autocomplete="off"
          maxlength="100"
          class="w-full pl-9 pr-9 py-2 text-xs rounded-xl bg-white text-[#1D2D44] placeholder-[#4B5563] outline-none shadow-inner [&::-webkit-search-cancel-button]:hidden"
        />
        <button
          v-if="filtros.destino"
          type="button"
          class="absolute right-3 top-2.5 text-[#4B5563] hover:text-[#1D2D44]"
          aria-label="Limpiar búsqueda"
          @click="limpiarDestino"
        >
          <X class="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      <!-- Catálogo controlado de puntos de encuentro (regla 4) -->
      <div
        class="flex items-center gap-1.5 overflow-x-auto pt-3 pb-1 text-xs [scrollbar-width:none]"
        role="group"
        aria-label="Punto de encuentro"
      >
        <button
          v-for="o in opcionesPuntos"
          :key="o.valor"
          type="button"
          class="px-2.5 py-1 rounded-lg font-medium whitespace-nowrap text-[11px] transition-all"
          :class="
            Number(filtros.puntoEncuentroId) === o.valor
              ? 'bg-[#0284C7] text-white font-bold shadow-xs'
              : 'bg-white/10 text-[#C9DCE8] hover:bg-white/20'
          "
          :aria-pressed="Number(filtros.puntoEncuentroId) === o.valor"
          @click="filtros.puntoEncuentroId = o.valor"
        >
          {{ o.texto }}
        </button>
      </div>
    </form>

    <div class="px-5 py-2.5 flex items-center justify-between text-xs text-[#3E5C76]">
      <div class="flex items-center gap-1.5">
        <SlidersHorizontal class="w-3.5 h-3.5 text-[#8AA9C4]" aria-hidden="true" />
        <span class="font-semibold text-[11px]">Ordenar por:</span>
      </div>
      <div class="flex items-center gap-1" role="group" aria-label="Ordenar por">
        <button
          v-for="o in ordenes"
          :key="o.valor"
          type="button"
          class="px-2 py-0.5 rounded text-[10px] font-bold"
          :class="
            filtros.orden === o.valor
              ? 'bg-[#3E5C76] text-white'
              : 'text-[#4B5563] hover:text-[#1D2D44]'
          "
          :aria-pressed="filtros.orden === o.valor"
          @click="filtros.orden = o.valor"
        >
          {{ o.texto }}
        </button>
      </div>
    </div>

    <div class="p-5 pt-1 space-y-3 flex-1">
      <AlertMessage v-if="error" tipo="error">{{ mensajeDeError(error) }}</AlertMessage>

      <template v-if="buscado && !error">
        <!-- P6: estado vacío -->
        <section
          v-if="sinResultados"
          class="py-12 px-4 text-center rounded-2xl bg-white border border-[#C9DCE8] mt-2"
          aria-live="polite"
        >
          <Car class="w-10 h-10 text-[#8AA9C4] mx-auto mb-2" aria-hidden="true" />
          <h2 class="text-sm font-bold text-[#1D2D44] font-sans">No se encontraron viajes</h2>
          <p class="text-xs text-[#4B5563] mt-1 max-w-xs mx-auto">
            <template v-if="filtros.destino">
              No hay viajes que coincidan con tu búsqueda hacia "{{ filtros.destino }}".
            </template>
            <template v-else>Ningún viaje programado coincide con tu búsqueda.</template>
            <template v-if="auth.esConductor">
              ¿Te gustaría publicar esta ruta como conductor?</template
            >
            <template v-else>
              ¿Tienes vehículo? Con una cuenta de conductor puedes publicar tu propia ruta.
            </template>
          </p>
          <button
            v-if="auth.esConductor"
            type="button"
            class="mt-4 px-4 py-2 rounded-xl bg-[#1D2D44] text-white text-xs font-bold hover:bg-[#3E5C76]"
            @click="router.push({ name: 'publicar-1' })"
          >
            Publicar Ruta
          </button>
        </section>

        <template v-else>
          <p class="sr-only" role="status">{{ textoContador }}</p>
          <ul class="space-y-3">
            <li v-for="v in viajes" :key="v.id">
              <TarjetaViaje :viaje="v" />
            </li>
          </ul>
        </template>

        <BaseButton
          v-if="tieneSiguiente"
          variante="secundario"
          bloque
          :cargando="cargandoMas"
          @click="cargarMas(filtrosActuales())"
        >
          Ver más viajes
        </BaseButton>
      </template>

      <p v-else-if="cargando" class="py-8 text-center text-xs text-[#4B5563]">Buscando viajes…</p>
    </div>
  </main>
</template>
