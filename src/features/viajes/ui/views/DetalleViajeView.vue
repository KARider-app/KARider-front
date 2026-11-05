<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fechaHora, mxn } from '@/core/utils/formato'
import CompartirUbicacion from '@/features/reservas/ui/components/CompartirUbicacion.vue'
import FichaConductor from '@/features/reservas/ui/components/FichaConductor.vue'
import PanelReserva from '@/features/reservas/ui/components/PanelReserva.vue'
import type { Reserva } from '@/features/reservas/domain/tipos'
import AlertMessage from '@/shared/components/AlertMessage.vue'
import BaseButton from '@/shared/components/BaseButton.vue'
import { mensajeDeError } from '@/shared/composables/useApiError'
import { useDetalleViaje } from '../../application/useDetalleViaje'
import { esEditable } from '../../domain/aporte'
import type { EstadoViaje } from '../../domain/tipos'
import TarjetaVehiculo from '../components/TarjetaVehiculo.vue'

const route = useRoute()
const router = useRouter()
const { viaje, cargando, error, publicando, cargar, publicarBorrador } = useDetalleViaje()

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
</script>

<template>
  <main class="pantalla">
    <p v-if="cargando && !viaje" class="texto-suave centrado">Cargando viaje…</p>

    <AlertMessage v-if="error" tipo="error">{{ mensajeDeError(error) }}</AlertMessage>
    <AlertMessage v-if="recienEditado" tipo="exito">Cambios guardados.</AlertMessage>

    <template v-if="viaje">
      <AlertMessage v-if="recienPublicado && viaje.estado === 'Programado'" tipo="exito">
        ¡Tu ruta ya está publicada en el campus UTTT!
      </AlertMessage>
      <AlertMessage v-if="folioNuevo && viaje.miReserva" tipo="exito">
        Solicitud enviada. Tu folio es {{ folioNuevo }}.
      </AlertMessage>

      <header class="cabecera">
        <span class="estado" :class="`estado--${viaje.estado}`">{{
          textoEstado[viaje.estado]
        }}</span>
        <h1 class="pantalla__titulo">{{ viaje.puntoEncuentro.nombre }} → {{ viaje.destino }}</h1>
        <p class="pantalla__subtitulo">{{ fechaHora(viaje.fechaSalida) }}</p>
      </header>

      <section class="aporte tarjeta" aria-label="Aporte solidario">
        <span>Aporte por pasajero</span>
        <strong>{{ mxn(viaje.aportePorAsiento) }}</strong>
        <span class="texto-suave">Gasto total {{ mxn(viaje.gastoTotal) }}</span>
      </section>

      <section class="tarjeta datos">
        <div>
          <h2 class="seccion-titulo">Punto de encuentro</h2>
          <p>{{ viaje.puntoEncuentro.nombre }}</p>
          <p class="texto-suave">{{ viaje.puntoEncuentro.descripcion }}</p>
        </div>
        <div v-if="viaje.paradas.length">
          <h2 class="seccion-titulo">Paradas intermedias</h2>
          <ol class="paradas">
            <li v-for="p in viaje.paradas" :key="p.orden">{{ p.nombre }}</li>
          </ol>
        </div>
        <div>
          <h2 class="seccion-titulo">Asientos</h2>
          <p>{{ viaje.asientosDisponibles }} disponibles de {{ viaje.asientosOfrecidos }}</p>
        </div>
        <div>
          <h2 class="seccion-titulo">Conductor</h2>
          <FichaConductor :conductor="viaje.conductor" :es-pasajero="!viaje.esPropietario" />
        </div>
        <div>
          <h2 class="seccion-titulo">Vehículo</h2>
          <TarjetaVehiculo v-bind="viaje.vehiculo" />
        </div>
        <div v-if="viaje.notas">
          <h2 class="seccion-titulo">Notas para los pasajeros</h2>
          <p class="notas">{{ viaje.notas }}</p>
        </div>
      </section>

      <!-- P7: el pasajero aparta 1 o 2 asientos -->
      <PanelReserva
        v-if="!viaje.esPropietario && viaje.estado !== 'Borrador'"
        :viaje="viaje"
        @reservada="alReservar"
        @actualizar="recargar"
      />

      <!-- P8 (conductor): comparte su posición con los pasajeros confirmados -->
      <CompartirUbicacion v-if="puedeCompartirUbicacion" :viaje-id="viaje.id" />

      <BaseButton
        v-if="viaje.estado === 'Borrador' && viaje.esPropietario"
        variante="acento"
        bloque
        :cargando="publicando"
        @click="publicarBorrador"
      >
        PUBLICAR AHORA
      </BaseButton>
      <BaseButton
        v-if="editable"
        variante="secundario"
        bloque
        @click="router.push({ name: 'viaje-editar', params: { id: viaje.id } })"
      >
        EDITAR VIAJE
      </BaseButton>
      <RouterLink v-if="!viaje.esPropietario" :to="{ name: 'buscar' }" class="centrado">
        Volver a la búsqueda
      </RouterLink>
      <RouterLink :to="{ name: 'inicio' }" class="centrado">Ir al inicio</RouterLink>
    </template>
  </main>
</template>

<style scoped>
.cabecera {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--espacio-1);
}

.estado {
  padding: 2px var(--espacio-3);
  border-radius: var(--radio-pill);
  background: #e6ebf2;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
}

.estado--Programado,
.estado--EnCurso {
  background: var(--color-exito-claro);
  color: var(--color-exito);
}

.estado--Borrador {
  background: var(--color-aviso-claro);
  color: var(--color-aviso);
}

.estado--Cancelado {
  background: var(--color-error-claro);
  color: var(--color-error);
}

.aporte {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: var(--color-primario);
  color: #fff;
}

.aporte strong {
  font-size: 2.5rem;
  line-height: 1.1;
}

.aporte .texto-suave {
  color: #c6d2e3;
}

.datos {
  display: flex;
  flex-direction: column;
  gap: var(--espacio-4);
}

.paradas {
  margin: 0;
  padding-left: var(--espacio-5);
}

.notas {
  white-space: pre-line;
  overflow-wrap: anywhere;
}
</style>
