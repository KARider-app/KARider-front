<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Car, Clock, Navigation, PenLine } from 'lucide-vue-next'
import { fechaCorta, horaCorta, mxn } from '@/core/utils/formato'
import CompartirUbicacion from '@/features/reservas/ui/components/CompartirUbicacion.vue'
import FichaConductor from '@/features/reservas/ui/components/FichaConductor.vue'
import PanelReserva from '@/features/reservas/ui/components/PanelReserva.vue'
import type { Reserva } from '@/features/reservas/domain/tipos'
import AlertMessage from '@/shared/components/AlertMessage.vue'
import BaseButton from '@/shared/components/BaseButton.vue'
import { mensajeDeError } from '@/shared/composables/useApiError'
import { useEsEscritorio } from '@/shared/composables/useMediaQuery'
import { useDetalleViaje } from '../../application/useDetalleViaje'
import { esEditable } from '../../domain/aporte'
import type { EstadoViaje } from '../../domain/tipos'
import MapaRutaViaje from '../components/MapaRutaViaje.vue'

const route = useRoute()
const router = useRouter()
const {
  viaje,
  cargando,
  error,
  publicando,
  iniciando,
  finalizando,
  cargar,
  publicarBorrador,
  iniciarViaje,
  finalizarViaje,
} = useDetalleViaje()
/** En PC el panel de reserva va en la columna lateral; en celular/tablet, fijo abajo. */
const esEscritorio = useEsEscritorio()

const recienPublicado = computed(() => route.query.publicado === '1')
const folioNuevo = computed(() =>
  typeof route.query.folio === 'string' ? route.query.folio : null,
)

/** El conductor comparte su ubicación solo en viajes programados o en curso. */
const puedeCompartirUbicacion = computed(
  () => viaje.value?.esPropietario && ['Programado', 'EnCurso'].includes(viaje.value.estado),
)

/** HU-07: tras reservar, la reserva confirmada lleva al mapa (P8); si queda pendiente se muestra aquí. */
async function alReservar(reserva: Reserva) {
  if (reserva.estado === 'Confirmada') {
    await router.push({ name: 'mapa-reserva', params: { id: reserva.id } })
    return
  }
  await router.replace({ query: { ...route.query, folio: reserva.folio } })
  if (viaje.value) await cargar(viaje.value.id)
}

/** Vuelve a pedir el viaje (por ejemplo, si el cupo cambió mientras el pasajero decidía). */
function recargar() {
  if (viaje.value) void cargar(viaje.value.id)
}

const textoEstado: Record<EstadoViaje, string> = {
  Borrador: 'Borrador',
  Programado: 'Publicado',
  EnCurso: 'En curso',
  Completado: 'Completado',
  Cancelado: 'Cancelado',
}

const recienEditado = computed(() => route.query.editado === '1')
const editable = computed(() => esEditable(viaje.value))

watch(
  () => route.params.id,
  (id) => {
    if (typeof id === 'string') void cargar(id)
  },
  { immediate: true },
)

const estiloEstado: Record<EstadoViaje, string> = {
  Borrador: 'bg-amber-100 text-amber-800',
  Programado: 'bg-emerald-100 text-emerald-800',
  EnCurso: 'bg-sky-100 text-sky-800',
  Completado: 'bg-[#EAF2F8] text-[#1D2D44]',
  Cancelado: 'bg-red-100 text-red-700',
}

/** Mapa disponible para el pasajero con reserva confirmada. */
const reservaConMapa = computed(() =>
  viaje.value?.miReserva?.estado === 'Confirmada' ? viaje.value.miReserva : null,
)
</script>

