<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  ArrowLeft,
  ArrowRight,
  Car,
  Check,
  CircleCheck,
  Copy,
  MapPin,
  MessageSquare,
  Navigation,
  Phone,
} from 'lucide-vue-next'
import { enlaceLlamada, enlaceWhatsApp } from '@/core/utils/contacto'
import { fechaHora, horaCorta, mxn } from '@/core/utils/formato'
import AlertMessage from '@/shared/components/AlertMessage.vue'
import AvatarUsuario from '@/shared/components/AvatarUsuario.vue'
import { mensajeDeError } from '@/shared/composables/useApiError'
import { useMapaReserva } from '../../application/useMapaReserva'
import { textoDistancia, textoTiempo, type PuntoMapa } from '../../domain/geo'
import MapaRuta from '../components/MapaRuta.vue'

const route = useRoute()
const {
  reserva,
  ubicacion,
  destino,
  cargando,
  error,
  esperandoConductor,
  sinConexion,
  confirmada,
  viajeActivo,
  distancia,
  minutos,
  cargar,
} = useMapaReserva()

watch(
  () => route.params.id,
  (id) => {
    if (typeof id === 'string') void cargar(id)
  },
  { immediate: true },
)

const puntoEncuentro = computed<PuntoMapa | null>(() => {
  const p = reserva.value?.viaje.puntoEncuentro
  return p ? { latitud: p.latitud, longitud: p.longitud, etiqueta: p.nombre } : null
})

const puntoDestino = computed<PuntoMapa | null>(() =>
  destino.value
    ? {
        latitud: destino.value.latitud,
        longitud: destino.value.longitud,
        etiqueta: destino.value.nombre,
      }
    : null,
)

const puntoConductor = computed<PuntoMapa | null>(() =>
  ubicacion.value && reserva.value
    ? {
        latitud: ubicacion.value.latitud,
        longitud: ubicacion.value.longitud,
        etiqueta: reserva.value.viaje.conductor.nombreCompleto,
      }
    : null,
)

const textoEstadoReserva = computed(() => {
  switch (reserva.value?.estado) {
    case 'Pendiente':
      return 'Tu solicitud está pendiente: el conductor debe aceptarla para que puedas ver su ubicación.'
    case 'Rechazada':
      return 'El conductor no aceptó tu solicitud.'
    case 'Cancelada':
      return 'Esta reserva fue cancelada.'
    case 'Completada':
      return 'Este viaje ya se completó.'
    default:
      return null
  }
})

// Copiar el folio con aviso breve (toast) sin recargar la pantalla.
const copiado = ref(false)
const errorCopia = ref(false)
let temporizadorToast: ReturnType<typeof setTimeout> | null = null

async function copiarFolio() {
  if (!reserva.value) return
  errorCopia.value = false
  try {
    await navigator.clipboard.writeText(reserva.value.folio)
    copiado.value = true
    if (temporizadorToast !== null) clearTimeout(temporizadorToast)
    temporizadorToast = setTimeout(() => (copiado.value = false), 2500)
  } catch {
    errorCopia.value = true
  }
}

onBeforeUnmount(() => {
  if (temporizadorToast !== null) clearTimeout(temporizadorToast)
})

const gpsEnVivo = computed(() => confirmada.value && viajeActivo.value && !!ubicacion.value)
</script>

