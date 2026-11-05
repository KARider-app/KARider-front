<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { fechaHora, mxn } from '@/core/utils/formato'
import AlertMessage from '@/shared/components/AlertMessage.vue'
import BaseButton from '@/shared/components/BaseButton.vue'
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
</script>

<template>
  <main class="pantalla">
    <header>
      <h1 class="pantalla__titulo">Tu viaje</h1>
      <p v-if="reserva" class="pantalla__subtitulo">
        {{ reserva.viaje.puntoEncuentro.nombre }} → {{ reserva.viaje.destino }}
      </p>
    </header>

    <p v-if="cargando && !reserva" class="texto-suave centrado">Cargando tu reserva…</p>
    <AlertMessage v-if="error" tipo="error">{{ mensajeDeError(error) }}</AlertMessage>

    <template v-if="reserva">
      <!-- Tarjeta de confirmación -->
      <section class="tarjeta confirmacion" aria-label="Confirmación de la reserva">
        <span class="texto-suave">Folio de reserva</span>
        <strong class="folio">{{ reserva.folio }}</strong>
        <BaseButton variante="secundario" @click="copiarFolio">Copiar folio de reserva</BaseButton>
        <p v-if="copiado" class="toast" role="status">Folio copiado</p>
        <p v-if="errorCopia" class="texto-suave" role="alert">
          No pudimos copiarlo. Mantén presionado el folio para copiarlo.
        </p>

        <dl class="datos">
          <div>
            <dt>Punto de encuentro</dt>
            <dd>
              {{ reserva.viaje.puntoEncuentro.nombre }} · {{ fechaHora(reserva.viaje.fechaSalida) }}
            </dd>
          </div>
          <div>
            <dt>Asientos y aporte</dt>
            <dd>
              {{ reserva.asientos }} {{ reserva.asientos === 1 ? 'asiento' : 'asientos' }} ·
              {{ mxn(reserva.montoAporte) }}
            </dd>
          </div>
        </dl>
        <AlertMessage tipo="info">Recuerda mostrar tu credencial UTTT al abordar.</AlertMessage>
      </section>

      <AlertMessage v-if="textoEstadoReserva" tipo="aviso">{{ textoEstadoReserva }}</AlertMessage>

      <template v-if="confirmada">
        <AlertMessage v-if="!viajeActivo" tipo="aviso">
          El viaje ya terminó o fue cancelado, por eso dejamos de mostrar la ubicación del
          conductor.
        </AlertMessage>

        <MapaRuta
          v-if="puntoEncuentro"
          :punto-encuentro="puntoEncuentro"
          :destino="puntoDestino"
          :conductor="viajeActivo ? puntoConductor : null"
        />

        <AlertMessage v-if="sinConexion" tipo="aviso">
          Sin conexión, mostrando la última ubicación disponible.
        </AlertMessage>
        <AlertMessage v-if="viajeActivo && esperandoConductor && !ubicacion" tipo="info">
          Esperando la ubicación del conductor.
        </AlertMessage>

        <section v-if="viajeActivo && ubicacion" class="tarjeta estimacion" aria-live="polite">
          <div>
            <span class="texto-suave">Llegada estimada</span>
            <strong>{{ minutos === null ? '—' : textoTiempo(minutos) }}</strong>
          </div>
          <div>
            <span class="texto-suave">Distancia restante</span>
            <strong>{{ distancia === null ? '—' : textoDistancia(distancia) }}</strong>
          </div>
          <p class="texto-suave nota">
            Estimación en línea recta a velocidad urbana. Actualizado
            {{ fechaHora(ubicacion.actualizadaEn) }}.
          </p>
        </section>
      </template>

      <RouterLink :to="{ name: 'viaje', params: { id: reserva.viaje.id } }" class="centrado">
        Ver detalle del viaje
      </RouterLink>
    </template>

    <RouterLink :to="{ name: 'mis-reservas' }" class="centrado">Mis reservas</RouterLink>
  </main>
</template>

<style scoped>
.confirmacion {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--espacio-3);
  text-align: center;
}

.folio {
  font-size: 1.5rem;
  letter-spacing: 0.04em;
  overflow-wrap: anywhere;
}

.toast {
  padding: var(--espacio-1) var(--espacio-3);
  border-radius: var(--radio-pill);
  background: var(--color-exito-claro);
  color: var(--color-exito);
  font-size: 0.875rem;
  font-weight: 700;
}

.datos {
  display: flex;
  flex-direction: column;
  gap: var(--espacio-3);
  width: 100%;
  margin: 0;
  text-align: left;
}

.datos dt {
  font-size: 0.8125rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--color-texto-suave);
}

.datos dd {
  margin: 0;
}

.estimacion {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--espacio-3);
  text-align: center;
}

.estimacion div {
  display: flex;
  flex-direction: column;
}

.estimacion strong {
  font-size: 1.5rem;
}

.nota {
  grid-column: 1 / -1;
}
</style>
