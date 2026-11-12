<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { fechaHora, mxn } from '@/core/utils/formato'
import AlertMessage from '@/shared/components/AlertMessage.vue'
import { mensajeDeError } from '@/shared/composables/useApiError'
import { usePerfil } from '../../application/usePerfil'
import type { FiltroRolHistorial } from '../../domain/tipos'
import EvaluarCompanero from '../components/EvaluarCompanero.vue'

const {
  perfil,
  cargandoPerfil,
  errorPerfil,
  cargarPerfil,
  historial,
  cargandoHistorial,
  errorHistorial,
  filtroRol,
  cargarHistorial,
  reputacion,
  cargandoReputacion,
  errorReputacion,
  cargarReputacion,
  credenciales,
  cargandoCredenciales,
  errorCredenciales,
  cargarCredenciales,
  cargarPendientes,
  pendientePara,
} = usePerfil()

type Pestana = 'historial' | 'calificacion' | 'credenciales'
const pestana = ref<Pestana>('historial')

const pestanas: { valor: Pestana; texto: string }[] = [
  { valor: 'historial', texto: 'Historial Viajes' },
  { valor: 'calificacion', texto: 'Calificación Mutua' },
  { valor: 'credenciales', texto: 'Credenciales UTTT' },
]

const filtrosRol: { valor: FiltroRolHistorial; texto: string }[] = [
  { valor: 'Todos', texto: 'Todos' },
  { valor: 'Pasajero', texto: 'Pasajero' },
  { valor: 'Conductor', texto: 'Conductor' },
]

const reputacionCargada = ref(false)
const credencialesCargadas = ref(false)

function cambiarPestana(p: Pestana) {
  pestana.value = p
  if (p === 'calificacion' && !reputacionCargada.value) {
    reputacionCargada.value = true
    void cargarReputacion()
  }
  if (p === 'credenciales' && !credencialesCargadas.value) {
    credencialesCargadas.value = true
    void cargarCredenciales()
  }
}

const iniciales = computed(() => {
  const partes = (perfil.value?.nombreCompleto ?? '').trim().split(/\s+/)
  return partes
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
})

const textoRolEnViaje: Record<string, string> = {
  Pasajero: 'Como pasajero',
  Conductor: 'Como conductor',
}

onMounted(() => {
  void cargarPerfil()
  void cargarHistorial('Todos')
  void cargarPendientes()
})
</script>

