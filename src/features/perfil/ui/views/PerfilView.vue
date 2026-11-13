<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  ArrowLeft,
  Calendar,
  Car,
  CircleCheck,
  GraduationCap,
  ShieldCheck,
  Star,
} from 'lucide-vue-next'
import { fechaCorta, fechaHora, horaCorta, mxn } from '@/core/utils/formato'
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

/** HU-12, regla 1: el bloque de vehículo solo se muestra a conductores. */
const esConductor = computed(() => perfil.value?.rol === 'Conductor')

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
  <main class="flex flex-col min-h-full flex-1 bg-[#F3F7FA] text-[#1D2D44] relative">
    <header class="bg-[#1D2D44] text-white px-4 pt-4 pb-4 md:px-8 md:py-6 shadow-md shrink-0">
      <div class="md:max-w-6xl md:mx-auto">
        <div class="flex items-center justify-between mb-2">
          <RouterLink
            :to="{ name: 'inicio' }"
            class="flex items-center gap-1 text-xs text-[#C9DCE8] hover:text-white transition-colors"
          >
            <ArrowLeft class="w-4 h-4" aria-hidden="true" />
            <span>Volver</span>
          </RouterLink>
          <div
            v-if="perfil?.correoVerificado"
            class="flex items-center gap-1 bg-emerald-500/20 border border-emerald-400/30 px-2 py-0.5 rounded-full text-[10px] font-bold text-emerald-300"
          >
            <ShieldCheck class="w-3.5 h-3.5" aria-hidden="true" />
            <span>UTTT Verificado</span>
          </div>
          <span class="text-[11px] font-mono text-[#8AA9C4]">{{ perfil?.rol }}</span>
        </div>

        <template v-if="perfil">
          <div class="md:flex md:items-center md:gap-8">
            <div class="flex items-center gap-3 mt-1 md:flex-1">
              <div class="relative shrink-0">
                <img
                  v-if="perfil.fotoUrl"
                  :src="perfil.fotoUrl"
                  :alt="perfil.nombreCompleto"
                  class="w-14 h-14 md:w-20 md:h-20 rounded-2xl object-cover border-2 border-[#8AA9C4] shadow-sm"
                />
                <div
                  v-else
                  class="w-14 h-14 md:w-20 md:h-20 rounded-2xl border-2 border-[#8AA9C4] shadow-sm bg-[#3E5C76] flex items-center justify-center text-lg md:text-2xl font-black"
                  aria-hidden="true"
                >
                  {{ iniciales }}
                </div>
                <div
                  v-if="perfil.correoVerificado"
                  class="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-1 shadow-xs"
                >
                  <CircleCheck class="w-3 h-3 text-white" aria-hidden="true" />
                </div>
              </div>
              <div class="flex-1 min-w-0">
                <h1
                  class="text-base md:text-2xl font-extrabold text-white flex items-center gap-1.5 font-sans"
                >
                  <span class="truncate">{{ perfil.nombreCompleto }}</span>
                </h1>
                <p class="text-[11px] text-[#C9DCE8]">
                  {{ perfil.carrera
                  }}<template v-if="perfil.cuatrimestre">
                    • {{ perfil.cuatrimestre }}° Cuatrimestre</template
                  >
                </p>
                <div class="flex items-center gap-2 mt-1 flex-wrap">
                  <span class="text-[10px] font-mono bg-white/10 px-2 py-0.5 rounded text-white">
                    Matrícula: {{ perfil.matricula }}
                  </span>
                  <span class="text-[10px] font-bold text-amber-300 flex items-center gap-0.5">
                    <Star class="w-3 h-3 fill-amber-300" aria-hidden="true" />
                    <span>{{ perfil.calificacion.toFixed(1) }} / 5.0</span>
                  </span>
                </div>
              </div>
            </div>

            <section
              class="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/15 text-center md:mt-0 md:pt-0 md:border-t-0 md:w-[420px] md:shrink-0"
              aria-label="Estadísticas"
            >
              <div class="bg-white/5 rounded-xl p-1.5">
                <span class="text-sm md:text-xl font-black text-white block">
                  {{ perfil.estadisticas.viajesRealizados }}
                </span>
                <span class="text-[9px] text-[#C9DCE8]">Viajes Hechos</span>
              </div>
              <div class="bg-white/5 rounded-xl p-1.5">
                <span class="text-sm md:text-xl font-black text-emerald-300 block">
                  {{ mxn(perfil.estadisticas.ahorroCombustible) }}
                </span>
                <span class="text-[9px] text-[#C9DCE8]">Ahorro Gasolina</span>
              </div>
              <div class="bg-white/5 rounded-xl p-1.5">
                <span class="text-sm md:text-xl font-black text-sky-300 block">
                  {{ perfil.estadisticas.co2EvitadoKg.toFixed(0) }} kg
                </span>
                <span class="text-[9px] text-[#C9DCE8]">CO₂ Evitado</span>
              </div>
            </section>
          </div>
        </template>
      </div>
    </header>

    <div
      v-if="perfil"
      class="bg-white px-4 py-2 md:px-8 md:py-3 border-b border-[#C9DCE8] shrink-0"
    >
      <nav
        class="grid grid-cols-3 gap-1 bg-[#F3F7FA] p-1 rounded-xl border border-[#C9DCE8] md:max-w-2xl md:mx-auto"
        aria-label="Secciones del perfil"
      >
        <button
          v-for="p in pestanas"
          :key="p.valor"
          type="button"
          class="py-1.5 text-xs font-bold rounded-lg transition-all"
          :class="
            pestana === p.valor
              ? 'bg-[#1D2D44] text-white shadow-xs'
              : 'text-[#4B5563] hover:text-[#1D2D44]'
          "
          :aria-pressed="pestana === p.valor"
          @click="cambiarPestana(p.valor)"
        >
          {{ p.texto }}
        </button>
      </nav>
    </div>

    <div class="flex-1 p-4 space-y-3 pb-8 md:px-8 md:py-8 md:max-w-[76rem] md:mx-auto md:w-full">
      <AlertMessage v-if="errorPerfil" tipo="error">{{ mensajeDeError(errorPerfil) }}</AlertMessage>
      <p v-if="cargandoPerfil && !perfil" class="py-8 text-center text-xs text-[#4B5563]">
        Cargando tu perfil…
      </p>

      <template v-if="perfil">
        <!-- Historial Viajes -->
        <div v-if="pestana === 'historial'" class="space-y-3">
          <div class="flex items-center justify-between gap-2">
            <h2 class="text-xs font-extrabold text-[#1D2D44] font-sans">
              Registro Histórico de Viajes ({{ historial.length }})
            </h2>
            <div class="flex gap-1" role="group" aria-label="Filtrar por rol">
              <button
                v-for="f in filtrosRol"
                :key="f.valor"
                type="button"
                class="px-2 py-0.5 rounded-md text-[10px] font-bold capitalize transition-colors"
                :class="
                  filtroRol === f.valor
                    ? 'bg-[#1D2D44] text-white'
                    : 'bg-white border border-[#C9DCE8] text-[#4B5563]'
                "
                :aria-pressed="filtroRol === f.valor"
                @click="cargarHistorial(f.valor)"
              >
                {{ f.texto }}
              </button>
            </div>
          </div>

          <AlertMessage v-if="errorHistorial" tipo="error">
            {{ mensajeDeError(errorHistorial) }}
          </AlertMessage>
          <p v-if="cargandoHistorial" class="py-6 text-center text-xs text-[#4B5563]">Cargando…</p>
          <p
            v-else-if="!errorHistorial && historial.length === 0"
            class="py-6 text-center text-xs text-[#4B5563]"
          >
            No hay viajes en esta categoría todavía.
          </p>

          <ul class="space-y-3 md:space-y-0 md:grid md:grid-cols-2 md:gap-4">
            <li
              v-for="h in historial"
              :key="h.viajeId"
              class="p-3.5 rounded-2xl bg-white border border-[#C9DCE8] shadow-xs space-y-2.5"
            >
              <div class="flex items-center justify-between gap-2 pb-2 border-b border-[#EDEDED]">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span
                    class="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded"
                    :class="
                      h.rolEnViaje === 'Conductor'
                        ? 'bg-sky-100 text-sky-800'
                        : 'bg-emerald-100 text-emerald-800'
                    "
                  >
                    {{ textoRolEnViaje[h.rolEnViaje] }}
                  </span>
                  <span class="text-[11px] text-[#4B5563] flex items-center gap-1">
                    <Calendar class="w-3 h-3 text-[#3E5C76]" aria-hidden="true" />
                    {{ fechaCorta(h.fechaSalida) }} • {{ horaCorta(h.fechaSalida) }}
                  </span>
                </div>
                <span class="text-xs font-black text-emerald-700 shrink-0">
                  {{ mxn(h.monto) }} MXN
                </span>
              </div>
              <div class="space-y-1 text-xs">
                <div class="flex items-center gap-2">
                  <div class="w-2 h-2 rounded-full bg-[#1D2D44] shrink-0" aria-hidden="true" />
                  <span class="font-semibold text-[#1D2D44]">{{ h.origen }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <div class="w-2 h-2 rounded-full bg-emerald-600 shrink-0" aria-hidden="true" />
                  <span class="font-semibold text-emerald-800">{{ h.destino }}</span>
                </div>
              </div>
              <div
                v-if="h.companero"
                class="text-[11px] text-[#4B5563] bg-[#F8FAFC] p-2 rounded-xl flex items-center justify-between gap-2"
              >
                <span>
                  Con: <strong>{{ h.companero.nombreCompleto }}</strong>
                  <template v-if="h.companero.vehiculo"> ({{ h.companero.vehiculo }})</template>
                </span>
                <span class="flex items-center gap-0.5 text-amber-600 font-bold shrink-0">
                  <Star class="w-3 h-3 fill-amber-500" aria-hidden="true" />
                  {{ h.companero.calificacion.toFixed(1) }}
                </span>
              </div>
              <div
                v-if="h.aportePagado || (h.companero && pendientePara(h.viajeId))"
                class="pt-1 flex items-center justify-between gap-2"
              >
                <span
                  v-if="h.aportePagado"
                  class="text-[10px] text-emerald-700 font-semibold flex items-center gap-1"
                >
                  <CircleCheck class="w-3 h-3" aria-hidden="true" />
                  Aporte de combustible liquidado
                </span>
                <span v-else />
                <EvaluarCompanero
                  v-if="h.companero && pendientePara(h.viajeId)"
                  :viaje-id="h.viajeId"
                  :evaluado-id="pendientePara(h.viajeId)!.evaluadoId"
                  :evaluado-nombre="h.companero.nombreCompleto"
                  @calificado="cargarPendientes"
                />
              </div>
            </li>
          </ul>
        </div>

        <!-- Calificación Mutua -->
        <div v-else-if="pestana === 'calificacion'" class="space-y-3">
          <AlertMessage v-if="errorReputacion" tipo="error">
            {{ mensajeDeError(errorReputacion) }}
          </AlertMessage>
          <p
            v-if="cargandoReputacion && !reputacion"
            class="py-6 text-center text-xs text-[#4B5563]"
          >
            Cargando…
          </p>

          <template v-if="reputacion">
            <section
              class="p-4 rounded-2xl bg-gradient-to-br from-[#1D2D44] to-[#2A4365] text-white shadow-xs"
            >
              <span class="text-[10px] font-bold uppercase tracking-wider text-[#8AA9C4] block">
                Reputación Institucional UTTT
              </span>
              <div class="flex items-baseline gap-2 mt-0.5">
                <span class="text-3xl font-black text-white">
                  {{ reputacion.promedio.toFixed(1) }}
                </span>
                <span class="text-xs text-amber-300 flex" aria-hidden="true">
                  {{ '★'.repeat(Math.round(reputacion.promedio)) }}
                </span>
              </div>
              <span class="text-[11px] text-[#C9DCE8] mt-1 block">
                Basado en {{ reputacion.totalCalificaciones }} evaluaciones mutuas verificadas
              </span>
              <div
                v-if="reputacion.etiquetas.length"
                class="mt-3 pt-3 border-t border-white/20 flex flex-wrap gap-1.5"
              >
                <span
                  v-for="e in reputacion.etiquetas"
                  :key="e.etiqueta"
                  class="px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-medium"
                >
                  ✓ {{ e.etiqueta }} × {{ e.total }}
                </span>
              </div>
            </section>

            <h2 class="text-xs font-bold text-[#1D2D44] px-1 font-sans">
              Comentarios y Reseñas Mutuas Recientes:
            </h2>
            <p
              v-if="reputacion.resenas.items.length === 0"
              class="py-6 text-center text-xs text-[#4B5563]"
            >
              Aún no tienes reseñas.
            </p>
            <ul class="space-y-3 md:space-y-0 md:grid md:grid-cols-2 md:gap-4">
              <li
                v-for="r in reputacion.resenas.items"
                :key="r.id"
                class="p-3.5 rounded-2xl bg-white border border-[#C9DCE8] shadow-xs space-y-2"
              >
                <div class="flex items-start justify-between gap-2">
                  <div>
                    <div class="text-xs font-extrabold text-[#1D2D44]">{{ r.evaluadorNombre }}</div>
                    <div class="text-[10px] text-[#4B5563]">
                      {{ r.evaluadorCarrera }} •
                      <span class="font-semibold text-[#0284C7]">{{ fechaHora(r.creadoEn) }}</span>
                    </div>
                  </div>
                  <div
                    class="flex items-center gap-0.5 text-amber-500 text-xs font-bold shrink-0"
                    :aria-label="`${r.estrellas} de 5 estrellas`"
                  >
                    {{ '★'.repeat(r.estrellas) }}
                  </div>
                </div>
                <p
                  v-if="r.comentario"
                  class="text-xs text-[#1D2D44] bg-[#F8FAFC] p-2.5 rounded-xl leading-relaxed italic"
                >
                  "{{ r.comentario }}"
                </p>
                <div v-if="r.etiquetas.length" class="flex flex-wrap gap-1 pt-1">
                  <span
                    v-for="e in r.etiquetas"
                    :key="e"
                    class="text-[9px] font-semibold bg-[#EAF2F8] text-[#1D2D44] px-2 py-0.5 rounded-full border border-[#C9DCE8]"
                  >
                    {{ e }}
                  </span>
                </div>
              </li>
            </ul>
          </template>
        </div>

        <!-- Credenciales UTTT -->
        <div v-else class="space-y-3">
          <AlertMessage v-if="errorCredenciales" tipo="error">
            {{ mensajeDeError(errorCredenciales) }}
          </AlertMessage>
          <p
            v-if="cargandoCredenciales && !credenciales"
            class="py-6 text-center text-xs text-[#4B5563]"
          >
            Cargando…
          </p>

          <template v-if="credenciales">
            <section class="p-4 rounded-2xl bg-white border border-[#C9DCE8] shadow-xs space-y-3">
              <h2
                class="flex items-center gap-2 text-xs font-bold text-[#1D2D44] pb-2 border-b border-[#EDEDED] font-sans"
              >
                <GraduationCap class="w-4 h-4 text-[#0284C7]" aria-hidden="true" />
                <span>Ficha Institucional UTTT</span>
              </h2>
              <dl class="grid grid-cols-2 gap-2 text-xs">
                <div class="p-2 rounded-xl bg-[#F8FAFC] min-w-0">
                  <dt class="text-[10px] text-[#4B5563] block">Correo Oficial</dt>
                  <dd class="font-bold text-[#1D2D44] truncate block">
                    {{ credenciales.correoInstitucional }}
                  </dd>
                  <dd
                    v-if="credenciales.correoVerificado"
                    class="text-[10px] font-semibold text-emerald-700"
                  >
                    ✓ Verificado
                  </dd>
                  <dd v-else class="text-[10px] font-semibold text-amber-700">Pendiente</dd>
                </div>
                <div class="p-2 rounded-xl bg-[#F8FAFC]">
                  <dt class="text-[10px] text-[#4B5563] block">Matrícula</dt>
                  <dd class="font-bold text-[#1D2D44]">{{ credenciales.matricula }}</dd>
                </div>
                <div class="p-2 rounded-xl bg-[#F8FAFC]">
                  <dt class="text-[10px] text-[#4B5563] block">Carrera</dt>
                  <dd class="font-bold text-[#1D2D44]">{{ credenciales.carrera }}</dd>
                </div>
                <div class="p-2 rounded-xl bg-[#F8FAFC]">
                  <dt class="text-[10px] text-[#4B5563] block">Estatus</dt>
                  <dd
                    class="font-bold"
                    :class="credenciales.correoVerificado ? 'text-emerald-700' : 'text-amber-700'"
                  >
                    {{ credenciales.estatus }}
                  </dd>
                </div>
              </dl>
            </section>

            <p
              v-if="esConductor && credenciales.vehiculos.length === 0"
              class="p-4 rounded-2xl bg-white border border-dashed border-[#C9DCE8] text-center text-xs text-[#4B5563]"
            >
              Aún no tienes un vehículo registrado para carpooling.
            </p>
            <section
              v-for="v in esConductor ? credenciales.vehiculos : []"
              :key="v.id"
              class="p-4 rounded-2xl bg-white border border-[#C9DCE8] shadow-xs space-y-3"
            >
              <div class="flex items-center justify-between pb-2 border-b border-[#EDEDED]">
                <h2 class="flex items-center gap-2 text-xs font-bold text-[#1D2D44] font-sans">
                  <Car class="w-4 h-4 text-[#0284C7]" aria-hidden="true" />
                  <span>Vehículo para Carpooling</span>
                </h2>
                <span
                  class="text-[10px] font-bold px-2 py-0.5 rounded"
                  :class="
                    v.verificado ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  "
                >
                  {{ v.verificado ? 'Verificado' : 'Pendiente' }}
                </span>
              </div>
              <dl class="text-xs space-y-1.5">
                <div class="flex justify-between gap-2">
                  <dt class="text-[#4B5563]">Auto:</dt>
                  <dd class="font-bold text-[#1D2D44] text-right">
                    {{ v.modelo }} ({{ v.color }})
                  </dd>
                </div>
                <div class="flex justify-between gap-2">
                  <dt class="text-[#4B5563]">Año:</dt>
                  <dd class="font-semibold text-[#1D2D44]">{{ v.anio }}</dd>
                </div>
                <div class="flex justify-between gap-2">
                  <dt class="text-[#4B5563]">Placas:</dt>
                  <dd
                    class="font-mono font-black text-[#1D2D44] bg-[#EAF2F8] px-2 py-0.5 rounded border border-[#C9DCE8]"
                  >
                    {{ v.placas }}
                  </dd>
                </div>
                <div class="flex justify-between gap-2">
                  <dt class="text-[#4B5563]">Capacidad Autorizada:</dt>
                  <dd class="font-bold text-[#1D2D44]">{{ v.capacidad }} Pasajeros + Conductor</dd>
                </div>
              </dl>
            </section>

            <div
              class="p-3 rounded-xl bg-[#EAF2F8] border border-[#C9DCE8] flex items-start gap-2.5 text-xs text-[#1D2D44]"
            >
              <ShieldCheck class="w-4 h-4 text-[#0284C7] shrink-0 mt-0.5" aria-hidden="true" />
              <p class="text-[11px] leading-relaxed">
                Toda la información vehicular y académica está respaldada por el sistema de
                verificación institucional de la UTTT para garantizar viajes 100% seguros.
              </p>
            </div>
          </template>
        </div>
      </template>
    </div>
  </main>
</template>