<template>
  <main class="flex flex-col min-h-full flex-1 bg-[#F3F7FA] text-[#1D2D44] relative">
    <header class="bg-[#1D2D44] text-white px-4 pt-3.5 pb-3 shadow-md z-20 shrink-0">
      <div class="flex items-center justify-between mb-1.5">
        <RouterLink
          :to="{ name: 'mis-reservas' }"
          class="flex items-center gap-1 text-xs text-[#C9DCE8] hover:text-white transition-colors"
        >
          <ArrowLeft class="w-4 h-4" aria-hidden="true" />
          <span>Volver</span>
        </RouterLink>
        <div
          v-if="gpsEnVivo"
          class="flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-400/40 px-2.5 py-0.5 rounded-full"
        >
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
          <span class="text-[10px] font-bold text-emerald-300 tracking-wide uppercase">
            GPS En Vivo • PWA
          </span>
        </div>
        <span class="text-[11px] font-mono font-semibold text-[#8AA9C4]">
          {{ reserva?.folio }}
        </span>
      </div>
      <div class="flex items-center justify-between gap-2">
        <div class="min-w-0">
          <h1 class="text-sm font-extrabold text-white flex items-center gap-1.5 font-sans">
            <Navigation class="w-4 h-4 text-[#0284C7]" aria-hidden="true" />
            <span>Mapa de Ubicación y Ruta</span>
          </h1>
          <p v-if="reserva" class="text-[11px] text-[#C9DCE8] truncate max-w-[240px]">
            {{ reserva.viaje.puntoEncuentro.nombre }} → {{ reserva.viaje.destino }}
          </p>
        </div>
        <div v-if="reserva" class="text-right shrink-0">
          <span class="text-xs font-black text-white bg-white/10 px-2 py-0.5 rounded-lg block">
            {{ mxn(reserva.montoAporte) }} MXN
          </span>
          <span class="text-[9px] text-[#8AA9C4]">{{ reserva.estado.toLowerCase() }}</span>
        </div>
      </div>
    </header>

    <!-- Aviso breve (toast) al copiar el folio -->
    <div v-if="copiado" class="absolute top-16 left-4 right-4 z-40" role="status">
      <div
        class="p-2.5 rounded-xl bg-[#111827] text-white border border-emerald-500/50 shadow-xl flex items-center gap-2 text-xs"
      >
        <CircleCheck class="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
        <span class="font-medium">Folio copiado</span>
      </div>
    </div>

    <p v-if="cargando && !reserva" class="py-8 text-center text-xs text-[#4B5563]">
      Cargando tu reserva…
    </p>
    <div v-if="error" class="p-4">
      <AlertMessage tipo="error">{{ mensajeDeError(error) }}</AlertMessage>
    </div>

    <template v-if="reserva">
      <!-- Mapa en tiempo real (HU-08) -->
      <div
        v-if="confirmada && puntoEncuentro"
        class="relative w-full shrink-0 border-b border-[#C9DCE8]"
      >
        <MapaRuta
          :punto-encuentro="puntoEncuentro"
          :destino="puntoDestino"
          :conductor="viajeActivo ? puntoConductor : null"
        />
        <div
          v-if="viajeActivo && ubicacion"
          class="absolute left-3 bottom-3 right-3 z-[500]"
          aria-live="polite"
        >
          <div
            class="px-3 py-1.5 rounded-xl bg-[#111827]/90 backdrop-blur-md text-white border border-white/20 shadow-lg flex items-center justify-between gap-2"
          >
            <div class="flex items-center gap-2">
              <Car class="w-4 h-4 text-[#0284C7] animate-pulse shrink-0" aria-hidden="true" />
              <div class="leading-tight">
                <span class="text-[10px] text-[#C9DCE8] block">Conductor en camino:</span>
                <span class="text-xs font-bold text-white">
                  Llega en {{ minutos === null ? '—' : `~${textoTiempo(minutos)}` }}
                  <template v-if="distancia !== null">({{ textoDistancia(distancia) }})</template>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="flex-1 p-4 space-y-3 pb-6">
        <AlertMessage v-if="textoEstadoReserva" tipo="aviso">{{ textoEstadoReserva }}</AlertMessage>

        <template v-if="confirmada">
          <AlertMessage v-if="!viajeActivo" tipo="aviso">
            El viaje ya terminó o fue cancelado, por eso dejamos de mostrar la ubicación del
            conductor.
          </AlertMessage>
          <AlertMessage v-if="sinConexion" tipo="aviso">
            Sin conexión, mostrando la última ubicación disponible.
          </AlertMessage>
          <AlertMessage v-if="viajeActivo && esperandoConductor && !ubicacion" tipo="info">
            Esperando la ubicación del conductor.
          </AlertMessage>
        </template>

        <!-- Tarjeta de confirmación -->
        <section
          class="p-3.5 rounded-2xl bg-white border border-[#C9DCE8] shadow-xs"
          aria-label="Confirmación de la reserva"
        >
          <div class="flex items-center justify-between gap-2 pb-2.5 border-b border-[#EDEDED]">
            <div class="flex items-center gap-2">
              <div
                class="w-7 h-7 rounded-lg flex items-center justify-center"
                :class="
                  confirmada ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                "
              >
                <CircleCheck class="w-4 h-4" aria-hidden="true" />
              </div>
              <div>
                <span class="text-xs font-extrabold text-[#1D2D44] block">
                  {{ confirmada ? '¡Reserva Confirmada!' : `Reserva ${reserva.estado}` }}
                </span>
                <span class="text-[10px] text-[#4B5563]">
                  {{ confirmada ? 'Asiento asegurado en el carpooling' : 'Folio de reserva' }}
                </span>
              </div>
            </div>
            <button
              type="button"
              class="px-2.5 py-1 rounded-lg bg-[#EAF2F8] border border-[#C9DCE8] text-[11px] font-mono font-bold text-[#1D2D44] flex items-center gap-1 hover:bg-[#C9DCE8] transition-colors"
              :aria-label="`Copiar folio de reserva ${reserva.folio}`"
              @click="copiarFolio"
            >
              <Check v-if="copiado" class="w-3 h-3 text-emerald-600" aria-hidden="true" />
              <Copy v-else class="w-3 h-3 text-[#3E5C76]" aria-hidden="true" />
              <span>{{ reserva.folio }}</span>
            </button>
          </div>
          <p v-if="errorCopia" class="pt-2 text-[10px] text-red-600" role="alert">
            No pudimos copiarlo. Mantén presionado el folio para copiarlo.
          </p>
          <div class="pt-2 text-[11px] text-[#3E5C76] flex items-center justify-between gap-2">
            <span>Muestra tu credencial UTTT al conductor al abordar.</span>
            <span class="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded shrink-0">
              {{ reserva.asientos }} {{ reserva.asientos === 1 ? 'asiento' : 'asientos' }}
            </span>
          </div>
        </section>

        <!-- Punto de encuentro -->
        <section class="p-3.5 rounded-2xl bg-white border border-[#C9DCE8] shadow-xs">
          <div class="flex items-start gap-2.5">
            <div
              class="w-8 h-8 rounded-xl bg-[#0284C7]/15 flex items-center justify-center text-[#0284C7] shrink-0 mt-0.5"
            >
              <MapPin class="w-4 h-4" aria-hidden="true" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between gap-2">
                <h2 class="text-[10px] font-bold uppercase tracking-wider text-[#0284C7] font-sans">
                  Punto de Encuentro Campus UTTT
                </h2>
                <span class="text-[10px] font-bold text-[#1D2D44] shrink-0">
                  {{ horaCorta(reserva.viaje.fechaSalida) }}
                </span>
              </div>
              <div class="text-xs font-bold text-[#1D2D44] mt-0.5">
                {{ reserva.viaje.puntoEncuentro.nombre }}
              </div>
              <p
                v-if="reserva.viaje.puntoEncuentro.descripcion"
                class="text-[11px] text-[#4B5563] mt-1 leading-relaxed"
              >
                {{ reserva.viaje.puntoEncuentro.descripcion }}
              </p>
              <div
                class="mt-2.5 pt-2 border-t border-[#EDEDED] text-[10px] font-mono text-[#3E5C76]"
              >
                {{ fechaHora(reserva.viaje.fechaSalida) }} · GPS:
                {{ reserva.viaje.puntoEncuentro.latitud.toFixed(4) }},
                {{ reserva.viaje.puntoEncuentro.longitud.toFixed(4) }}
              </div>
            </div>
          </div>
        </section>

        <!-- Conductor -->
        <section class="p-3.5 rounded-2xl bg-white border border-[#C9DCE8] shadow-xs">
          <div class="flex items-center justify-between gap-2 pb-3 border-b border-[#EDEDED]">
            <div class="flex items-center gap-3 min-w-0">
              <AvatarUsuario
                :nombre="reserva.viaje.conductor.nombreCompleto"
                :foto-url="reserva.viaje.conductor.fotoUrl"
                clase="w-11 h-11 border-2 border-[#8AA9C4]"
                clase-insignia="w-3 h-3"
              />
              <div class="min-w-0">
                <div class="text-xs font-bold text-[#1D2D44] truncate">
                  {{ reserva.viaje.conductor.nombreCompleto }}
                </div>
                <div class="text-[10px] text-[#4B5563] truncate">{{ reserva.viaje.vehiculo }}</div>
                <div
                  v-if="reserva.viaje.conductor.calificacion > 0"
                  class="text-[10px] text-amber-700 font-semibold flex items-center gap-1 mt-0.5"
                >
                  <span>★ {{ reserva.viaje.conductor.calificacion.toFixed(1) }}</span>
                  <span class="text-[#4B5563] font-normal">• Conductor Verificado</span>
                </div>
              </div>
            </div>
            <div v-if="reserva.viaje.placas" class="text-right shrink-0">
              <span class="text-[9px] text-[#4B5563] block">Placas de auto:</span>
              <span
                class="text-xs font-mono font-black text-[#1D2D44] bg-[#EAF2F8] px-2 py-0.5 rounded border border-[#C9DCE8]"
              >
                {{ reserva.viaje.placas }}
              </span>
            </div>
          </div>
          <div v-if="reserva.viaje.conductor.telefono" class="mt-3 grid grid-cols-2 gap-2 text-xs">
            <a
              :href="enlaceWhatsApp(reserva.viaje.conductor.telefono)"
              target="_blank"
              rel="noopener noreferrer"
              class="py-1.5 px-3 rounded-xl bg-[#EAF2F8] text-[#1D2D44] font-semibold flex items-center justify-center gap-1.5 hover:bg-[#C9DCE8] transition-colors"
            >
              <MessageSquare class="w-3.5 h-3.5 text-[#0284C7]" aria-hidden="true" />
              <span>Enviar Mensaje</span>
            </a>
            <a
              :href="enlaceLlamada(reserva.viaje.conductor.telefono)"
              class="py-1.5 px-3 rounded-xl bg-[#EAF2F8] text-[#1D2D44] font-semibold flex items-center justify-center gap-1.5 hover:bg-[#C9DCE8] transition-colors"
            >
              <Phone class="w-3.5 h-3.5 text-[#3E5C76]" aria-hidden="true" />
              <span>Llamar por Tel</span>
            </a>
          </div>
        </section>

        <p v-if="viajeActivo && ubicacion" class="text-[10px] text-[#4B5563] text-center">
          Estimación en línea recta a velocidad urbana. Actualizado
          {{ fechaHora(ubicacion.actualizadaEn) }}.
        </p>

        <div class="pt-2 space-y-2">
          <RouterLink
            :to="{ name: 'viaje', params: { id: reserva.viaje.id } }"
            class="w-full py-3 rounded-xl bg-[#1D2D44] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#3E5C76] transition-all shadow-md flex items-center justify-center gap-2"
          >
            <span>Ver detalle del viaje</span>
            <ArrowRight class="w-4 h-4" aria-hidden="true" />
          </RouterLink>
          <RouterLink
            :to="{ name: 'mis-reservas' }"
            class="block w-full py-2 rounded-xl text-xs font-semibold text-center text-[#4B5563] hover:text-[#1D2D44]"
          >
            Mis reservas
          </RouterLink>
        </div>
      </div>
    </template>
  </main>
</template>