<template>
  <main class="pantalla">
    <header class="encabezado">
      <RouterLink :to="{ name: 'inicio' }" class="encabezado__volver">← Volver</RouterLink>
      <span v-if="perfil?.correoVerificado" class="insignia-verificado">✓ Verificado</span>
    </header>

    <AlertMessage v-if="errorPerfil" tipo="error">{{ mensajeDeError(errorPerfil) }}</AlertMessage>
    <p v-if="cargandoPerfil && !perfil" class="texto-suave centrado">Cargando tu perfil…</p>

    <template v-if="perfil">
      <section class="tarjeta identidad">
        <span class="identidad__avatar" aria-hidden="true">
          <img v-if="perfil.fotoUrl" :src="perfil.fotoUrl" alt="" />
          <span v-else>{{ iniciales }}</span>
        </span>
        <strong class="identidad__nombre">{{ perfil.nombreCompleto }}</strong>
        <span class="texto-suave">
          {{ perfil.carrera }}<template v-if="perfil.cuatrimestre">
            · {{ perfil.cuatrimestre }}.º cuatrimestre</template
          >
        </span>
        <div class="identidad__fila">
          <span class="chip-dato">Matrícula: {{ perfil.matricula }}</span>
          <span class="identidad__estrellas">
            ★ {{ perfil.calificacion.toFixed(2) }} / 5.0
            <span class="texto-suave">({{ perfil.totalCalificaciones }})</span>
          </span>
        </div>
      </section>

      <section class="estadisticas" aria-label="Estadísticas">
        <div class="tarjeta estadistica">
          <strong class="estadistica__valor">{{ perfil.estadisticas.viajesRealizados }}</strong>
          <span class="estadistica__etiqueta">Viajes Hechos</span>
        </div>
        <div class="tarjeta estadistica estadistica--exito">
          <strong class="estadistica__valor">{{ mxn(perfil.estadisticas.ahorroCombustible) }}</strong>
          <span class="estadistica__etiqueta">Ahorro Gasolina</span>
        </div>
        <div class="tarjeta estadistica estadistica--acento">
          <strong class="estadistica__valor">{{ perfil.estadisticas.co2EvitadoKg.toFixed(0) }} kg</strong>
          <span class="estadistica__etiqueta">CO2 Evitado</span>
        </div>
      </section>

      <nav class="pestanas" aria-label="Secciones del perfil">
        <button
          v-for="p in pestanas"
          :key="p.valor"
          type="button"
          class="pestanas__opcion"
          :class="{ 'pestanas__opcion--activa': pestana === p.valor }"
          @click="cambiarPestana(p.valor)"
        >
          {{ p.texto }}
        </button>
      </nav>

      <!-- Historial Viajes -->
      <template v-if="pestana === 'historial'">
        <div class="filtro-rol" role="group" aria-label="Filtrar por rol">
          <button
            v-for="f in filtrosRol"
            :key="f.valor"
            type="button"
            class="filtro-rol__opcion"
            :class="{ 'filtro-rol__opcion--activa': filtroRol === f.valor }"
            @click="cargarHistorial(f.valor)"
          >
            {{ f.texto }}
          </button>
        </div>

        <h2 class="seccion-titulo">Registro histórico de viajes ({{ historial.length }})</h2>

        <AlertMessage v-if="errorHistorial" tipo="error">
          {{ mensajeDeError(errorHistorial) }}
        </AlertMessage>
        <p v-if="cargandoHistorial" class="texto-suave centrado">Cargando…</p>
        <p v-else-if="!errorHistorial && historial.length === 0" class="texto-suave centrado">
          No hay viajes en esta categoría todavía.
        </p>

        <ul class="lista">
          <li v-for="h in historial" :key="h.viajeId" class="tarjeta viaje-historial">
            <div class="viaje-historial__cabecera">
              <span class="rol-badge" :class="`rol-badge--${h.rolEnViaje}`">
                {{ textoRolEnViaje[h.rolEnViaje] }}
              </span>
              <strong>{{ mxn(h.monto) }}</strong>
            </div>
            <span class="texto-suave">📅 {{ fechaHora(h.fechaSalida) }}</span>
            <span class="viaje-historial__ruta">
              <span class="punto punto--origen" aria-hidden="true" /> {{ h.origen }}
              <br />
              <span class="punto punto--destino" aria-hidden="true" /> {{ h.destino }}
            </span>

            <span v-if="h.companero" class="texto-suave">
              Con: {{ h.companero.nombreCompleto }}
              <template v-if="h.companero.vehiculo">({{ h.companero.vehiculo }})</template>
              ★{{ h.companero.calificacion.toFixed(1) }}
            </span>

            <span v-if="h.aportePagado" class="texto-exito">✓ Aporte de combustible liquidado</span>

            <EvaluarCompanero
              v-if="h.companero && pendientePara(h.viajeId)"
              :viaje-id="h.viajeId"
              :evaluado-id="pendientePara(h.viajeId)!.evaluadoId"
              :evaluado-nombre="h.companero.nombreCompleto"
              @calificado="cargarPendientes"
            />
          </li>
        </ul>
      </template>

      <!-- Calificación Mutua -->
      <template v-else-if="pestana === 'calificacion'">
        <AlertMessage v-if="errorReputacion" tipo="error">
          {{ mensajeDeError(errorReputacion) }}
        </AlertMessage>
        <p v-if="cargandoReputacion && !reputacion" class="texto-suave centrado">Cargando…</p>

        <template v-if="reputacion">
          <section class="tarjeta reputacion">
            <span class="identidad__estrellas">
              ★ {{ reputacion.promedio.toFixed(2) }} / 5.0
              <span class="texto-suave">({{ reputacion.totalCalificaciones }} reseñas)</span>
            </span>
            <div v-if="reputacion.etiquetas.length" class="reputacion__etiquetas">
              <span v-for="e in reputacion.etiquetas" :key="e.etiqueta" class="chip-dato">
                {{ e.etiqueta }} × {{ e.total }}
              </span>
            </div>
          </section>

          <p v-if="reputacion.resenas.items.length === 0" class="texto-suave centrado">
            Aún no tienes reseñas.
          </p>
          <ul class="lista">
            <li v-for="r in reputacion.resenas.items" :key="r.id" class="tarjeta resena">
              <div class="viaje-historial__cabecera">
                <strong>{{ r.evaluadorNombre }}</strong>
                <span>★{{ r.estrellas }}</span>
              </div>
              <span class="texto-suave">{{ r.evaluadorCarrera }} · {{ fechaHora(r.creadoEn) }}</span>
              <div v-if="r.etiquetas.length" class="reputacion__etiquetas">
                <span v-for="e in r.etiquetas" :key="e" class="chip-dato">{{ e }}</span>
              </div>
              <p v-if="r.comentario">{{ r.comentario }}</p>
            </li>
          </ul>
        </template>
      </template>

      <!-- Credenciales UTTT -->
      <template v-else>
        <AlertMessage v-if="errorCredenciales" tipo="error">
          {{ mensajeDeError(errorCredenciales) }}
        </AlertMessage>
        <p v-if="cargandoCredenciales && !credenciales" class="texto-suave centrado">Cargando…</p>

        <template v-if="credenciales">
          <dl class="datos tarjeta">
            <div>
              <dt>Correo institucional</dt>
              <dd>
                {{ credenciales.correoInstitucional }}
                <span v-if="credenciales.correoVerificado" class="texto-exito">✓ Verificado</span>
              </dd>
            </div>
            <div>
              <dt>Matrícula</dt>
              <dd>{{ credenciales.matricula }}</dd>
            </div>
            <div>
              <dt>Carrera</dt>
              <dd>{{ credenciales.carrera }}</dd>
            </div>
            <div>
              <dt>Estatus</dt>
              <dd>{{ credenciales.estatus }}</dd>
            </div>
          </dl>

          <template v-if="credenciales.vehiculos.length">
            <h2 class="seccion-titulo">Vehículos registrados</h2>
            <ul class="lista">
              <li v-for="v in credenciales.vehiculos" :key="v.id" class="tarjeta vehiculo-credencial">
                <strong>{{ v.modelo }} {{ v.color }} · {{ v.anio }}</strong>
                <span class="texto-suave">
                  Placas {{ v.placas }} · {{ v.capacidad }} pasajeros
                  <span v-if="v.verificado" class="texto-exito">· Verificado</span>
                </span>
              </li>
            </ul>
          </template>
        </template>
      </template>
    </template>
  </main>