<template>
  <main class="flex flex-col min-h-full flex-1 bg-[#F3F7FA] text-[#1D2D44]">
    <header
      class="bg-[#1D2D44] text-white px-5 pt-4 pb-4 rounded-b-2xl md:rounded-none md:px-8 md:py-6 shadow-sm"
    >
      <div class="md:max-w-6xl md:mx-auto">
        <div class="flex items-center justify-between gap-2 mb-2">
          <RouterLink
            :to="viaje?.esPropietario ? { name: 'inicio' } : { name: 'buscar' }"
            class="flex items-center gap-1.5 text-xs text-[#C9DCE8] hover:text-white"
          >
            <ArrowLeft class="w-4 h-4" aria-hidden="true" />
            <span>{{ viaje?.esPropietario ? 'Volver' : 'Volver a la lista' }}</span>
          </RouterLink>
          <span class="text-xs font-bold uppercase tracking-wider">Detalle del Viaje</span>
          <RouterLink
            v-if="viaje && editable"
            :to="{ name: 'viaje-editar', params: { id: viaje.id } }"
            class="text-xs text-[#8AA9C4] hover:text-white flex items-center gap-1"
          >
            <PenLine class="w-3.5 h-3.5" aria-hidden="true" />
            <span>Editar</span>
          </RouterLink>
          <span v-else class="w-12" />
        </div>

        <div v-if="viaje" class="flex items-center justify-between gap-3 mt-2">
          <div class="min-w-0">
            <h1 class="text-base md:text-2xl font-extrabold text-white block font-sans">
              {{ viaje.destino }}
            </h1>
            <span class="text-xs text-[#C9DCE8] flex items-center gap-1">
              <Clock class="w-3 h-3 shrink-0" aria-hidden="true" />
              Salida: {{ horaCorta(viaje.fechaSalida) }} ({{ fechaCorta(viaje.fechaSalida) }})
            </span>
            <span
              class="inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full"
              :class="estiloEstado[viaje.estado]"
            >
              {{ textoEstado[viaje.estado] }}
            </span>
          </div>
          <div class="text-right shrink-0">
            <span
              class="text-lg md:text-2xl font-black text-white bg-white/10 px-3 py-1 md:px-4 md:py-2 rounded-xl block"
            >
              {{ mxn(viaje.aportePorAsiento) }} MXN
            </span>
            <span class="text-[9px] text-[#C9DCE8] block">aporte por asiento</span>
            <span class="text-[9px] text-[#8AA9C4] block"
              >Gasto total {{ mxn(viaje.gastoTotal) }}</span
            >
          </div>
        </div>
      </div>
    </header>

    <div
      class="p-5 space-y-4 flex-1 md:px-8 md:py-8 md:max-w-[76rem] md:mx-auto md:w-full lg:grid lg:grid-cols-3 lg:gap-6 lg:space-y-0 lg:items-start"
    >
      <p v-if="cargando && !viaje" class="py-8 text-center text-xs text-[#4B5563] lg:col-span-3">
        Cargando viaje…
      </p>

      <AlertMessage v-if="error" tipo="error" class="lg:col-span-3">{{
        mensajeDeError(error)
      }}</AlertMessage>
      <AlertMessage v-if="recienEditado" tipo="exito" class="lg:col-span-3"
        >Cambios guardados.</AlertMessage
      >

      <template v-if="viaje">
        <!-- Columna principal (en PC ocupa 2 de 3 columnas) -->
        <div class="space-y-4 lg:col-span-2">
          <AlertMessage v-if="recienPublicado && viaje.estado === 'Programado'" tipo="exito">
            ¡Tu ruta ya está publicada en el campus UTTT!
          </AlertMessage>
          <AlertMessage v-if="folioNuevo && viaje.miReserva" tipo="exito">
            Solicitud enviada. Tu folio es {{ folioNuevo }}.
          </AlertMessage>

          <!-- HU-08: ruta real por calles -->
          <MapaRutaViaje :viaje-id="viaje.id" />

          <!-- Itinerario -->
          <section class="p-4 rounded-2xl bg-white border border-[#C9DCE8] shadow-xs">
            <h2
              class="text-xs font-bold text-[#1D2D44] mb-3 flex items-center justify-between font-sans"
            >
              <span>Itinerario y Puntos de Abordaje</span>
              <span class="text-[10px] text-[#0284C7] font-semibold">Campus UTTT</span>
            </h2>
            <ol class="relative pl-6 space-y-4">
              <li
                class="absolute left-2.5 top-2 bottom-2 w-0.5 bg-[#8AA9C4]/40"
                aria-hidden="true"
              />
              <li class="relative">
                <div
                  class="absolute -left-6 top-0.5 w-3.5 h-3.5 rounded-full bg-[#1D2D44] border-2 border-white"
                />
                <div class="text-xs">
                  <span class="font-bold text-[#1D2D44] block">Punto de Partida (UTTT)</span>
                  <span class="text-[11px] text-[#3E5C76]">{{ viaje.puntoEncuentro.nombre }}</span>
                  <span
                    v-if="viaje.puntoEncuentro.descripcion"
                    class="text-[10px] text-[#4B5563] block"
                  >
                    {{ viaje.puntoEncuentro.descripcion }}
                  </span>
                  <span class="text-[10px] text-[#4B5563] block font-mono">
                    {{ horaCorta(viaje.fechaSalida) }}
                  </span>
                </div>
              </li>
              <li v-for="p in viaje.paradas" :key="p.orden" class="relative">
                <div
                  class="absolute -left-6 top-1 w-3 h-3 rounded-full bg-[#0284C7] border-2 border-white"
                />
                <div class="text-xs">
                  <span class="font-semibold text-[#1D2D44]"
                    >Parada {{ p.orden }}: {{ p.nombre }}</span
                  >
                  <span class="text-[10px] text-[#4B5563] block">Parada intermedia</span>
                </div>
              </li>
              <li class="relative">
                <div
                  class="absolute -left-6 top-0.5 w-3.5 h-3.5 rounded-full bg-emerald-600 border-2 border-white"
                />
                <div class="text-xs">
                  <span class="font-bold text-[#1D2D44] block">Destino Final</span>
                  <span class="text-[11px] text-[#3E5C76] font-medium">{{ viaje.destino }}</span>
                </div>
              </li>
            </ol>
            <div v-if="reservaConMapa" class="mt-3 pt-3 border-t border-[#EDEDED]">
              <RouterLink
                :to="{ name: 'mapa-reserva', params: { id: reservaConMapa.id } }"
                class="w-full py-2 px-3 rounded-xl bg-[#EAF2F8] text-[#1D2D44] text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-[#C9DCE8] transition-colors"
              >
                <Navigation class="w-3.5 h-3.5 text-[#0284C7]" aria-hidden="true" />
                <span>Ver Ubicación y Mapa en Tiempo Real</span>
              </RouterLink>
            </div>
          </section>

          <!-- Conductor -->
          <section class="p-4 rounded-2xl bg-white border border-[#C9DCE8] shadow-xs">
            <h2 class="text-xs font-bold uppercase tracking-wider text-[#3E5C76] mb-2.5 font-sans">
              Conductor Universitario Verificado
            </h2>
            <FichaConductor :conductor="viaje.conductor" :es-pasajero="!viaje.esPropietario" />
          </section>

          <!-- Vehículo -->
          <section class="p-4 rounded-2xl bg-white border border-[#C9DCE8] shadow-xs">
            <h2 class="text-xs font-bold uppercase tracking-wider text-[#3E5C76] mb-2 font-sans">
              Vehículo de Traslado
            </h2>
            <div class="flex items-center justify-between text-xs gap-2">
              <div class="flex items-center gap-2.5 min-w-0">
                <div
                  class="w-9 h-9 rounded-xl bg-[#EAF2F8] flex items-center justify-center text-[#3E5C76] shrink-0"
                >
                  <Car class="w-5 h-5" aria-hidden="true" />
                </div>
                <div class="min-w-0">
                  <span class="font-bold text-[#1D2D44] block">
                    {{ viaje.vehiculo.modelo }} ({{ viaje.vehiculo.anio }})
                  </span>
                  <span class="text-[10px] text-[#4B5563]">
                    Color: {{ viaje.vehiculo.color }} • Placas:
                    <strong class="font-mono text-[#1D2D44]">{{ viaje.vehiculo.placas }}</strong>
                  </span>
                </div>
              </div>
              <span
                v-if="viaje.vehiculo.verificado"
                class="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shrink-0"
              >
                Verificado
              </span>
            </div>
            <div
              v-if="viaje.notas"
              class="mt-3 p-2.5 rounded-xl bg-[#F8FAFC] border border-[#EDEDED] text-[11px] text-[#3E5C76] whitespace-pre-line"
            >
              <span class="font-bold text-[#1D2D44]">Nota del conductor: </span>{{ viaje.notas }}
            </div>
          </section>

          <!-- Cupos -->
          <section class="p-4 rounded-2xl bg-white border border-[#C9DCE8] shadow-xs">
            <div class="flex items-center justify-between">
              <h2 class="text-xs font-bold uppercase tracking-wider text-[#3E5C76] font-sans">
                Cupos del Viaje ({{ viaje.asientosOfrecidos }})
              </h2>
              <span
                class="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full"
              >
                {{ viaje.asientosDisponibles }} cupos restantes
              </span>
            </div>
            <p class="text-xs text-[#4B5563] mt-1">
              {{ viaje.asientosDisponibles }} disponibles de {{ viaje.asientosOfrecidos }}
            </p>
          </section>
        </div>

        <!-- Columna lateral (PC): reserva, ubicación y acciones -->
        <aside class="space-y-4 lg:sticky lg:top-20">
          <PanelReserva
            v-if="esEscritorio && !viaje.esPropietario && viaje.estado !== 'Borrador'"
            lateral
            :viaje="viaje"
            @reservada="alReservar"
            @actualizar="recargar"
          />

          <!-- P8 (conductor): comparte su posición con los pasajeros confirmados -->
          <CompartirUbicacion v-if="puedeCompartirUbicacion" :viaje-id="viaje.id" />

          <div
            v-if="
              (viaje.estado === 'Borrador' && viaje.esPropietario) ||
              (viaje.estado === 'Programado' && viaje.esPropietario) ||
              (viaje.estado === 'EnCurso' && viaje.esPropietario) ||
              editable
            "
            class="space-y-2"
          >
            <BaseButton
              v-if="viaje.estado === 'Borrador' && viaje.esPropietario"
              variante="acento"
              bloque
              :cargando="publicando"
              @click="publicarBorrador"
            >
              Publicar ahora
            </BaseButton>
            <BaseButton
              v-if="viaje.estado === 'Programado' && viaje.esPropietario"
              variante="acento"
              bloque
              :cargando="iniciando"
              @click="iniciarViaje"
            >
              Iniciar viaje
            </BaseButton>
            <BaseButton
              v-if="viaje.estado === 'EnCurso' && viaje.esPropietario"
              variante="acento"
              bloque
              :cargando="finalizando"
              @click="finalizarViaje"
            >
              Finalizar viaje
            </BaseButton>
            <BaseButton
              v-if="editable"
              variante="secundario"
              bloque
              @click="router.push({ name: 'viaje-editar', params: { id: viaje.id } })"
            >
              EDITAR VIAJE
            </BaseButton>
          </div>
        </aside>
      </template>
    </div>

    <!-- P7 (celular y tablet): el pasajero aparta 1 o 2 asientos; en PC va en la columna lateral -->
    <PanelReserva
      v-if="!esEscritorio && viaje && !viaje.esPropietario && viaje.estado !== 'Borrador'"
      :viaje="viaje"
      @reservada="alReservar"
      @actualizar="recargar"
    />
  </main>
</template>