</template>

<style scoped>
.encabezado {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.encabezado__volver {
  color: var(--color-texto-suave);
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: none;
}

.insignia-verificado {
  padding: 2px var(--espacio-3);
  border-radius: var(--radio-pill);
  background: var(--color-exito-claro);
  color: var(--color-exito);
  font-size: 0.75rem;
  font-weight: 700;
}

.identidad {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--espacio-1);
  text-align: center;
}

.identidad__avatar {
  display: grid;
  place-items: center;
  width: 72px;
  height: 72px;
  margin-bottom: var(--espacio-2);
  border-radius: 50%;
  background: var(--color-acento-claro);
  color: var(--color-primario);
  font-size: 1.25rem;
  font-weight: 800;
  overflow: hidden;
}

.identidad__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.identidad__nombre {
  font-size: 1.125rem;
}

.identidad__fila {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: var(--espacio-2);
  margin-top: var(--espacio-2);
}

.chip-dato {
  padding: 2px var(--espacio-3);
  border-radius: var(--radio-pill);
  background: #e6ebf2;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-texto-suave);
}

.identidad__estrellas {
  font-weight: 700;
  color: var(--color-aviso);
}

.estadisticas {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--espacio-2);
}

.estadistica {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  text-align: center;
}

.estadistica__valor {
  font-size: 1.25rem;
  color: var(--color-primario);
}

.estadistica--exito .estadistica__valor {
  color: var(--color-exito);
}

.estadistica--acento .estadistica__valor {
  color: var(--color-acento);
}

.estadistica__etiqueta {
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: var(--color-texto-suave);
}

.pestanas {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--espacio-1);
  padding: var(--espacio-1);
  border-radius: var(--radio-pill);
  background: #e6ebf2;
}

.pestanas__opcion {
  min-height: 40px;
  padding: 0 var(--espacio-1);
  border: 0;
  border-radius: var(--radio-pill);
  background: transparent;
  color: var(--color-texto-suave);
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
}

.pestanas__opcion--activa {
  background: var(--color-primario);
  color: #fff;
  box-shadow: var(--sombra-sm);
}

.filtro-rol {
  display: flex;
  gap: var(--espacio-2);
}

.filtro-rol__opcion {
  padding: var(--espacio-1) var(--espacio-3);
  border: 1px solid var(--color-borde);
  border-radius: var(--radio-pill);
  background: var(--color-superficie);
  color: var(--color-texto-suave);
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
}

.filtro-rol__opcion--activa {
  border-color: var(--color-primario);
  background: var(--color-primario);
  color: #fff;
}

.seccion-titulo {
  font-size: 0.9375rem;
  font-weight: 700;
}

.lista {
  display: flex;
  flex-direction: column;
  gap: var(--espacio-3);
  margin: 0;
  padding: 0;
  list-style: none;
}

.viaje-historial,
.resena,
.vehiculo-credencial {
  display: flex;
  flex-direction: column;
  gap: var(--espacio-1);
}

.viaje-historial__cabecera {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--espacio-2);
}

.rol-badge {
  padding: 2px var(--espacio-3);
  border-radius: var(--radio-pill);
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
}

.rol-badge--Pasajero {
  background: var(--color-exito-claro);
  color: var(--color-exito);
}

.rol-badge--Conductor {
  background: var(--color-acento-claro);
  color: var(--color-acento);
}

.viaje-historial__ruta {
  font-size: 0.875rem;
  line-height: 1.8;
}

.punto {
  display: inline-block;
  width: 8px;
  height: 8px;
  margin-right: var(--espacio-1);
  border-radius: 50%;
}

.punto--origen {
  background: var(--color-primario);
}

.punto--destino {
  background: var(--color-exito);
}

.texto-exito {
  color: var(--color-exito);
  font-size: 0.8125rem;
  font-weight: 600;
}

.reputacion {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--espacio-2);
  text-align: center;
}

.reputacion__etiquetas {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--espacio-1);
}

.datos {
  display: flex;
  flex-direction: column;
  gap: var(--espacio-3);
  margin: 0;
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
</style>
